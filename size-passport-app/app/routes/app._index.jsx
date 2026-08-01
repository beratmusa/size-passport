import { useState, useMemo, useEffect } from "react";
import { useLoaderData, Link, useSubmit, useActionData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";
import { parseMetafieldSizeChart } from "../lib/sizeChartParser";

// Helper function to normalize category and sub_category
const detectCategoryAndSub = (type, title) => {
  const combined = `${type || ''} ${title || ''}`.toLowerCase();
  
  // Mapping of keywords to strictly allowed sub_categories and categories based on DB
  // Allowed DB sub_categories: shorts, hoodie, t-shirt, blazer, sweatshirt, shirt, jeans, jacket, jean, pants
  const categoryMap = [
    { keywords: ['shirt', 'gömlek', 'blouse', 'bluz'], cat: 'top', sub: 'shirt' },
    { keywords: ['t-shirt', 'tshirt', 'tişört', 'atlet', 'tank'], cat: 'top', sub: 't-shirt' },
    { keywords: ['hoodie', 'kapüşonlu'], cat: 'top', sub: 'hoodie' },
    { keywords: ['sweatshirt', 'kazak', 'hırka', 'sweater'], cat: 'top', sub: 'sweatshirt' },
    { keywords: ['blazer'], cat: 'top', sub: 'blazer' },
    { keywords: ['jacket', 'coat', 'ceket', 'mont', 'outerwear', 'kaban'], cat: 'top', sub: 'jacket' },
    { keywords: ['jeans', 'jean', 'denim', 'kot'], cat: 'bottom', sub: 'jeans' },
    { keywords: ['shorts', 'şort'], cat: 'bottom', sub: 'shorts' },
    { keywords: ['pants', 'trousers', 'pantolon', 'leggings', 'tayt', 'eşofman', 'sweatpants', 'skirt', 'etek'], cat: 'bottom', sub: 'pants' }
  ];

  for (const rule of categoryMap) {
    if (rule.keywords.some(kw => combined.includes(kw))) {
      return { category: rule.cat, subCategory: rule.sub };
    }
  }

  // Fallback logic
  const topKeywords = ['top', 'üst', 'giyim'];
  const bottomKeywords = ['bottom', 'alt'];

  if (bottomKeywords.some(kw => combined.includes(kw))) return { category: 'bottom', subCategory: 'pants' };
  if (topKeywords.some(kw => combined.includes(kw))) return { category: 'top', subCategory: 't-shirt' };
  
  return { category: 'top', subCategory: 't-shirt' }; // Ultimate default
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // 1. Get or create the shop
  let { data: shopData } = await supabase
    .from("shops")
    .select("id, metafield_namespace, metafield_key, unit_system")
    .eq("shop_domain", shop)
    .single();

  if (!shopData) {
    const { data: newShop } = await supabase
      .from("shops")
      .insert([{ shop_domain: shop }])
      .select("id, metafield_namespace, metafield_key, unit_system")
      .single();
    shopData = newShop;
  }

  if (!shopData) {
    return { success: false, error: "Could not find or create shop in database." };
  }

  // 1.5 Fetch Store Templates
  const { data: templates } = await supabase
    .from("size_chart_templates")
    .select("id, target_tags, target_product_types")
    .eq("shop_domain", shop);


  // 2. Fetch all products from Shopify Admin API using GraphQL
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  try {
    while (hasNextPage) {
      const response = await admin.graphql(
        `#graphql
        query getProducts($first: Int!, $after: String, $namespace: String!, $key: String!) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                status
                productType
                vendor
                tags
                metafield(namespace: $namespace, key: $key) {
                  value
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`,
        {
          variables: {
            first: 50,
            after: cursor,
            namespace: shopData.metafield_namespace || "size_passport",
            key: shopData.metafield_key || "size_chart"
          },
        }
      );

      const responseJson = await response.json();
      const productsData = responseJson?.data?.products;

      if (!productsData) {
        break;
      }

      const edges = productsData.edges || [];
      for (const edge of edges) {
        if (edge.node) {
          allProducts.push(edge.node);
        }
      }

      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor;
    }

    // 3. Upsert products into merchant_products table
    let syncedCount = 0;
    let missingCount = 0;
    
    for (const product of allProducts) {
      const shopifyId = product.id.split("/").pop(); // Convert gid://shopify/Product/123456789 to 123456789
      const { category, subCategory } = detectCategoryAndSub(product.productType, product.title);

      const productTags = product.tags || [];
      const hasMetafield = !!product.metafield?.value;

      // Match template logic
      let matchedTemplateId = null;
      if (templates && templates.length > 0) {
        // Priority 1: Match by tag
        const tagMatch = templates.find(t => t.target_tags && t.target_tags.some(tag => productTags.includes(tag)));
        if (tagMatch) matchedTemplateId = tagMatch.id;
        else {
          // Priority 2: Match by product type
          const typeMatch = templates.find(t => t.target_product_types && t.target_product_types.includes(product.productType));
          if (typeMatch) matchedTemplateId = typeMatch.id;
        }
      }

      let sizeStatus = 'MISSING';
      let dataSource = 'MANUAL';
      let parsedSizes = null;
      
      if (hasMetafield) {
        parsedSizes = parseMetafieldSizeChart(product.metafield.value, shopData.unit_system || 'metric');
        if (parsedSizes && parsedSizes.length > 0) {
          sizeStatus = 'ACTIVE';
          dataSource = 'METAFIELD';
        } else if (matchedTemplateId) {
          sizeStatus = 'ACTIVE';
          dataSource = 'TEMPLATE';
        }
      } else if (matchedTemplateId) {
        sizeStatus = 'ACTIVE';
        dataSource = 'TEMPLATE';
      }

      let productData = {
        shop_id: shopData.id,
        shopify_product_id: shopifyId,
        name: product.title,
        category: category,
        sub_category: subCategory,
        is_active: product.status === 'ACTIVE',
        template_id: matchedTemplateId,
        size_status: sizeStatus,
        data_source: dataSource
      };

      // Check if it exists
      const { data: existingProduct } = await supabase
        .from("merchant_products")
        .select("id, size_status, data_source")
        .eq("shopify_product_id", shopifyId)
        .maybeSingle();

      if (existingProduct) {
        // Preserve manual data if it is active and was entered manually
        if (existingProduct.data_source === 'MANUAL' && existingProduct.size_status === 'ACTIVE') {
          productData.size_status = 'ACTIVE';
          productData.data_source = 'MANUAL';
        }
      }
      
      if (productData.size_status === 'MISSING') {
        missingCount++;
      }

      let error;
      let actualProductId = null;
      
      if (existingProduct) {
        const { data: updatedProduct, error: updateError } = await supabase
          .from("merchant_products")
          .update({
            name: productData.name,
            category: productData.category,
            sub_category: productData.sub_category,
            is_active: productData.is_active,
            template_id: productData.template_id,
            size_status: productData.size_status,
            data_source: productData.data_source
          })
          .eq("id", existingProduct.id)
          .select("id")
          .single();
        error = updateError;
        actualProductId = updatedProduct?.id;
      } else {
        const { data: insertedProduct, error: insertError } = await supabase
          .from("merchant_products")
          .insert(productData)
          .select("id")
          .single();
        error = insertError;
        actualProductId = insertedProduct?.id;
      }

      if (error) {
        console.error(`Error syncing product ${product.title}:`, error);
      } else {
        syncedCount++;
        
        // If parsed metafield successfully, wipe old manual sizes and insert new standardized rows
        if (productData.data_source === 'METAFIELD' && parsedSizes && actualProductId) {
           await supabase.from("merchant_product_sizes").delete().eq("product_id", actualProductId);
           
           const sizeOrderMap = { XS: 1, S: 2, M: 3, L: 4, XL: 5, "2XL": 6, "3XL": 7, XXL: 6 };
           const sizesToInsert = parsedSizes.map(s => ({
              product_id: actualProductId,
              size_label: s.size_label,
              measurements: {
                chest: s.chest_cm,
                waist: s.waist_cm,
                shoulder: s.shoulder_cm,
                arm: s.arm_length_cm,
                length: s.total_length_cm,
                hip: s.hip_cm,
                inseam: s.inseam_cm,
                outseam: s.outseam_cm
              },
              sort_order: sizeOrderMap[s.size_label] || 0
           }));
           
           await supabase.from("merchant_product_sizes").insert(sizesToInsert);
        }
      }
    }

    return { success: true, count: syncedCount, missingCount: missingCount };

  } catch (error) {
    console.error("GraphQL sync error:", error);
    return { success: false, error: error.message };
  }
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // 1. Mağazayı al veya oluştur
  let { data: shopData } = await supabase
    .from("shops")
    .select("id, metafield_namespace, metafield_key, unit_system, language")
    .eq("shop_domain", shop)
    .single();

  if (!shopData) {
    let defaultUnitSystem = 'metric';
    let defaultLanguage = 'en';
    try {
      // Auto-detect unit system based on shop's country code
      const response = await admin.graphql(
        `#graphql
        query {
          shop {
            billingAddress {
              countryCode
            }
          }
        }`
      );
      const resJson = await response.json();
      const countryCode = resJson.data?.shop?.billingAddress?.countryCode;
      
      if (countryCode === 'TR') {
        defaultLanguage = 'tr';
      }

      // US, GB, MM, LR are typically imperial
      if (['US', 'GB', 'MM', 'LR'].includes(countryCode)) {
        defaultUnitSystem = 'imperial';
      }
    } catch (e) {
      console.error("Failed to auto-detect country code:", e);
    }

    const { data: newShop } = await supabase
      .from("shops")
      .insert([{ shop_domain: shop, unit_system: defaultUnitSystem, language: defaultLanguage }])
      .select("id, metafield_namespace, metafield_key, unit_system, language")
      .single();
    shopData = newShop;
  }

  // 2. Ürünleri çek
  const { data: products } = await supabase
    .from("merchant_products")
    .select(`
      id,
      name,
      shopify_product_id,
      category,
      is_active,
      size_status,
      data_source,
      template_id
    `)
    .eq("shop_id", shopData.id)
    .order("name", { ascending: true });

  return { products, shop };
};

export default function Index() {
  const { products, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("ALL"); // ALL, ACTIVE, MISSING

  const isSyncing = navigation.state === "submitting";

  const handleSync = () => {
    submit(null, { method: "post" });
  };

  // Navigasyon sonrası render kontrolü için log
  useEffect(() => {
    console.log("Dashboard rendered. Product count:", products?.length);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchSearch = (product.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (filterMode === "ACTIVE") return product.size_status === "ACTIVE";
      if (filterMode === "MISSING") return product.size_status === "MISSING";
      return true;
    });
  }, [products, searchQuery, filterMode]);
  
  const missingProductCount = products?.filter(p => p.size_status === "MISSING").length || 0;

  return (
    <s-page heading="Size Passport Dashboard">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Link to="/app/guide" style={{ 
          textDecoration: 'none', 
          padding: '10px 18px', 
          backgroundColor: '#f3f4f6', 
          color: '#374151', 
          borderRadius: '10px', 
          fontWeight: '600', 
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          transition: 'all 0.2s'
        }}>
          📖 How to Use
        </Link>
        <Link to="/app" style={{ 
          textDecoration: 'none', 
          padding: '10px 18px', 
          backgroundColor: '#111827', 
          color: '#ffffff', 
          borderRadius: '10px', 
          fontWeight: '600', 
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          📦 Products & Size Charts
        </Link>
        <Link to="/app/analytics" style={{ 
          textDecoration: 'none', 
          padding: '10px 18px', 
          backgroundColor: '#f3f4f6', 
          color: '#374151', 
          borderRadius: '10px', 
          fontWeight: '600', 
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          transition: 'all 0.2s'
        }}>
          📊 Analytics & Return Metrics
        </Link>
        <Link to="/app/settings" style={{ 
          textDecoration: 'none', 
          padding: '10px 18px', 
          backgroundColor: '#f3f4f6', 
          color: '#374151', 
          borderRadius: '10px', 
          fontWeight: '600', 
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          transition: 'all 0.2s'
        }}>
          ⚙️ Settings
        </Link>
      </div>
      {actionData && (
        <s-section>
          {actionData.success ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#e3fcef', 
                color: '#008060', 
                borderRadius: '8px', 
                border: '1px solid #aee9d1',
                fontWeight: '500'
              }}>
                ✓ Successfully synced {actionData.count} products from your store.
              </div>
              {actionData.missingCount > 0 && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fff4e6', 
                  color: '#b98900', 
                  borderRadius: '8px', 
                  border: '1px solid #ffe4b5',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ <b>{actionData.missingCount} products are missing size charts.</b> Please add them or assign templates!
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fedad3', 
              color: '#c41818', 
              borderRadius: '8px', 
              border: '1px solid #f8b4b4',
              fontWeight: '500'
            }}>
              ✗ Sync failed: {actionData.error || "Unknown error"}
            </div>
          )}
        </s-section>
      )}

      <s-section heading={`Welcome, ${shop}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <s-paragraph>
            Manage your products and size charts below. Products synced from your Shopify store are listed here.
          </s-paragraph>
          <s-button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="primary"
          >
            {isSyncing ? "Syncing..." : "Sync Products from Store"}
          </s-button>
        </div>
      </s-section>

      {/* Arama Çubuğunu da bir s-section içine alıyoruz ki navigasyonda kaybolmasın */}
      <s-section heading="Product Search">
        <div style={{ marginTop: '10px' }}>
          <input 
            type="text" 
            placeholder="Search by product name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #c9cccf',
              fontSize: '15px',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff'
            }}
          />
        </div>
      </s-section>

      <s-section heading="Product Inventory">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
           <button onClick={() => setFilterMode("ALL")} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: filterMode === "ALL" ? '#111827' : '#fff', color: filterMode === "ALL" ? '#fff' : '#333', fontWeight: '500' }}>All ({products?.length || 0})</button>
           <button onClick={() => setFilterMode("ACTIVE")} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '20px', border: '1px solid #aee9d1', backgroundColor: filterMode === "ACTIVE" ? '#e3fcef' : '#fff', color: filterMode === "ACTIVE" ? '#008060' : '#333', fontWeight: '500' }}>✅ Active</button>
           <button onClick={() => setFilterMode("MISSING")} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '20px', border: '1px solid #f8b4b4', backgroundColor: filterMode === "MISSING" ? '#fedad3' : '#fff', color: filterMode === "MISSING" ? '#c41818' : '#333', fontWeight: '500' }}>🔴 Missing Data ({missingProductCount})</button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          {!filteredProducts || filteredProducts.length === 0 ? (
            <s-paragraph>
              {searchQuery ? "No products found matching your search." : "No products found. Products will appear here once they are synced via webhooks."}
            </s-paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProducts.map(product => (
                <div key={product.id} style={{ 
                  padding: '16px', 
                  border: '1px solid #e1e3e5', 
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ffffff'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {product.name}
                      {product.size_status === 'MISSING' && (
                        <span style={{ fontSize: '11px', backgroundColor: '#fedad3', color: '#c41818', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>🔴 Missing Data</span>
                      )}
                      {product.size_status === 'ACTIVE' && (
                        <span style={{ fontSize: '11px', backgroundColor: '#e3fcef', color: '#008060', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'capitalize' }}>✅ Active ({product.data_source})</span>
                      )}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6d7175' }}>
                      Category: {product.category || 'Uncategorized'} | Status: {product.is_active ? 'Active' : 'Draft'}
                    </p>
                  </div>
                  <Link to={`/app/products/${product.id}`} style={{ textDecoration: 'none' }}>
                    <s-button>Edit Size Chart</s-button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

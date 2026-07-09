import { useState, useMemo, useEffect } from "react";
import { useLoaderData, Link, useSubmit, useActionData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

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
    .select("id")
    .eq("shop_domain", shop)
    .single();

  if (!shopData) {
    const { data: newShop } = await supabase
      .from("shops")
      .insert([{ shop_domain: shop }])
      .select("id")
      .single();
    shopData = newShop;
  }

  if (!shopData) {
    return { success: false, error: "Could not find or create shop in database." };
  }

  // 2. Fetch all products from Shopify Admin API using GraphQL
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  try {
    while (hasNextPage) {
      const response = await admin.graphql(
        `#graphql
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                status
                productType
                vendor
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
    for (const product of allProducts) {
      const shopifyId = product.id.split("/").pop(); // Convert gid://shopify/Product/123456789 to 123456789
      const { category, subCategory } = detectCategoryAndSub(product.productType, product.title);

      const productData = {
        shop_id: shopData.id,
        shopify_product_id: shopifyId,
        name: product.title,
        category: category,
        sub_category: subCategory,
        is_active: product.status === 'ACTIVE',
      };

      // Check if it exists
      const { data: existingProduct } = await supabase
        .from("merchant_products")
        .select("id")
        .eq("shopify_product_id", shopifyId)
        .maybeSingle();

      let error;
      if (existingProduct) {
        const { error: updateError } = await supabase
          .from("merchant_products")
          .update({
            name: productData.name,
            category: productData.category,
            sub_category: productData.sub_category,
            is_active: productData.is_active,
          })
          .eq("id", existingProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("merchant_products")
          .insert(productData);
        error = insertError;
      }

      if (error) {
        console.error(`Error syncing product ${product.title}:`, error);
      } else {
        syncedCount++;
      }
    }

    return { success: true, count: syncedCount };

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
    .select("id")
    .eq("shop_domain", shop)
    .single();

  if (!shopData) {
    const { data: newShop } = await supabase
      .from("shops")
      .insert([{ shop_domain: shop }])
      .select("id")
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
      is_active
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
    return products.filter(product => 
      (product.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <s-page heading="Size Passport Dashboard">
      {actionData && (
        <s-section>
          {actionData.success ? (
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
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{product.name}</h3>
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

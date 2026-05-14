import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

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

  return (
    <s-page heading="Size Passport Dashboard">
      <s-section heading={`Welcome, ${shop}`}>
        <s-paragraph>
          Manage your products and size charts below. Products synced from your Shopify store are listed here.
        </s-paragraph>
      </s-section>

      <s-section heading="Product Inventory">
        <div style={{ marginTop: '20px' }}>
          {!products || products.length === 0 ? (
            <s-paragraph>No products found. Products will appear here once they are synced via webhooks.</s-paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products.map(product => (
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
                      Category: {product.category} | Status: {product.is_active ? 'Active' : 'Draft'}
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

import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

export const action = async ({ request }) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const { data: shopData } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shop)
    .single();

  if (shopData) {
    const productData = {
      shop_id: shopData.id,
      shopify_product_id: payload.id.toString(),
      name: payload.title,
      category: payload.product_type || "Uncategorized",
      sub_category: payload.product_type || "Uncategorized",
      is_active: payload.status === 'active',
    };

    const { error } = await supabase
      .from("merchant_products")
      .upsert(productData, { onConflict: 'shopify_product_id' });
    
    if (error) {
      console.error("Error inserting product into Supabase:", error);
    }
  }

  return new Response();
};

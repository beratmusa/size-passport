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

    // Manual Upsert: First check if it exists
    const { data: existingProduct } = await supabase
      .from("merchant_products")
      .select("id")
      .eq("shopify_product_id", productData.shopify_product_id)
      .maybeSingle();

    let error;
    if (existingProduct) {
      const { error: updateError } = await supabase
        .from("merchant_products")
        .update(productData)
        .eq("id", existingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("merchant_products")
        .insert(productData);
      error = insertError;
    }
    
    if (error) {
      console.error("Error updating product in Supabase:", error);
    }
  }

  return new Response();
};

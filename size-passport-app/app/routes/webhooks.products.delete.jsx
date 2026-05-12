import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

export const action = async ({ request }) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const { error } = await supabase
    .from("merchant_products")
    .delete()
    .eq("shopify_product_id", payload.id.toString());
  
  if (error) {
    console.error("Error deleting product from Supabase:", error);
  }

  return new Response();
};

import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Mağazayı Supabase'e kaydet (yoksa)
  const { data: existingShop, error } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shop)
    .maybeSingle();

  if (!existingShop && !error) {
    await supabase.from("shops").insert([{ shop_domain: shop }]);
  }

  return { shop };
};

export default function Index() {
  const { shop } = useLoaderData();

  return (
    <s-page heading="Size Passport Settings">
      <s-section heading={`Welcome, ${shop}`}>
        <s-paragraph>
          Your store is now connected to Size Passport. Next steps are to configure your store's theme to display the Size Passport widget on product pages.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

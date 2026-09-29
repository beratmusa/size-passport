import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { fetchActiveSubscription } from "../partner-api.server";

import { supabase } from "../supabase.server";
import { t } from "../lib/i18n";

/* global process */
export const loader = async ({ request }) => {
  const { admin, session, redirect } = await authenticate.admin(request);
  
  // App Handle: Shopify Partner Dashboard'daki uygulama adınız (URL'deki uzantı)
  const appHandle = process.env.SHOPIFY_APP_HANDLE || "size-passport"; 
  const storeHandle = session.shop.replace(".myshopify.com", "");

  const shopResponse = await admin.graphql(`{ shop { id } }`);
  const shopResponseJson = await shopResponse.json();
  const shopId = shopResponseJson.data?.shop?.id;

  if (shopId) {
    const subscription = await fetchActiveSubscription(shopId);
    
    // Aktif bir abonelik yoksa (ve Partner API ayarları yapılmışsa) plana yönlendir.
    if (!subscription && process.env.SHOPIFY_PARTNER_API_ACCESS_TOKEN) {
      return redirect(`https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`, {
        target: "_top", // Uygulama dışı bir Shopify sayfasına yönlendirdiğimiz için _top olmalı
        headers: {
          "Set-Cookie": `billing_shop=${session.shop}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
        },
      });
    }
  }

  // Fetch language from Supabase
  let lang = 'en';
  if (session?.shop) {
    const { data } = await supabase.from('shops').select('language').eq('shop_domain', session.shop).single();
    if (data?.language) lang = data.language;
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "", lang };
};

export default function App() {
  const { apiKey, lang } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/guide">Guide</s-link>
        <s-link href="/app">Products</s-link>
        <s-link href="/app/analytics">Analytics</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

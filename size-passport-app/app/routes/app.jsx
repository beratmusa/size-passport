import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate, MONTHLY_PLAN } from "../shopify.server";

import { supabase } from "../supabase.server";
import { t } from "../lib/i18n";

/* global process */
export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  
  const isTest = process.env.NODE_ENV !== "production";

  await billing.require({
    plans: [MONTHLY_PLAN],
    isTest: isTest,
    onFailure: async () => billing.request({
      plan: MONTHLY_PLAN,
      isTest: isTest,
    }),
  });
  
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
        <s-link href="/app/guide">{t('navGuide', lang)}</s-link>
        <s-link href="/app">{t('navProducts', lang)}</s-link>
        <s-link href="/app/analytics">{t('navAnalytics', lang)}</s-link>
        <s-link href="/app/settings">{t('navSettings', lang)}</s-link>
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

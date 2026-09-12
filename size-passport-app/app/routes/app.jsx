import { Outlet, useLoaderData, useRouteError, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

import { supabase } from "../supabase.server";
import { t } from "../lib/i18n";

/* global process */
export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  

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
  const navigation = useNavigation();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/guide">Guide</s-link>
        <s-link href="/app">Products</s-link>
        <s-link href="/app/analytics">Analytics</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      {navigation.state === "loading" ? (
        <DashboardSkeleton />
      ) : (
        <Outlet />
      )}
    </AppProvider>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton {
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-repeat: no-repeat;
          background-size: 1000px 100%; 
          animation-duration: 1.5s;
          animation-fill-mode: forwards; 
          animation-iteration-count: infinite;
          animation-name: shimmer;
          animation-timing-function: linear;
          border-radius: 8px;
        }
      `}</style>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title Skeleton */}
        <div className="skeleton" style={{ height: '36px', width: '30%', borderRadius: '8px' }} />
        
        {/* Top Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ border: '1px solid #e1e3e5', padding: '20px', borderRadius: '12px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton" style={{ height: '24px', width: '50%' }} />
              <div className="skeleton" style={{ height: '48px', width: '80%' }} />
              <div className="skeleton" style={{ height: '16px', width: '40%' }} />
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div style={{ border: '1px solid #e1e3e5', borderRadius: '12px', backgroundColor: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="skeleton" style={{ height: '28px', width: '25%', marginBottom: '12px' }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid #f1f2f4', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60%' }}>
                <div className="skeleton" style={{ height: '20px', width: '100%' }} />
                <div className="skeleton" style={{ height: '16px', width: '60%' }} />
              </div>
              <div className="skeleton" style={{ height: '36px', width: '120px', borderRadius: '6px' }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

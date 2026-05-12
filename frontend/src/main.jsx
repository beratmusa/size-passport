import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WidgetApp from './WidgetApp.jsx'
import './i18n';

function initSizePassport() {
  const container = document.getElementById('size-passport-root');

  if (container) {
    // Prevent double initialization
    if (container.dataset.rendered === 'true') return;
    container.dataset.rendered = 'true';

    const productId = container.dataset.productId;
    const productTitle = container.dataset.productTitle;
    const shopDomain = container.dataset.shopDomain;

    try {
      // Loading mesajını kaldırdık, React doğrudan render edecek.
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <WidgetApp 
            productId={productId} 
            productTitle={productTitle} 
            shopDomain={shopDomain} 
          />
        </StrictMode>
      );
    } catch (e) {
      console.error("Size Passport Initialization Error:", e);
      container.innerHTML = `<div style="background: #ef4444; color: white; padding: 10px; border-radius: 6px; font-size: 12px;">Size Passport Error: ${e.message}</div>`;
    }
  } else {
    // If not found, it might be because Shopify is still rendering sections
    console.warn("Size Passport root element not found yet, retrying in 500ms...");
    setTimeout(initSizePassport, 500);
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSizePassport);
} else {
  initSizePassport();
}

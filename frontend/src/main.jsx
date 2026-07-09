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
    let variants = [];
    try {
      variants = JSON.parse(container.dataset.variants || '[]');
    } catch (e) {
      console.error("Error parsing variants data:", e);
    }

    // CTA Configuration from Shopify Editor
    const config = {
      ctaType: container.dataset.ctaType || 'link',
      ctaAlign: container.dataset.ctaAlign || 'flex-start',
      ctaAlignMobile: container.dataset.ctaAlignMobile || 'stretch',
      ctaPaddingX: parseInt(container.dataset.ctaPaddingX) || 12,
      ctaPaddingY: parseInt(container.dataset.ctaPaddingY) || 8,
      ctaScale: parseFloat(container.dataset.ctaScale) || 1.0,
      ctaScaleMobile: parseFloat(container.dataset.ctaScaleMobile) || 1.0,
      ctaBorderRadius: parseInt(container.dataset.ctaBorderRadius) || 8,
      ctaBgColor: container.dataset.ctaBgColor || '#000000',
      ctaTextColor: container.dataset.ctaTextColor || '#ffffff',
      showRecommendation: container.dataset.showRecommendation !== 'false',
      recommendationText: container.dataset.recommendationText || 'AI Recommends: {size}',
      ctaBorderThickness: parseInt(container.dataset.ctaBorderThickness) || 0,
      ctaBorderColor: container.dataset.ctaBorderColor || 'transparent',
      ctaHoverBgColor: container.dataset.ctaHoverBgColor || '',
      ctaHoverTextColor: container.dataset.ctaHoverTextColor || '',
      ctaHoverBorderColor: container.dataset.ctaHoverBorderColor || 'transparent',
      ctaHoverScale: parseFloat(container.dataset.ctaHoverScale) || 1.0,
      recommendationBgColor: container.dataset.recommendationBgColor || '#6366f1',
      recommendationTextColor: container.dataset.recommendationTextColor || '#ffffff',
    };

    try {
      // Loading mesajını kaldırdık, React doğrudan render edecek.
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <WidgetApp 
            productId={productId} 
            productTitle={productTitle} 
            shopDomain={shopDomain} 
            config={config}
            shopifyVariants={variants}
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

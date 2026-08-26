import { Link } from "react-router";

export default function GuidePage() {
  return (
    <s-page heading="📖 Getting Started with Size Passport">
      
      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Link to="/app/guide" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#111827', color: '#ffffff', borderRadius: '10px', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          📖 How to Use
        </Link>
        <Link to="/app" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
          📦 Products & Size Charts
        </Link>
        <Link to="/app/analytics" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
          📊 Analytics & Return Metrics
        </Link>
        <Link to="/app/settings" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
          ⚙️ Settings
        </Link>
      </div>

      <s-section heading="Welcome to Size Passport! 🚀">
        <s-paragraph>
          Size Passport is an AI-powered sizing solution that helps your customers find their perfect fit, reducing returns and increasing conversions. Follow this roadmap to get your store fully set up in minutes.
        </s-paragraph>
      </s-section>

      <s-section heading="📍 Step-by-Step Setup Roadmap">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          
          {/* Step 1 */}
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#111827' }}>
              <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '6px', marginRight: '8px', fontSize: '14px' }}>1</span>
              Configure Your Unit System
            </h3>
            <p style={{ margin: '0 0 12px 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
              Head over to the <strong>Settings</strong> tab and make sure your store's measurement system is correct (Metric/CM or Imperial/Inches). Our smart parser will automatically handle conversions behind the scenes based on this setting.
            </p>
            <Link to="/app/settings" style={{ fontSize: '14px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>→ Go to Settings</Link>
          </div>

          {/* Step 2 */}
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#111827' }}>
              <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '6px', marginRight: '8px', fontSize: '14px' }}>2</span>
              Add Your Size Charts
            </h3>
            <p style={{ margin: '0 0 12px 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
              You have three ways to add size charts to your products:
            </p>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
              <li><strong>AI Auto-Scan (Recommended):</strong> Simply click the "Sync & Auto-Detect Sizes" button on the Dashboard. Our visual AI will scan your product images, extract the size tables, and save them automatically.</li>
              <li><strong>Manual Entry:</strong> Go to the <Link to="/app" style={{color: '#2563eb', textDecoration: 'none'}}>Products & Size Charts</Link> tab, select a product, and type the measurements directly into the table.</li>
              <li><strong>Automatic Sync (Metafields):</strong> If you already store your size charts as JSON data in Shopify Metafields, our system pulls them automatically. You can configure your Metafield Namespace and Key in Settings.</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#111827' }}>
              <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '6px', marginRight: '8px', fontSize: '14px' }}>3</span>
              Enable the Widget on Your Storefront
            </h3>
            <p style={{ margin: '0 0 0 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
              Go to your Shopify Admin, click <strong>Online Store {'>'} Themes {'>'} Customize</strong>. Navigate to your Default Product page. On the left sidebar, click "Add Block" and select <strong>Size Passport</strong>. Drag it right below your Add to Cart button or Size Selector.
            </p>
          </div>

        </div>
      </s-section>

      <s-section heading="❓ Frequently Asked Questions (FAQ)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#111827' }}>Q: How does the AI Size Recommendation work?</h4>
            <p style={{ margin: '0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
              A: When a customer opens the widget, we ask them a few simple questions (or pull their saved profile). Our algorithm compares their body profile with your product's specific size chart to calculate a match score and recommend the best fit.
            </p>
          </div>

          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#111827' }}>Q: What if I use Inches instead of CM?</h4>
            <p style={{ margin: '0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
              A: No problem! Ensure your store is set to 'Imperial' in Settings. You can type inches directly into our manual size chart tables. If you use JSON metafields, our system will automatically detect the inch values and standardize them for the AI engine.
            </p>
          </div>

          <div style={{ paddingBottom: '8px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#111827' }}>Q: Can I customize the look of the "Find My Size" button?</h4>
            <p style={{ margin: '0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
              A: Yes! When you add the Size Passport block in your Shopify Theme Editor, you will see a bunch of settings to change the background color, text color, scale, and border to perfectly match your brand's aesthetics.
            </p>
          </div>

        </div>
      </s-section>
    </s-page>
  );
}

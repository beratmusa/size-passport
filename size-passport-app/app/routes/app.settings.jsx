import { useLoaderData, useSubmit, useNavigation, useActionData, Link } from "react-router";
import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";
import { useState } from "react";
import { t } from "../lib/i18n";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let { data: shopData } = await supabase
    .from("shops")
    .select("*")
    .eq("shop_domain", shop)
    .single();

  if (!shopData) {
    const { data: newShop } = await supabase
      .from("shops")
      .insert([{ shop_domain: shop }])
      .select("*")
      .single();
    shopData = newShop;
  }

  return { shopData };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  const unitSystem = formData.get("unitSystem");
  const metafieldNamespace = formData.get("metafieldNamespace");
  const metafieldKey = formData.get("metafieldKey");
  const language = formData.get("language");

  const { error } = await supabase
    .from("shops")
    .update({
      unit_system: unitSystem,
      metafield_namespace: metafieldNamespace,
      metafield_key: metafieldKey,
      language: language
    })
    .eq("shop_domain", shop);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export default function Settings() {
  const { shopData } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();

  const isSaving = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    unitSystem: shopData?.unit_system || "metric",
    metafieldNamespace: shopData?.metafield_namespace || "size_passport",
    metafieldKey: shopData?.metafield_key || "size_chart",
    language: shopData?.language || "en"
  });

  const handleSave = () => {
    const fd = new FormData();
    fd.append("unitSystem", formState.unitSystem);
    fd.append("metafieldNamespace", formState.metafieldNamespace);
    fd.append("metafieldKey", formState.metafieldKey);
    fd.append("language", formState.language);
    submit(fd, { method: "post" });
  };

  return (
    <s-page heading="App Settings">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Link to="/app/guide" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
          📖 How to Use
        </Link>
        <Link to="/app" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
          📦 Products & Size Charts
        </Link>
        <Link to="/app/analytics" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
          📊 Analytics & Return Metrics
        </Link>
        <Link to="/app/settings" style={{ textDecoration: 'none', padding: '10px 18px', backgroundColor: '#111827', color: '#ffffff', borderRadius: '10px', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          ⚙️ Settings
        </Link>
      </div>

      {actionData?.success && (
        <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0', fontSize: '14px', fontWeight: '500' }}>
          ✓ Settings saved successfully!
        </div>
      )}
      
      {actionData?.error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca', fontWeight: '500', marginBottom: '16px' }}>
          {actionData.error}
        </div>
      )}

      <s-section heading="Metafield Synchronization">
        <s-paragraph>Configure where Size Passport should automatically read your size charts from. If you use Shopify Metafields for your JSON size charts, enter the exact namespace and key here.</s-paragraph>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '600px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Measurement System</label>
            <select 
              value={formState.unitSystem}
              onChange={(e) => setFormState({...formState, unitSystem: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c9cccf', fontSize: '14px', boxSizing: 'border-box' }}
            >
              <option value="metric">Metric - Centimeters (cm)</option>
              <option value="imperial">Imperial - Inches (in)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Widget Language</label>
            <select 
              value={formState.language}
              onChange={(e) => setFormState({...formState, language: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c9cccf', fontSize: '14px', boxSizing: 'border-box' }}
            >
              <option value="en">English (EN)</option>
              <option value="tr">Türkçe (TR)</option>
              <option value="de">Deutsch (DE)</option>
              <option value="fr">Français (FR)</option>
              <option value="it">Italiano (IT)</option>
              <option value="es">Español (ES)</option>
              <option value="nl">Nederlands (NL)</option>
              <option value="pt">Português (PT)</option>
              <option value="sv">Svenska (SV)</option>
              <option value="da">Dansk (DA)</option>
              <option value="ja">日本語 (JA)</option>
              <option value="ko">한국어 (KO)</option>
            </select>
          </div>
        </div>
      </s-section>

      <s-section heading="Shopify Metafield Integration">
        <s-paragraph>If you sync size charts automatically from Shopify Product Metafields, specify the exact namespace and key you use in Shopify. (If you are using our default integration, leave these as <strong>size_passport</strong> and <strong>size_chart</strong>).</s-paragraph>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '600px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Metafield Namespace</label>
            <input 
              type="text" 
              value={formState.metafieldNamespace}
              onChange={(e) => setFormState({...formState, metafieldNamespace: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c9cccf', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Metafield Key</label>
            <input 
              type="text" 
              value={formState.metafieldKey}
              onChange={(e) => setFormState({...formState, metafieldKey: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c9cccf', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </s-section>

      <div style={{ marginTop: '24px' }}>
        <s-button onClick={handleSave} disabled={isSaving} variant="primary">
          {isSaving ? "Saving..." : "Save Settings"}
        </s-button>
      </div>
    </s-page>
  );
}

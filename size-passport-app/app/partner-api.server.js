export async function fetchActiveSubscription(shopId) {
  // Gerekli çevresel değişkenlerin yüklü olduğundan emin olun
  const partnerToken = process.env.SHOPIFY_PARTNER_API_ACCESS_TOKEN;
  const orgId = process.env.SHOPIFY_PARTNER_ORG_ID;
  const appId = process.env.SHOPIFY_APP_GID; // Örn: gid://shopify/App/1234567

  if (!partnerToken || !orgId || !appId) {
    console.warn("EKSİK BİLGİ: Shopify Partner API değişkenleri (.env) tanımlanmamış. Abonelik kontrolü atlanıyor (Test modunda geçici izin).");
    return true; // Test aşamasında uygulamayı tamamen kitlememek için geçici olarak true dönebiliriz. Ancak canlıya almadan önce .env düzeltilmeli.
  }

  const query = `
    query ActiveSubscription($appId: ID!, $shopId: ID!) {
      activeSubscription(appId: $appId, shopId: $shopId) {
        billingPeriod
        items {
          handle
          price {
            ... on FlatRatePrice { amount }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://partners.shopify.com/${orgId}/api/2026-07/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": partnerToken,
      },
      body: JSON.stringify({
        query,
        variables: { appId, shopId },
      }),
    });

    const json = await response.json();

    if (json.errors) {
      console.error("Partner API Error:", json.errors);
      return null;
    }

    return json.data?.activeSubscription;
  } catch (error) {
    console.error("Failed to fetch active subscription:", error);
    return null;
  }
}

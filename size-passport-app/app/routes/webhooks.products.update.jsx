import { authenticate } from "../shopify.server";
import { supabase } from "../supabase.server";

// Helper function to normalize category and sub_category
const detectCategoryAndSub = (type, title) => {
  const combined = `${type || ''} ${title || ''}`.toLowerCase();
  
  // Mapping of keywords to strictly allowed sub_categories and categories based on DB
  // Allowed DB sub_categories: shorts, hoodie, t-shirt, blazer, sweatshirt, shirt, jeans, jacket, jean, pants
  const categoryMap = [
    { keywords: ['shirt', 'gömlek', 'blouse', 'bluz'], cat: 'top', sub: 'shirt' },
    { keywords: ['t-shirt', 'tshirt', 'tişört', 'atlet', 'tank'], cat: 'top', sub: 't-shirt' },
    { keywords: ['hoodie', 'kapüşonlu'], cat: 'top', sub: 'hoodie' },
    { keywords: ['sweatshirt', 'kazak', 'hırka', 'sweater'], cat: 'top', sub: 'sweatshirt' },
    { keywords: ['blazer'], cat: 'top', sub: 'blazer' },
    { keywords: ['jacket', 'coat', 'ceket', 'mont', 'outerwear', 'kaban'], cat: 'top', sub: 'jacket' },
    { keywords: ['jeans', 'jean', 'denim', 'kot'], cat: 'bottom', sub: 'jeans' },
    { keywords: ['shorts', 'şort'], cat: 'bottom', sub: 'shorts' },
    { keywords: ['pants', 'trousers', 'pantolon', 'leggings', 'tayt', 'eşofman', 'sweatpants', 'skirt', 'etek'], cat: 'bottom', sub: 'pants' }
  ];

  for (const rule of categoryMap) {
    if (rule.keywords.some(kw => combined.includes(kw))) {
      return { category: rule.cat, subCategory: rule.sub };
    }
  }

  // Fallback logic
  const topKeywords = ['top', 'üst', 'giyim'];
  const bottomKeywords = ['bottom', 'alt'];

  if (bottomKeywords.some(kw => combined.includes(kw))) return { category: 'bottom', subCategory: 'pants' };
  if (topKeywords.some(kw => combined.includes(kw))) return { category: 'top', subCategory: 't-shirt' };
  
  return { category: 'top', subCategory: 't-shirt' }; // Ultimate default
};

export const action = async ({ request }) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const { data: shopData } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shop)
    .single();

  if (shopData) {
    const { category, subCategory } = detectCategoryAndSub(payload.product_type, payload.title);

    const productData = {
      name: payload.title,
      category: category,
      sub_category: subCategory,
      is_active: payload.status === 'active',
    };

    // Update product by shopify_product_id
    const { data: existingProduct } = await supabase
      .from("merchant_products")
      .select("id")
      .eq("shopify_product_id", payload.id.toString())
      .maybeSingle();

    if (existingProduct) {
      const { error } = await supabase
        .from("merchant_products")
        .update(productData)
        .eq("id", existingProduct.id);
      
      if (error) {
        console.error("Error updating product in Supabase:", error);
      }
    } else {
        // Eğer bir nedenden ötürü create webhook kaçtıysa, update ile yakalayıp ekleyelim
        const newProductData = {
            ...productData,
            shop_id: shopData.id,
            shopify_product_id: payload.id.toString(),
        };
        const { error } = await supabase.from("merchant_products").insert(newProductData);
        if (error) console.error("Error inserting missed product on update:", error);
    }
  }

  return new Response();
};

import { authenticate } from "../shopify.server";
/* global Buffer */
import { supabase } from "../supabase.server";
import { extractSizeChartFromImage } from "../utils/gemini.server.js";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId"); // our DB id
  const shopifyProductId = formData.get("shopifyProductId"); // 1234567

  if (!productId || !shopifyProductId) {
    return Response.json({ success: false, error: "Missing Product ID" }, { status: 400 });
  }

  try {
    // 1. Fetch images from Shopify
    const response = await admin.graphql(
      `#graphql
      query getProductImages($id: ID!) {
        product(id: $id) {
          images(last: 2) {
            edges {
              node {
                url
              }
            }
          }
        }
      }`,
      { variables: { id: `gid://shopify/Product/${shopifyProductId}` } }
    );

    const { data } = await response.json();
    const images = data.product?.images?.edges || [];
    
    if (images.length === 0) {
      return Response.json({ success: false, error: "No images found for this product." });
    }

    // Genelde beden tablosu son resimdedir. Son resmi al.
    const imageUrl = images[images.length - 1].node.url;

    // 2. Fetch the image to buffer
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      return Response.json({ success: false, error: "Could not fetch image from Shopify." });
    }
    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

    // 3. Gemini OCR
    const ocrResult = await extractSizeChartFromImage(base64Image, mimeType);

    if (!ocrResult || ocrResult.error) {
      return Response.json({ success: false, error: "AI could not find a size chart in the images." });
    }

    // 4. Save to Database
    // Önce mevcutları silelim ki üstüne yazılsın
    await supabase.from("merchant_product_sizes").delete().eq("product_id", productId);

    const sizeOrderMap = { "xxs": 1, "xs": 2, "s": 3, "m": 4, "l": 5, "xl": 6, "xxl": 7, "2xl": 7, "3xl": 8, "4xl": 9, "5xl": 10 };
    
    const insertPromises = Object.entries(ocrResult).map(([sizeLabel, measurements]) => {
      const normalizedLabel = sizeLabel.toLowerCase();
      const sortOrder = sizeOrderMap[normalizedLabel] || 99;
      
      return supabase.from("merchant_product_sizes").insert({
        product_id: productId,
        size_label: sizeLabel.toUpperCase(),
        measurements: measurements,
        sort_order: sortOrder
      });
    });

    await Promise.all(insertPromises);

    // Ürün durumunu güncelle
    await supabase.from("merchant_products")
      .update({ size_status: 'ACTIVE', data_source: 'AI_OCR' })
      .eq('id', productId);

    return Response.json({ success: true, message: "OCR Scan completed and saved successfully." });
  } catch (err) {
    console.error("API Scan Error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

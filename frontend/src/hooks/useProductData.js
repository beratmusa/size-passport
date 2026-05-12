import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Müşterinin ürün verisini Supabase'den çeker.
 * Shopify widget modunda shopify_product_id ile,
 * standalone modda ise internal UUID ile sorgu yapar.
 * 
 * @param {string} productId - Shopify product ID veya internal UUID
 * @param {object} options - { lookupBy: 'shopify' | 'internal' }
 * @returns {{ product, sizes, loading, error }}
 */
const useProductData = (productId, options = {}) => {
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lookupBy = options.lookupBy || 'shopify';

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Ürün bilgileri — Shopify ID veya internal UUID ile ara
        const column = lookupBy === 'shopify' ? 'shopify_product_id' : 'id';
        
        const { data: productData, error: productError } = await supabase
          .from('merchant_products')
          .select('*')
          .eq(column, productId.toString())
          .single();

        if (productError) throw productError;

        // 2. Beden ölçüleri
        const { data: sizesData, error: sizesError } = await supabase
          .from('merchant_product_sizes')
          .select('size_label, measurements, sort_order')
          .eq('product_id', productData.id)
          .order('sort_order', { ascending: true });

        if (sizesError) throw sizesError;

        // size-engine'in beklediği format: [{ size, measurements }]
        const formattedSizes = (sizesData || []).map(s => ({
          size: s.size_label,
          measurements: s.measurements
        }));

        setProduct(productData);
        setSizes(formattedSizes);
      } catch (err) {
        console.error('Product fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, lookupBy]);

  return { product, sizes, loading, error };
};

export default useProductData;

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for merging tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Detects if a product is a 'top' or 'bottom' based on its category and name.
 * 
 * @param {string} cat - Product category or type from Shopify/Supabase
 * @param {string} name - Product title
 * @returns {'top' | 'bottom'}
 */
export const detectProductCategory = (cat, name) => {
  const topKeywords = [
    't-shirt', 'shirt', 'hoodie', 'jacket', 'sweatshirt', 'top', 'blouse', 
    'coat', 'outerwear', 'kazak', 'hırka', 'ceket', 'mont', 'atlet', 'tank'
  ];
  
  const bottomKeywords = [
    'pants', 'jeans', 'shorts', 'skirt', 'leggings', 'trousers', 'bottom', 
    'pantolon', 'şort', 'etek', 'tayt', 'pant', 'jean', 'eşofman'
  ];
  
  const combined = `${cat || ''} ${name || ''}`.toLowerCase();
  
  if (bottomKeywords.some(kw => combined.includes(kw))) return 'bottom';
  if (topKeywords.some(kw => combined.includes(kw))) return 'top';
  
  // Default to top if unknown, but prioritize 'bottom' keywords first
  return 'top';
};

/**
 * Detects product gender based on keywords.
 * 
 * @param {string} cat 
 * @param {string} name 
 * @returns {'men' | 'women' | null}
 */
export const detectProductGender = (cat, name) => {
  const combined = `${cat || ''} ${name || ''}`.toLowerCase();
  if (combined.includes('kadın') || combined.includes('kadin') || combined.includes('women') || combined.includes('woman') || combined.includes('female') || combined.includes('bayan')) return 'women';
  if (combined.includes('erkek') || combined.includes('men') || combined.includes('man ') || combined.includes('male') || combined.includes('bay ')) return 'men';
  return null;
};

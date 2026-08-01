/**
 * Smart Parser for Shopify Metafields
 * Normalizes different sizing formats and languages into the Size Passport DB schema.
 */

// Aliases mapping dictionary
const keyMap = {
  chest_cm: ['chest', 'bust', 'göğüs', 'gögüs', 'gogus', 'göğüs çevresi'],
  waist_cm: ['waist', 'bel', 'bel çevresi'],
  shoulder_cm: ['shoulder', 'omuz', 'omuz genişliği'],
  arm_length_cm: ['arm', 'sleeve', 'kol', 'kol boyu', 'arm length', 'sleeve length'],
  total_length_cm: ['length', 'total length', 'boy', 'uzunluk', 'ürün boyu', 'urun boyu'],
  hip_cm: ['hip', 'hips', 'kalça', 'kalca', 'basen'],
  inseam_cm: ['inseam', 'iç bacak', 'ic bacak', 'iç boy'],
  outseam_cm: ['outseam', 'dış bacak', 'dis bacak', 'dış boy'],
  size_label: ['size', 'beden', 'label', 'ölçü', 'olcu']
};

export const parseMetafieldSizeChart = (rawJsonStr, shopUnitSystem = 'metric') => {
  if (!rawJsonStr) return [];
  
  let data;
  try {
    data = JSON.parse(rawJsonStr);
  } catch (e) {
    console.error("Metafield parse error. Not valid JSON:", e);
    return [];
  }

  const results = [];
  
  // Normalize strings and handle nested structures
  const normalizeKey = (rawKey) => {
    const lowerKey = String(rawKey).toLowerCase().trim();
    for (const [standardKey, aliases] of Object.entries(keyMap)) {
      if (aliases.includes(lowerKey)) return standardKey;
      if (aliases.some(alias => lowerKey.includes(alias))) return standardKey;
    }
    return null;
  };

  const processRow = (label, obj) => {
    const row = {
      size_label: String(label).toUpperCase().trim(),
      chest_cm: null,
      waist_cm: null,
      shoulder_cm: null,
      arm_length_cm: null,
      total_length_cm: null,
      hip_cm: null,
      inseam_cm: null,
      outseam_cm: null,
    };
    
    for (const [key, value] of Object.entries(obj)) {
      const stdKey = normalizeKey(key);
      if (stdKey && stdKey !== 'size_label') {
        const valStr = String(value).toLowerCase();
        
        // Extract numbers and replace comma with dot for decimals
        const numVal = parseFloat(valStr.replace(',', '.').replace(/[^0-9.]/g, ''));
        
        if (!isNaN(numVal)) {
          // Detect if the value is in inches (e.g., "40 in", "40\"")
          const isExplicitInch = valStr.includes('in') || valStr.includes('"');
          const isExplicitCm = valStr.includes('cm');
          
          let finalCmVal = numVal;
          if (isExplicitInch) {
             finalCmVal = numVal * 2.54;
          } else if (!isExplicitCm && shopUnitSystem === 'imperial') {
             finalCmVal = numVal * 2.54;
          }
          
          // Round to 1 decimal place to keep the DB clean (e.g. 101.6)
          row[stdKey] = Math.round(finalCmVal * 10) / 10;
        }
      }
    }
    
    // Only return if at least one measurement is present
    if (row.chest_cm || row.waist_cm || row.shoulder_cm || row.arm_length_cm || row.total_length_cm || row.hip_cm || row.inseam_cm || row.outseam_cm) {
      return row;
    }
    return null;
  };

  // If it's an Array of Objects (Format B)
  if (Array.isArray(data)) {
    data.forEach((item) => {
      // Find the size label key
      let sizeLabel = '';
      for (const [k, v] of Object.entries(item)) {
        if (normalizeKey(k) === 'size_label') {
          sizeLabel = v;
          break;
        }
      }
      if (!sizeLabel && item.size) sizeLabel = item.size;
      if (!sizeLabel && item.beden) sizeLabel = item.beden;
      
      if (sizeLabel) {
        const parsed = processRow(sizeLabel, item);
        if (parsed) results.push(parsed);
      }
    });
  } 
  // If it's an Object of Objects (Format A) e.g. {"S": {"chest": 100}, "M": {...}}
  else if (typeof data === 'object' && data !== null) {
    for (const [sizeKey, measurements] of Object.entries(data)) {
      if (typeof measurements === 'object' && measurements !== null) {
        const parsed = processRow(sizeKey, measurements);
        if (parsed) results.push(parsed);
      }
    }
  }

  return results;
};

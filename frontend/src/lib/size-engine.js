/**
 * 1. NORMALİZASYON: Gelen karışık veriyi (Shopify/DB) standart hale getirir.
 */
export const normalizeMeasurements = (rawData, category = 'top') => {
  if (!rawData) return null;
  const clean = {};

  const MAP = {
    chest: ['chest', 'bust', 'chest_width', 'gogus', 'width', 'chest_circumference_cm'],
    waist: ['waist', 'waist_width', 'bel', 'waist_circumference_cm'],
    hip: ['hip', 'hip_width', 'basen', 'kalca', 'hip_circumference_cm'],
    shoulder: ['shoulder', 'shoulder_width', 'omuz', 'shoulder_width_cm'],
    length: ['length', 'total_length', 'boy', 'inseam', 'ic_bacak', 'inseam_cm'],
    arm: ['arm', 'sleeve', 'kol', 'arm_length_cm'],
    outseam: ['outseam', 'dis_bacak', 'outseam_cm']
  };

  Object.keys(rawData).forEach(key => {
    const val = parseFloat(rawData[key]);
    if (isNaN(val)) return;

    const standardKey = Object.keys(MAP).find(k => 
      MAP[k].some(alias => key.toLowerCase().includes(alias))
    );

    if (standardKey) {
      let finalVal = val;
      
      // --- AKILLI DÖNÜŞÜM ALGORİTMASI --- //
      
      // SENARYO 1: İnç Tespiti (Sadece Bel ve Boy için)
      // Değer 24 ile 40 arasındaysa ve kategori Alt Giyim ise bu muhtemelen İnçtir.
      // Örn: 32 inç bel = 81cm. (Eğer yarım en olsaydı 32*2=64cm olurdu, bu da çocuk bedeni gibi kalırdı)
      if (['waist', 'length', 'inseam'].includes(standardKey) && val > 24 && val < 42) {
         // Ancak kategori "top" ise (T-shirt), 40cm yarım göğüs olabilir. O yüzden kategori kontrolü şart.
         if (category === 'bottom' || category === 'jeans') {
             finalVal = val * 2.54; // İnç -> CM dönüşümü
         } else {
             finalVal = val * 2; // Üst giyimde 40cm yarım endir -> 80cm
         }
      }
      
      // SENARYO 2: Yarım En Tespiti (CM)
      // Değer 65'ten küçükse ve yukarıdaki inç kuralına takılmadıysa, yarım endir.
      else if (['chest', 'waist', 'hip'].includes(standardKey) && val < 65) {
        finalVal *= 2; 
      }
      
      clean[standardKey] = Math.round(finalVal);
    }
  });

  // Eksik veri tamamlama (Imputation)
  if (category === 'top' || category === 'tshirt') {
      if (clean.chest && !clean.shoulder) clean.shoulder = Math.round(clean.chest * 0.45);
      if (clean.chest && !clean.waist) clean.waist = Math.round(clean.chest * 0.90);
      if (!clean.arm) clean.arm = 25; 
  } else {
      // Eğer boy (length/inseam) yoksa standart 32 inç (81cm) ata
      if (!clean.length) clean.length = 81;
      
      // Eğer basen yoksa belden türet
      if (clean.waist && !clean.hip) clean.hip = Math.round(clean.waist * 1.18);
      
      // Dış bacak (Outseam) yoksa iç bacak + 24cm (bel yüksekliği)
      if (!clean.outseam) clean.outseam = clean.length + 24;
  }

  return clean;
};

// ... (getStatusColor ve calculateFitScore fonksiyonları aynı kalacak) ...
export const getStatusColor = (diff) => {
    if (diff < -2) return { status: 'Dar', color: '#ef4444', bg: 'bg-red-500' };
    if (diff > 8) return { status: 'Bol', color: '#3b82f6', bg: 'bg-blue-500' };
    return { status: 'Kusursuz', color: '#10b981', bg: 'bg-emerald-500' };
};

export const calculateFitScore = (userMeas, productMeas, category) => {
  if (!userMeas || !productMeas) return null;

  let totalDiff = 0;
  let count = 0;
  const details = [];
  
  const keys = (category === 'top' || category === 'tshirt') 
    ? ['shoulder', 'chest', 'waist', 'arm'] 
    : ['waist', 'hip', 'length', 'outseam'];

  keys.forEach(key => {
    let pKey = key === 'inseam' ? 'length' : key; // Eşleşme düzeltmesi
    let uKey = key === 'inseam' ? 'length' : key;

    // length, inseam_cm, inseam gibi farklı isimleri yakala
    const uVal = userMeas[uKey] || userMeas['inseam_cm'] || userMeas['inseam'];
    const pVal = productMeas[pKey] || productMeas['inseam'] || productMeas['length'];

    if (uVal && pVal) {
      const diff = pVal - uVal;
      const { status, color, bg } = getStatusColor(diff);
      
      let penalty = 0;
      if (diff < -2) penalty = Math.abs(diff) * 5;
      else if (diff > 8) penalty = (diff - 8) * 2;
      
      totalDiff += penalty;
      count++;
      
      details.push({ 
          part: key,
          diff, status, color, bg,
          user: uVal, product: pVal,
          delta: Math.abs(diff)
      });
    }
  });

  if (count === 0) return null;
  const finalScore = Math.max(0, 100 - (totalDiff / count));
  
  return {
    score: Math.round(finalScore),
    recommendation: finalScore > 85 ? 'Sana Tam Uyacak' : finalScore > 60 ? 'Biraz Riskli' : 'Beden Uygun Değil',
    details
  };
};
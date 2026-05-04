export const normalizeMeasurements = (rawData, category = 'top') => {
  if (!rawData) return null;
  const clean = {};

  const MAP = {
    // Üst Giyim
    chest: ['chest', 'bust', 'width', 'gogus'], // Zara: Chest (Side to side)
    shoulder: ['shoulder', 'omuz'],
    arm: ['arm', 'sleeve', 'kol'],
    length: ['length', 'front_length', 'total_length', 'boy'], // Zara: Front Length (Shoulder to hem)

    // Alt Giyim
    waist: ['waist', 'bel'], // Zara: Waist (Highest part side to side)
    hip: ['hip', 'basen', 'kalca'], // Zara: Hip (Widest part side to side)
    outseam: ['outseam', 'length', 'dis_bacak'], // Jean Boyu
    inseam: ['inseam', 'ic_bacak'],
    front_rise: ['front_rise', 'on_ag'], // Zara: Front Rise
    back_rise: ['back_rise', 'arka_ag']  // Zara: Back Rise
  };

  Object.keys(rawData).forEach(key => {
    const val = parseFloat(rawData[key]);
    if (isNaN(val)) return;

    // Anahtarı bul
    const standardKey = Object.keys(MAP).find(k => 
      MAP[k].some(alias => key.toLowerCase().includes(alias))
    );

    if (standardKey) {
      let finalVal = val;
      
      // --- ZARA "SIDE TO SIDE" KURALI (Yarım En -> Tam Çevre) ---
      
      // 1. Bel, Basen ve Göğüs Kontrolü
      // Zara 40cm bel veriyorsa bu yarım endir. 40 * 2 = 80cm Çevre yapar.
      // (60cm'den küçük tüm "genişlik" ölçülerini yarım en kabul ediyoruz)
      if (['chest', 'waist', 'hip'].includes(standardKey)) {
        if (val < 65) {
            finalVal = val * 2; 
        }
        // NOT: İnç (Jeans Size) kontrolünü burada yapmıyoruz çünkü Zara verisi
        // Product Definition'dan CM olarak geliyor.
      }
      
      // 2. İnç Kontrolü (Sadece Kullanıcı Profili veya Dış Kaynaklar için)
      // Eğer kategori Bottom ise ve Bel 26-38 arasındaysa bu İNÇ bedenidir.
      // Ancak Zara verisi (Side-to-side) ile karışmaması için bunu sadece
      // "waist" 40'ın altındaysa ve "hip" yoksa gibi kompleks kontrollerle ayırabiliriz.
      // Şimdilik Zara'nın CM verdiğini bildiğimiz için üstteki kural yeterli.

      clean[standardKey] = Math.round(finalVal);
    }
  });

  // EKSİK VERİ TAMAMLAMA (Fallback)
  if (category === 'top' || category === 'tshirt') {
      if (clean.chest && !clean.shoulder) clean.shoulder = Math.round(clean.chest * 0.45);
      if (clean.chest && !clean.waist) clean.waist = Math.round(clean.chest * 0.90);
      if (!clean.arm) clean.arm = 20; 
      if (!clean.length) clean.length = 70;
  } else {
      // Bottom
      if (clean.waist && !clean.hip) clean.hip = Math.round(clean.waist * 1.18);
      // Eğer Jean boyu yoksa standart ver
      if (!clean.outseam && !clean.length) clean.outseam = 105;
      // Eğer boy var ama outseam yoksa eşle
      if (!clean.outseam && clean.length) clean.outseam = clean.length;
  }

  return clean;
};

export const getStatusColor = (diff) => {
  if (Math.abs(diff) <= 2) return { status: 'Perfect', color: '#10b981', bg: 'bg-emerald-500' };
  if (diff > 2 && diff <= 5) return { status: 'Slightly Loose', color: '#6366f1', bg: 'bg-indigo-500' };
  if (diff > 5) return { status: 'Too Loose', color: '#3b82f6', bg: 'bg-blue-500' };
  if (diff < -2 && diff >= -5) return { status: 'Slightly Tight', color: '#f59e0b', bg: 'bg-amber-500' };
  return { status: 'Too Tight', color: '#ef4444', bg: 'bg-red-500' };
};

export const calculateFitScore = (userMeas, productMeas, category) => {
  if (!userMeas || !productMeas) return null;

  let totalDiff = 0;
  let count = 0;
  const details = [];
  
  const keys = (category === 'top' || category === 'tshirt') 
    ? ['shoulder', 'chest', 'waist', 'arm'] 
    : ['waist', 'hip', 'inseam', 'outseam']; 

  keys.forEach(key => {
    let pKey = key;
    let uKey = key;

    // Eşleşmeler
    if (key === 'length') {
         if (!productMeas['length'] && productMeas['front_length']) pKey = 'front_length';
    }
    if (key === 'outseam') {
        if (!productMeas['outseam'] && productMeas['length']) pKey = 'length';
        if (!userMeas['outseam'] && userMeas['length']) uKey = 'length';
    }

    const uVal = userMeas[uKey];
    let pVal = productMeas[pKey];
    
    // Inseam hesaplaması: Eğer ürün ölçülerinde inseam yoksa, length(outseam) - front_rise ile bul
    if (key === 'inseam' && !pVal && productMeas['length'] && productMeas['front_rise']) {
        pVal = productMeas['length'] - productMeas['front_rise'];
    }

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
    recommendation: finalScore > 85 ? 'Perfect Fit' : finalScore > 60 ? 'Slightly Risky' : 'Not Recommended',
    details
  };
};

// KULLANICI ÖLÇÜLERİNİ TAHMİN ETME (SmartProfiler'dan taşındı)
export const estimateUserMeasurements = (baseMeasurements, physicalFeel, category) => {
  const base = baseMeasurements;
  const adjustment = (50 - physicalFeel) / 4; 
  let bodyMeasurements = {};

  if (category === 'top') {
    const chestBase = base.chest || base.chest_width || 100;
    bodyMeasurements.chest = Math.round(chestBase + adjustment);
    bodyMeasurements.waist = Math.round((base.waist || base.waist_width || (chestBase * 0.90)) + adjustment); 
    bodyMeasurements.shoulder = Math.round(base.shoulder || base.shoulder_width || (chestBase * 0.45));
    bodyMeasurements.arm = base.arm || base.sleeve || base.sleeve_length || 64; 
  } else {
    const waistBase = base.waist || base.waist_width || 84;
    bodyMeasurements.waist = Math.round(waistBase + adjustment);
    bodyMeasurements.hip = Math.round((base.hip || base.hip_width || (waistBase * 1.18)) + adjustment);
    
    const lengthVal = base.length || base.total_length || base.outseam;
    const frontRise = base.front_rise || 25;
    
    let inseamVal = base.inseam;
    let outseamVal = lengthVal;
    
    if (!inseamVal && outseamVal) {
      if (outseamVal > 90) {
         inseamVal = outseamVal - frontRise; // length is probably outseam
      } else {
         inseamVal = outseamVal; // length is probably inseam
         outseamVal = inseamVal + frontRise;
      }
    } else if (!outseamVal && inseamVal) {
      outseamVal = inseamVal + frontRise;
    } else if (!inseamVal && !outseamVal) {
      inseamVal = 81;
      outseamVal = inseamVal + frontRise;
    }

    bodyMeasurements.inseam = Math.round(inseamVal);
    bodyMeasurements.outseam = Math.round(outseamVal);
  }

  return bodyMeasurements;
};
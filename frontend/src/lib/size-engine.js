export const normalizeMeasurements = (rawData, category = 'top', isUser = false) => {
  if (!rawData) return null;
  const clean = {};

  const MAP = {
    // Üst Giyim
    chest: ['chest', 'bust', 'width', 'gogus', 'göğüs', 'poitrine', 'brust', 'torace', 'pecho', 'borst', 'peito', 'bröst', 'bryst', '胸囲', '가슴'], 
    shoulder: ['shoulder', 'omuz', 'épaule', 'epaule', 'schulter', 'spalla', 'hombro', 'schouder', 'ombro', 'axel', 'skulder', '肩幅', '어깨'],
    arm: ['arm', 'sleeve', 'kol', 'bras', 'ärmel', 'braccio', 'brazo', 'manga', '袖丈', '팔 길이', '팔길이'],
    length: ['length', 'front_length', 'total_length', 'boy', 'uzunluk', 'longueur', 'länge', 'lunghezza', 'largo', 'lengte', 'comprimento', 'längd', '総丈', '長さ', '총 기장', '총기장', '길이'], 

    // Alt Giyim
    waist: ['waist', 'bel', 'taille', 'vita', 'cintura', 'midja', 'talje', 'ウエスト', '허리'], 
    hip: ['hip', 'basen', 'kalca', 'kalça', 'hanches', 'hüfte', 'fianchi', 'caderas', 'heupen', 'quadril', 'höft', 'hofte', 'ヒップ', '엉덩이'], 
    outseam: ['outseam', 'length', 'dis_bacak', 'dış_bacak', 'couture_extérieure', 'außennaht', 'cucitura_esterna', 'costura_exterior', 'buitenbeen', 'yttersöm', 'ydersøm', '総丈（パンツ）', '아웃심'], 
    inseam: ['inseam', 'ic_bacak', 'iç_bacak', 'entrejambe', 'schrittlänge', 'cavallo', 'entrepierna', 'binnenbeen', 'costura_interna', 'innersöm', 'indersøm', '股下', '인심'],
    front_rise: ['front_rise', 'on_ag', 'ön_ağ'], 
    back_rise: ['back_rise', 'arka_ag', 'arka_ağ']  
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
      
      // Ürün ölçülerinde (isUser = false) genellikle "Yarım En" (Side-to-side) verilir.
      // 65cm'den küçük göğüs, bel, kalça ölçülerini tam çevreye çeviriyoruz.
      // Kullanıcı verilerinde (isUser = true) ise her zaman tam çevre girildiğini varsayıyoruz, 
      // bu nedenle kullanıcının 60cm beli varsa (çok ince biri) bunu 120cm yapmıyoruz.
      if (['chest', 'waist', 'hip'].includes(standardKey)) {
        if (!isUser && val < 65) {
            finalVal = val * 2; 
        }
      }

      clean[standardKey] = Math.round(finalVal);
    }
  });

  // EKSİK VERİ TAMAMLAMA (Oransal Tahminler)
  // Sabit değerler (örn: arm=20, length=70) çocuk giyiminde veya farklı tasarımlarda 
  // hatalı sonuç vereceği için sadece birbiriyle orantılı olan ölçüleri tamamlıyoruz.
  if (category === 'top' || category === 'tshirt') {
      if (clean.chest && !clean.shoulder) clean.shoulder = Math.round(clean.chest * 0.45);
      if (clean.chest && !clean.waist) clean.waist = Math.round(clean.chest * 0.90);
  } else {
      if (clean.waist && !clean.hip) clean.hip = Math.round(clean.waist * 1.18);
      if (!clean.outseam && clean.length) clean.outseam = clean.length;
  }

  return clean;
};

export const getStatusColor = (diff, preference = 'regular') => {
  let idealDiff = 2; // Regular için ideal bolluk
  if (preference === 'loose') idealDiff = 4;
  if (preference === 'slim') idealDiff = 0;

  const normalizedDiff = diff - idealDiff;

  // normalizedDiff 0'a ne kadar yakınsa o kadar "Perfect"
  if (Math.abs(normalizedDiff) <= 2) return { status: 'Perfect Fit', color: '#10b981', bg: 'bg-emerald-500' };
  
  if (normalizedDiff > 2 && normalizedDiff <= 6) return { status: 'Slightly Loose', color: '#6366f1', bg: 'bg-indigo-500' };
  if (normalizedDiff > 6) return { status: 'Too Loose', color: '#3b82f6', bg: 'bg-blue-500' };
  
  if (normalizedDiff < -2 && normalizedDiff >= -5) return { status: 'Slightly Tight', color: '#f59e0b', bg: 'bg-amber-500' };
  return { status: 'Too Tight', color: '#ef4444', bg: 'bg-red-500' };
};

export const calculateFitScore = (userMeas, productMeas, category, preference = 'regular') => {
  if (!userMeas || !productMeas) return null;

  let totalDiff = 0;
  let totalWeight = 0;
  const details = [];
  
  const isTop = (category === 'top' || category === 'tshirt');
  const WEIGHTS = isTop 
    ? { chest: 1.5, shoulder: 1.2, waist: 1.0, arm: 0.5, length: 0.5 } 
    : { waist: 1.5, hip: 1.3, outseam: 0.7, inseam: 0.7, length: 0.7 };

  const keys = isTop 
    ? ['shoulder', 'chest', 'waist', 'arm', 'length'] 
    : ['waist', 'hip', 'inseam', 'outseam', 'length']; 

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
      const { status, color, bg } = getStatusColor(diff, preference);
      
      let penalty = 0;
      if (preference === 'loose') {
        if (diff < -1) penalty = Math.abs(diff) * 6;
        else if (diff > 10) penalty = ((diff - 10) * 1.5) + 3;
        else penalty = Math.abs(diff - 4) * 0.5;
      } else if (preference === 'slim') {
        if (diff < -4) penalty = Math.abs(diff) * 5;
        else if (diff > 3) penalty = ((diff - 3) * 3) + 1.5;
        else penalty = Math.abs(diff) * 0.5;
      } else {
        if (diff < -2) penalty = Math.abs(diff) * 5;
        else if (diff > 8) penalty = ((diff - 8) * 2) + 3;
        else penalty = Math.abs(diff - 2) * 0.5;
      }
      
      const weight = WEIGHTS[key] || 1.0;
      totalDiff += (penalty * weight);
      totalWeight += weight;
      
      details.push({ 
          part: key,
          diff, status, color, bg,
          user: uVal, product: pVal,
          delta: Math.abs(diff)
      });
    }
  });

  if (totalWeight === 0) return null;
  const finalScore = Math.max(0, 100 - (totalDiff / totalWeight));
  
  return {
    score: Math.round(finalScore),
    recommendation: finalScore > 85 ? 'Perfect Fit' : finalScore > 60 ? 'Slightly Risky' : 'Not Recommended',
    details
  };
};

// KULLANICI ÖLÇÜLERİNİ TAHMİN ETME (SmartProfiler'dan taşındı)
export const estimateUserMeasurements = (baseMeasurements, physicalFeel, category, fitType = 'regular') => {
  const base = baseMeasurements;
  
  // physicalFeel: 0 (Çok Dar), 25 (Biraz Dar), 50 (Tam Kararında), 75 (Biraz Bol), 100 (Çok Bol)
  // Tekstil kalıp (grading) kurallarına göre beden farkı hesaplaması:
  const sizeDiff = (50 - physicalFeel) / 25; 
  
  let bodyMeasurements = {};
  
  // Fit Type'a göre grading aralıklarını (bedenler arası cm farkını) ayarla
  const isOversize = fitType.toLowerCase().includes('oversize') || fitType.toLowerCase().includes('loose');
  const isSlim = fitType.toLowerCase().includes('slim') || fitType.toLowerCase().includes('skinny');

  if (category === 'top') {
    // Üst giyim bölgesel büyüme/küçülme oranları (cm / 1 beden için)
    // Oversize kalıplarda bedenler arası büyüme daha fazladır (örn: 5cm), Slim'de daha azdır (örn: 3.5cm)
    const grade = {
      chest: isOversize ? 5.0 : (isSlim ? 3.5 : 4.0),
      waist: isOversize ? 5.0 : (isSlim ? 3.5 : 4.0),
      shoulder: isOversize ? 1.5 : (isSlim ? 1.0 : 1.2),
      arm: 0.8,
      length: isOversize ? 2.0 : 1.5
    };

    const chestBase = base.chest || base.chest_width || 100;
    bodyMeasurements.chest = Math.round(chestBase + (grade.chest * sizeDiff));
    
    const waistBase = base.waist || base.waist_width || (chestBase * 0.90);
    bodyMeasurements.waist = Math.round(waistBase + (grade.waist * sizeDiff)); 
    
    const shoulderBase = base.shoulder || base.shoulder_width || (chestBase * 0.45);
    bodyMeasurements.shoulder = Math.round(shoulderBase + (grade.shoulder * sizeDiff));
    
    const armBase = base.arm || base.sleeve || base.sleeve_length || 64;
    bodyMeasurements.arm = Math.round(armBase + (grade.arm * sizeDiff)); 

    const lengthBase = base.length || base.total_length || 70;
    bodyMeasurements.length = Math.round(lengthBase + (grade.length * sizeDiff));
    
  } else {
    // Alt giyim bölgesel büyüme/küçülme oranları
    const grade = {
      waist: isOversize ? 4.5 : (isSlim ? 3.5 : 4.0),
      hip: isOversize ? 5.0 : (isSlim ? 3.5 : 4.0),
      outseam: 1.0,
      inseam: 0.5
    };

    const waistBase = base.waist || base.waist_width || 84;
    bodyMeasurements.waist = Math.round(waistBase + (grade.waist * sizeDiff));
    
    const hipBase = base.hip || base.hip_width || (waistBase * 1.18);
    bodyMeasurements.hip = Math.round(hipBase + (grade.hip * sizeDiff));
    
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

    bodyMeasurements.inseam = Math.round(inseamVal + (grade.inseam * sizeDiff));
    bodyMeasurements.outseam = Math.round(outseamVal + (grade.outseam * sizeDiff));
  }

  return bodyMeasurements;
};

export const calculateAIFitScore = (userMeasRaw, productMeasRaw, category, preference) => {
  if (!userMeasRaw || !productMeasRaw) return null;

  const userMeas = normalizeMeasurements(userMeasRaw, category, true);
  const productMeas = normalizeMeasurements(productMeasRaw, category, false);

  let totalDiff = 0;
  let totalWeight = 0;
  
  const isTop = (category === 'top' || category === 'tshirt');
  const WEIGHTS = isTop 
    ? { chest: 1.5, shoulder: 1.2, waist: 1.0, arm: 0.5, length: 0.5 } 
    : { waist: 1.5, hip: 1.3, outseam: 0.7, inseam: 0.7, length: 0.7 };

  const keys = isTop 
    ? ['shoulder', 'chest', 'waist', 'arm', 'length'] 
    : ['waist', 'hip', 'inseam', 'outseam', 'length']; 

  keys.forEach(key => {
    let pKey = key;
    let uKey = key;

    if (key === 'length') {
         if (!productMeas['length'] && productMeas['front_length']) pKey = 'front_length';
    }
    if (key === 'outseam') {
        if (!productMeas['outseam'] && productMeas['length']) pKey = 'length';
        if (!userMeas['outseam'] && userMeas['length']) uKey = 'length';
    }

    const uVal = userMeas[uKey];
    let pVal = productMeas[pKey];
    
    if (key === 'inseam' && !pVal && productMeas['length'] && productMeas['front_rise']) {
        pVal = productMeas['length'] - productMeas['front_rise'];
    }

    if (uVal && pVal) {
      const diff = pVal - uVal; // Pozitif: Ürün büyük (bol), Negatif: Ürün küçük (dar)
      let penalty = 0;
      
      if (preference === 'loose') {
        // Kullanıcı daha bol seviyor. (İdeal bolluk: +4cm)
        if (diff < -1) penalty = Math.abs(diff) * 6; // Dar ise büyük ceza
        else if (diff > 10) penalty = ((diff - 10) * 1.5) + 3; // 10'dan sonra ceza artar (+3 taban ceza)
        else penalty = Math.abs(diff - 4) * 0.5; // İdealden uzaklaştıkça hafif ceza
      } else if (preference === 'slim') {
        // Kullanıcı daha dar seviyor. (İdeal bolluk: +0cm)
        if (diff < -4) penalty = Math.abs(diff) * 5; // Çok dar ise ceza
        else if (diff > 3) penalty = ((diff - 3) * 3) + 1.5; // Bollaştıkça ceza artar (+1.5 taban ceza)
        else penalty = Math.abs(diff) * 0.5; // İdealden uzaklaştıkça hafif ceza
      } else {
        // Regular (Varsayılan). (İdeal bolluk: +2cm)
        if (diff < -2) penalty = Math.abs(diff) * 5;
        else if (diff > 8) penalty = ((diff - 8) * 2) + 3; // 8'den sonra ceza artar (+3 taban ceza)
        else penalty = Math.abs(diff - 2) * 0.5; // İdealden uzaklaştıkça hafif ceza
      }
      
      const weight = WEIGHTS[key] || 1.0;
      totalDiff += (penalty * weight);
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return 0;
  return Math.max(0, 100 - (totalDiff / totalWeight));
};

export const predictBestSize = (userProfile, availableSizes, category) => {
  if (!userProfile?.measurements || !availableSizes || availableSizes.length === 0) return null;
  
  const preference = userProfile.preferences?.default_fit || 'regular';
  
  let bestSize = null;
  let bestScore = -1;

  availableSizes.forEach(sizeData => {
    const score = calculateAIFitScore(userProfile.measurements, sizeData.measurements, category, preference);
    if (score !== null) {
      if (score > bestScore) {
        bestScore = score;
        bestSize = sizeData.size;
      } else if (score === bestScore) {
        // Skorda eşitlik durumunda kullanıcının stiline göre yön verelim
        if (preference === 'loose') {
          // Bol seven birine eşit skorda daha büyük olan bedeni önerelim
          bestSize = sizeData.size;
        }
      }
    }
  });

  return {
    size: bestSize,
    score: Math.round(bestScore),
    preference
  };
};

export const sortSizes = (sizes) => {
  const sizeOrder = [
    '3XS', '2XS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL',
    '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60',
    '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '38'
  ];

  const getWeight = (sizeLabel) => {
    const label = String(sizeLabel).toUpperCase().trim();
    
    // 1. Predefined listesi kontrolü
    const index = sizeOrder.indexOf(label);
    if (index !== -1) return index;

    // 2. Sayısal değer kontrolü (40, 42, 32W vb.)
    const numericMatch = label.match(/^(\d+)/);
    if (numericMatch) {
      return 1000 + parseInt(numericMatch[1]);
    }

    // 3. Bilinmeyenler en sona
    return 5000;
  };

  return [...sizes].sort((a, b) => {
    const labelA = typeof a === 'string' ? a : a.label;
    const labelB = typeof b === 'string' ? b : b.label;
    
    const weightA = getWeight(labelA);
    const weightB = getWeight(labelB);

    if (weightA !== weightB) return weightA - weightB;
    return labelA.localeCompare(labelB, undefined, { numeric: true });
  });
};
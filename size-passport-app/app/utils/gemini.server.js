import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with environment variable
// We will set GEMINI_API_KEY in the .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function extractSizeChartFromImage(base64Image, mimeType) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  // Use the fast and efficient 1.5 Flash model
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    Analyze this image. If it contains a size chart or clothing measurements table, extract the measurements.
    
    CRITICAL INSTRUCTIONS:
    1. Map whatever language you see (Turkish, French, German, Spanish, etc.) into these EXACT standardized English keys:
       - Top/Shirts: 'chest', 'shoulder', 'arm' (or sleeve), 'length'
       - Bottom/Pants: 'waist', 'hip', 'outseam', 'inseam', 'front_rise', 'back_rise'
    2. The sizes (S, M, L, XL, etc.) must be the main keys.
    3. Values must be NUMBERS ONLY. If you see "50-52", take the average (e.g., 51). Do not include "cm" or "in" text.
    4. INCH to CM CONVERSION (CRITICAL): ALL final values in your JSON MUST be in centimeters (cm). If the table uses inches (in / ″), you MUST multiply every value by 2.54 and round to the nearest whole number before putting it in the JSON.
    5. If the image does not contain a size chart, return exactly this: {"error": "no_size_chart_found"}
    
    EXPECTED OUTPUT FORMAT (JSON ONLY):
    {
      "S": { "chest": 50, "length": 68, "shoulder": 42 },
      "M": { "chest": 52, "length": 70, "shoulder": 44 },
      "L": { "chest": 54, "length": 72, "shoulder": 46 }
    }
  `;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType
    }
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();
    
    // Parse the strict JSON output
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

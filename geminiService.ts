
import { GoogleGenAI, Type } from "@google/genai";

// API Hata Yönetimi - Retry Mekanizması
const fetchWithRetry = async (fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error?.message?.includes('429') || error?.status === 429;
      if (isQuotaError && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

// A. HİPER YAPAY ZEKA & TAHMİN MOTORU (THINKING MODE)
export const predictBusinessGrowth = async (transactions: any[], customers: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    ROL: L'YSF LIFE CENTER CEO AI
    VERİ: ${JSON.stringify({ transactions, customers })}
    GÖREV: Büyüme tahminleri ve risk analizi yap.
  `;
  return fetchWithRetry(async () => {
    // Complex Task: Use Gemini 3 Pro with Thinking
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 32768 } // Max budget for deep reasoning
      }
    });
    return response.text;
  });
};

// B. SEARCH GROUNDING (WEB SEARCH)
export const getSearchBasedAdvice = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash for search tasks
      contents: query,
      config: {
        tools: [{ googleSearch: {} }] // Enable Google Search
      }
    });
    
    // Extract sources if available
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
  });
};

// C. IMAGE GENERATION (MARKETING ASSETS)
export const generateMarketingVisual = async (prompt: string, aspectRatio: string = "1:1") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, // User defined aspect ratio
          imageSize: "1K"
        }
      }
    });

    let imageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        imageUrl = `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return imageUrl;
  });
};

// GÖRSEL ANALİZ (Vision) - Detaylı Bölgesel Analiz (JSON)
export const analyzeSkinDetailedJSON = async (base64Image: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = {
    parts: [
      { inlineData: { data: base64Image, mimeType } },
      { text: `Bir estetik cerrah ve dermatolog titizliğiyle bu cildi analiz et. 
      Görsel üzerinde şu bölgeleri tespit et ve koordinatlarını (x: 0-100, y: 0-100) belirle: 
      1. Alın (T-Bölgesi Üst)
      2. Burun (T-Bölgesi Orta)
      3. Sağ Yanak
      4. Sol Yanak
      5. Çene
      
      Her bölge için:
      - score: 0-100 arası sağlık puanı.
      - metrics: nem, yağ ve esneklik değerleri (0-100).
      - status: Kısa durum (Örn: Dehidre, Sebum Artışı).
      - suggestion: L'YSF salonunda yapılabilecek spesifik işlem veya ürün.
      
      Sonuçları Türkçe olarak kesinlikle JSON formatında döndür.` }
    ]
  };

  return fetchWithRetry(async () => {
    // Image Analysis: Use Gemini 3 Pro
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            overallScore: { type: Type.NUMBER },
            regions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  metrics: {
                    type: Type.OBJECT,
                    properties: {
                      moisture: { type: Type.NUMBER },
                      oiliness: { type: Type.NUMBER },
                      elasticity: { type: Type.NUMBER }
                    }
                  },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["id", "name", "score", "status", "description", "suggestion", "x", "y", "metrics"]
              }
            }
          },
          required: ["summary", "overallScore", "regions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// MÜŞTERİ ÖZEL ÖNERİ SİSTEMİ (FAST RESPONSE)
export const getAICustomerSuggestions = async (customer: any, services: any[], staff: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Veriyi sadeleştirme (Token tasarrufu)
  const simplifiedServices = services.map(s => ({ id: s.id, name: s.name, category: s.category, price: s.price }));
  const simplifiedStaff = staff.map(s => ({ id: s.id, name: s.name, role: s.role }));
  const customerProfile = {
    name: customer.fullName,
    tier: customer.tier,
    loyaltyPoints: customer.dna.loyaltyPuan,
    totalSpent: customer.dna.totalSpent,
    preferences: customer.preferences
  };

  const prompt = `
    ROL: L'YSF Life Center için kişisel güzellik ve wellness danışmanı.
    MÜŞTERİ: ${JSON.stringify(customerProfile)}
    HİZMET LİSTESİ: ${JSON.stringify(simplifiedServices)}
    PERSONEL LİSTESİ: ${JSON.stringify(simplifiedStaff)}
    
    GÖREV: Bu müşteri için, profiline ve statüsüne (Tier) uygun en iyi 3 hizmeti ve en uyumlu 1 personeli öner.
    Ayrıca müşteriye özel, lüks bir dille yazılmış kısa bir "Stil Notu" ekle.
    
    KURALLAR:
    1. Önerilen hizmetler kesinlikle listeden seçilmeli.
    2. Önerilen personel listeden seçilmeli.
    3. Dil: Türkçe, kibar, "siz" hitabı, premium hissettiren.
    
    ÇIKTI FORMATI (JSON):
    {
      "stylistNote": "Müşteriye hitaben yazılmış 1-2 cümlelik özel not.",
      "recommendedServices": [
        { "serviceId": "...", "reason": "Neden bu hizmet?" } 
      ],
      "recommendedStaff": { "staffId": "...", "reason": "Neden bu personel?" }
    }
  `;

  return fetchWithRetry(async () => {
    // Fast Response: Use Gemini Flash Lite
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stylistNote: { type: Type.STRING },
            recommendedServices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  serviceId: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["serviceId", "reason"]
              }
            },
            recommendedStaff: {
              type: Type.OBJECT,
              properties: {
                staffId: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["staffId", "reason"]
            }
          },
          required: ["stylistNote", "recommendedServices", "recommendedStaff"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

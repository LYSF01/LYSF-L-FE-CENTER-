
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

// D. SCHEDULE OPTIMIZATION (AI ANALYTICS)
export const optimizeSchedule = async (appointments: any[], services: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Veriyi sadeleştirme
  const simplifiedApps = appointments.map(a => ({ 
    date: a.date, 
    time: a.time, 
    serviceId: a.serviceId,
    status: a.status 
  }));
  
  const simplifiedServices = services.map(s => ({ id: s.id, name: s.name }));

  const prompt = `
    ROL: L'YSF Life Center Veri Analisti ve Planlama Uzmanı.
    VERİ: 
    - Randevular: ${JSON.stringify(simplifiedApps)}
    - Hizmetler: ${JSON.stringify(simplifiedServices)}
    
    GÖREV: Geçmiş randevu verilerini analiz et ve randevu çizelgesini optimize et.
    
    ANALİZ ADIMLARI:
    1. Hangi gün ve saatlerde yoğunluk var? (Peak Hours)
    2. Hangi hizmetler en çok talep görüyor? (Popular Services)
    3. Verimsiz (boş) saatleri doldurmak için stratejik öneriler geliştir.
    4. Önümüzdeki hafta için örnek bir "Optimize Edilmiş Program" önerisi sun.
    
    ÇIKTI FORMATI (JSON):
    {
      "peakHours": [
        { "day": "Pazartesi", "hour": "14:00", "intensity": "Yüksek" }
      ],
      "popularServices": [
        { "serviceName": "Cilt Bakımı", "percentage": 45 }
      ],
      "strategicSuggestions": [
        "Salı sabahları boşluklar var, %20 indirimli 'Happy Hour' kampanyası yapılabilir."
      ],
      "optimizedScheduleProposal": [
        { "day": "Pazartesi", "hour": "09:00", "focus": "Hızlı İşlemler (Kaş/Bıyık)", "reason": "Sabah yoğunluğu az, kısa işlemlerle sirkülasyon artırılmalı." }
      ]
    }
  `;

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                peakHours: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING },
                            hour: { type: Type.STRING },
                            intensity: { type: Type.STRING }
                        }
                    }
                },
                popularServices: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            serviceName: { type: Type.STRING },
                            percentage: { type: Type.NUMBER }
                        }
                    }
                },
                strategicSuggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                optimizedScheduleProposal: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING },
                            hour: { type: Type.STRING },
                            focus: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        }
                    }
                }
            }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// E. DEMAND FORECASTING (AI PREDICTION)
export const forecastDemand = async (transactions: any[], services: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Aggregate monthly usage per service for the last 6 months
  const monthlyUsage: Record<string, Record<string, number>> = {};
  transactions.forEach(t => {
      const date = new Date(t.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      t.items.forEach((item: any) => {
          if (!monthlyUsage[item.id]) monthlyUsage[item.id] = {};
          if (!monthlyUsage[item.id][key]) monthlyUsage[item.id][key] = 0;
          monthlyUsage[item.id][key]++;
      });
  });

  const prompt = `
    ROL: L'YSF Life Center Finansal Planlama Yapay Zekası.
    VERİ: 
    - Geçmiş Hizmet Kullanımları (Ay bazlı): ${JSON.stringify(monthlyUsage)}
    - Hizmet Listesi: ${JSON.stringify(services.map(s => ({id: s.id, name: s.name})))}
    
    GÖREV: Gelecek ay için hizmet talep tahmini yap.
    
    ANALİZ:
    1. Mevsimsel trendleri ve büyüme oranlarını dikkate al.
    2. Her hizmet için "Tahmini Adet" ve "Büyüme Beklentisi (%)" hesapla.
    3. Düşüş beklenen hizmetler için kısa bir aksiyon önerisi ekle.
    
    ÇIKTI FORMATI (JSON):
    {
      "forecasts": [
        { 
          "serviceId": "...", 
          "serviceName": "...", 
          "predictedCount": 120, 
          "growthRate": 15, 
          "trend": "UP" | "DOWN" | "STABLE",
          "actionSuggestion": "..." 
        }
      ],
      "marketInsight": "Genel piyasa yorumu..."
    }
  `;

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                forecasts: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            serviceId: { type: Type.STRING },
                            serviceName: { type: Type.STRING },
                            predictedCount: { type: Type.NUMBER },
                            growthRate: { type: Type.NUMBER },
                            trend: { type: Type.STRING },
                            actionSuggestion: { type: Type.STRING }
                        }
                    }
                },
                marketInsight: { type: Type.STRING }
            }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// F. PROFITABILITY AUDIT (GERMAN DISCIPLINE)
export const analyzeProfitability = async (transactions: any[], expenses: any[], services: any[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Calculate raw metrics
    const serviceRevenue: Record<string, number> = {};
    const serviceCount: Record<string, number> = {};
    
    transactions.forEach(t => {
        t.items.forEach((item: any) => {
            serviceRevenue[item.id] = (serviceRevenue[item.id] || 0) + (item.price || 0);
            serviceCount[item.id] = (serviceCount[item.id] || 0) + 1;
        });
    });

    const prompt = `
      ROL: Alman Disiplinli Finansal Denetçi (Auditor).
      VERİ:
      - Hizmet Gelirleri: ${JSON.stringify(serviceRevenue)}
      - Hizmet Adetleri: ${JSON.stringify(serviceCount)}
      - Toplam Giderler: ${expenses.reduce((acc, e) => acc + e.amount, 0)}
      - Hizmet Maliyet Yapısı: ${JSON.stringify(services.map(s => ({id: s.id, name: s.name, cost: s.productCostPerSession || 0, duration: s.duration})))}
      
      GÖREV: Detaylı karlılık analizi yap.
      
      ANALİZ ADIMLARI:
      1. Her hizmetin "Net Kar Marjını" hesapla (Gelir - (Ürün Maliyeti + Operasyonel Gider Payı)).
      2. En karlı ve en zararlı hizmetleri belirle.
      3. "Pareto Analizi" yap: Gelirin %80'ini getiren %20'lik hizmetleri belirle.
      4. Finansal verimliliği artırmak için sert ve net önerilerde bulun.
      
      ÇIKTI FORMATI (JSON):
      {
        "serviceAnalysis": [
          { "serviceName": "...", "revenue": 1000, "estimatedCost": 400, "netProfit": 600, "margin": 60, "status": "PROFITABLE" | "CRITICAL" }
        ],
        "topPerformers": ["..."],
        "underPerformers": ["..."],
        "auditReport": "Detaylı denetçi raporu metni..."
      }
    `;

    return fetchWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    serviceAnalysis: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                serviceName: { type: Type.STRING },
                                revenue: { type: Type.NUMBER },
                                estimatedCost: { type: Type.NUMBER },
                                netProfit: { type: Type.NUMBER },
                                margin: { type: Type.NUMBER },
                                status: { type: Type.STRING }
                            }
                        }
                    },
                    topPerformers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    underPerformers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    auditReport: { type: Type.STRING }
                }
            }
          }
        });
        return JSON.parse(response.text || '{}');
    });
};

// G. PERSONALIZED RECOMMENDATIONS (AI WELLNESS PLAN)
export const getPersonalizedRecommendations = async (customer: any, services: any[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      ROL: L'YSF Life Center Kişisel Wellness Koçu ve Estetik Danışmanı.
      MÜŞTERİ PROFİLİ:
      - Ad: ${customer.fullName}
      - Yaş/Cinsiyet: (Tahmini)
      - Geçmiş İşlemler: ${JSON.stringify(customer.history)}
      - Satın Alınan Paketler: ${JSON.stringify(customer.packages)}
      - Vücut Analizi: ${JSON.stringify(customer.bodyAnalysis?.[0] || {})}
      - Tercihler: ${JSON.stringify(customer.preferences)}
      
      HİZMET LİSTESİ: ${JSON.stringify(services.map((s: any) => ({id: s.id, name: s.name, category: s.category})))}
      
      GÖREV: Bu müşteri için tamamen kişiselleştirilmiş, bütüncül bir "İyi Yaşam & Güzellik Planı" oluştur.
      
      BEKLENEN ÇIKTI (JSON):
      {
        "wellnessPlanTitle": "Örn: 'Kışa Hazırlık & Yenilenme Programı'",
        "introMessage": "Müşteriye hitaben, motive edici ve premium bir giriş yazısı.",
        "recommendedServices": [
          { "serviceId": "...", "reason": "Neden bu hizmet? (Cilt tipine/geçmişine göre)" }
        ],
        "dailyRoutineSuggestion": "Evde uygulayabileceği sabah/akşam rutini önerisi (kısa).",
        "nutritionTip": "Vücut analizine veya genel sağlığa yönelik 1 adet beslenme tüyosu."
      }
    `;

    return fetchWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    wellnessPlanTitle: { type: Type.STRING },
                    introMessage: { type: Type.STRING },
                    recommendedServices: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                serviceId: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            }
                        }
                    },
                    dailyRoutineSuggestion: { type: Type.STRING },
                    nutritionTip: { type: Type.STRING }
                }
            }
          }
        });
        return JSON.parse(response.text || '{}');
    });
};

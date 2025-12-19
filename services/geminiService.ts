
import { GoogleGenAI, Type } from "@google/genai";
import { ProductGroup, AnalysisResult } from "../types";

export class GeminiService {
  async analyzeCompany(
    companyName: string,
    selectedGroups: ProductGroup[],
    vat?: string
  ): Promise<AnalysisResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const groupsContext = selectedGroups.map(g => 
      `- **${g.name}**: ${g.description}`
    ).join('\n');

    const prompt = `
Направи проучване за фирмата "${companyName}" ${vat ? `с БУЛСТАТ ${vat}` : ''} като използваш Гуугъл търсене и намери следните данни:
1. Основна дейност на фирмата.
2. Тип клиент (Магазин, Дистрибутор, Краен клиент и т.н.).
3. Брой физически обекти и детайли за тяхната локация.
4. Официален уебсайт.
5. Списък с всички намерени публични имейли за контакт.
6. Списък с всички намерени телефонни номера.
7. Списък с отговорни лица/управители (имена, длъжност, личен телефон и имейл, ако са публично достъпни).
8. Съпоставка на фирмата с нашите продуктови групи:
${groupsContext}

ВАЖНО: Ако не намериш информация за конкретно поле, върни празен списък или null, не измисляй данни.
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              activity: { type: Type.STRING },
              clientType: { type: Type.STRING, enum: ["Магазин / Верига", "Дистрибутор/Рекламна агенция", "Краен клиент", "Физическо лице", "Друго / Неприложимо"] },
              locationsCount: { type: Type.STRING },
              locationDetails: { type: Type.STRING },
              website: { type: Type.STRING, nullable: true },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    categoryName: { type: Type.STRING },
                    suitability: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
                    reasoning: { type: Type.STRING }
                  },
                  required: ["categoryName", "suitability", "reasoning"]
                }
              },
              emails: { type: Type.ARRAY, items: { type: Type.STRING } },
              phoneNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
              responsiblePersons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    phone: { type: Type.STRING, nullable: true },
                    email: { type: Type.STRING, nullable: true }
                  },
                  required: ["name", "role"]
                }
              }
            },
            required: ["activity", "clientType", "matches", "emails", "phoneNumbers", "responsiblePersons", "website"]
          }
        },
      });

      const data = JSON.parse(response.text);
      const sources: Array<{ title: string; uri: string }> = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web && chunk.web.uri) {
            sources.push({ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri });
          }
        });
      }

      return {
        ...data,
        sources: sources.slice(0, 10)
      };
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }
}

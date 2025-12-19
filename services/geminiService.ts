
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
ИЗВЪРШИ ПРОУЧВАНЕ ЗА ФИРМА: "${companyName}" ${vat ? `(БУЛСТАТ: ${vat})` : ''}

ПРАВИЛА ЗА ВЕРИФИКАЦИЯ (МАКСИМУМ 2 СИМВОЛА РАЗЛИКА):
1. ПРОВЕРКА ЗА ТЕХНИЧЕСКА ГРЕШКА: Използвай Google Search. 
   - Ако името на фирмата в Google се различава с ЕДИН или ДВА символа от "${companyName}", приеми това за техническа грешка. Извърши анализа за намерената фирма и върни правилното име в "correctedName".
   - АКО РАЗЛИКАТА Е ПОВЕЧЕ ОТ ДВА СИМВОЛА (например добавени цели думи или коренно различна дума), ТОВА НЕ Е ТЕХНИЧЕСКА ГРЕШКА. Приеми, че това е друга фирма.
2. ЛИПСА НА СЪВПАДЕНИЕ: Ако не е намерено ТОЧНО съвпадение или съвпадение с максимум 2 символа разлика, ЗАДЪЛЖИТЕЛНО постави стойност "няма съвпадение в Гугъл" в полето "activity" и остави всички останали полета като null или празни масиви.
3. ПРЕДПАЗВАНЕ ОТ ХАЛЮЦИНАЦИИ: Не се опитвай да "напасваш" информация към фирма, която не съвпада строго с критерия за 2 символа.

ТЪРСЕНИ ДАННИ (ако има съвпадение):
1. Основна дейност на фирмата.
2. Тип клиент (Магазин, Дистрибутор, Краен клиент и т.н.).
3. Брой физически обекти и детайли за тяхната локация.
4. Официален уебсайт.
5. Публични имейли и телефони.
6. Отговорни лица и асоциирани контакти.
7. Потенциал по групи:
${groupsContext}

JSON РЕЗУЛТАТ:
Върни данните само в JSON формат.
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
              correctedName: { type: Type.STRING, nullable: true },
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


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
# ROLE
You are a high-precision B2B Lead Researcher for "Zografa". 
Your absolute priority is ACCURACY. Incorrect data is worse than no data.

# TARGET ENTITY
Name: "${companyName}"
${vat ? `VAT/BULSTAT ID: "${vat}"` : 'VAT/BULSTAT: Not provided'}

# ZERO HALLUCINATION PROTOCOL
1. **VAT MATCHING**: ${vat ? `The VAT/BULSTAT number "${vat}" is a unique identifier. Use it to confirm you are looking at the correct legal entity. If search results for this VAT show a different company name, prioritize the VAT number's data.` : 'No VAT provided. Be extremely careful with companies having similar names.'}
2. **DO NOT GUESS DOMAINS**: Never assume a website URL based on the company name. Only include it if you find a direct link or mention of ${vat ? `VAT "${vat}"` : `the name "${companyName}"`} on the site.
3. **"НЯМА ЯСНИ ДАННИ" RULE**: If results are ambiguous, or you find multiple unrelated entities and cannot distinguish them, you MUST set activity to "НЯМА ЯСНИ ДАННИ" and leave all contact fields empty.
4. **PRIVATE INDIVIDUALS (Физически лица)**: 
   - If the entity is a private person (not a business), categorize as "Физическо лице".
   - DO NOT extract contact data for individuals. Write: "Физическо лице - няма други данни".

# MANDATORY PROCESS
STEP 1: IDENTITY & ACTIVITY SEARCH. Use Google Search with both Name and ${vat ? 'VAT' : 'City/Context'} to find the official entity.
STEP 2: VALIDATION. Does the found info definitely belong to this specific entity?
STEP 3: CATEGORIZATION.
   - If Business: Match with catalog.
   - If Individual: Categorize as "Физическо лице".
   - If Missing/Unclear: "НЯМА ЯСНИ ДАННИ".

# CATALOG FOR MATCHING:
${groupsContext}

# OUTPUT FORMAT
Return a JSON object. If data is unclear, use null for website and empty arrays for others.
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
              activity: { type: Type.STRING, description: "Ясно описание или 'НЯМА ЯСНИ ДАННИ' или 'Физическо лице - няма други данни'" },
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
                    phone: { type: Type.STRING },
                    email: { type: Type.STRING }
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
        sources: sources.slice(0, 8)
      };
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }
}

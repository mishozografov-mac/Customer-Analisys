
import { GoogleGenAI, Type } from "@google/genai";
import { ProductGroup, AnalysisResult, ScoreLevel } from "./types";

export const SYSTEM_CONFIG = {
  MODEL_NAME: "gemini-3-pro-preview",
  TEMPERATURE: 0.2,
  API_VERSION: "v1.9 (Matrix Scoring)"
};

export const SYSTEM_PROMPT_TEXT = `
# ROLE AND OBJECTIVE
You are "Zografa Intelligence Agent" – a specialized AI expert in B2B lead generation for "Zografa" (shop equipment, displays, furniture).

# TASK: MATRIX SCORING
Analyze the company against the provided Product Catalog. 
Instead of choosing just one category, you MUST rate the suitability for EVERY category provided in the list.

# SCORING RULES:
- High: Perfect fit. High probability of sales. Ideal target.
- Medium: Fits some criteria but has limitations.
- Low: Fits "Negative Criteria" or is mostly irrelevant.
- NONE: No logical connection or info.

# SEARCH STRATEGY
Prioritize finding the official website, branches list, and contact info.
Search terms: "{companyName} магазини", "{companyName} обекти", "{companyName} контакти".

# INSTRUCTIONS
1. IDENTITY: Normalize company name.
2. EXTRACTION: Find all unique emails, phones, and key personnel.
3. SCALING: Count physical locations (Single, Small/Medium/Large Chain).
4. MULTI-SCORING: Assign High/Medium/Low/NONE to EVERY category ID sent in context.

# OUTPUT FORMAT
Strictly follow the JSON schema. Use Bulgarian for 'activity', 'analysis', and 'scale_analysis.details'.
`;

export class GeminiService {
  async analyzeCompany(
    companyName: string,
    productGroups: ProductGroup[],
    vat?: string
  ): Promise<AnalysisResult & { sources: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const CRITERIA_CONTEXT = productGroups.map(g => 
      `GROUP ID: "${g.id}"\nNAME: ${g.name}\nRULES: ${g.description}`
    ).join('\n------------------------\n');

    const userMessage = `
    CURRENT PRODUCT CATALOG:
    ${CRITERIA_CONTEXT}
    
    TASK: Analyze company "${companyName}" (Bulstat: ${vat || 'N/A'}).
    Rate suitability for EACH of the above categories.
    `;

    try {
      const response = await ai.models.generateContent({
        model: SYSTEM_CONFIG.MODEL_NAME,
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_PROMPT_TEXT,
          tools: [{ googleSearch: {} }],
          temperature: SYSTEM_CONFIG.TEMPERATURE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedName: { type: Type.STRING },
              activity: { type: Type.STRING },
              clientType: { type: Type.STRING },
              analysis: { type: Type.STRING, description: "Brief summary of why the highest scores were chosen." },
              scale_analysis: {
                type: Type.OBJECT,
                properties: {
                  estimated_locations: { type: Type.STRING },
                  scale_category: { type: Type.STRING, enum: ["Single", "Small Chain", "Medium Chain", "Large Chain", "Unknown"] },
                  details: { type: Type.STRING }
                },
                required: ["estimated_locations", "scale_category", "details"]
              },
              category_scores_list: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    score: { type: Type.STRING, enum: ["High", "Medium", "Low", "NONE"] }
                  },
                  required: ["id", "score"]
                }
              },
              contacts: {
                type: Type.OBJECT,
                properties: {
                  responsible_persons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        direct_contact: { type: Type.STRING }
                      },
                      required: ["name", "role", "direct_contact"]
                    }
                  },
                  general_contacts: {
                    type: Type.OBJECT,
                    properties: {
                      phones: { type: Type.ARRAY, items: { type: Type.STRING } },
                      emails: { type: Type.ARRAY, items: { type: Type.STRING } },
                      website: { type: Type.STRING }
                    },
                    required: ["phones", "emails", "website"]
                  }
                },
                required: ["responsible_persons", "general_contacts"]
              }
            },
            required: ["activity", "clientType", "category_scores_list", "scale_analysis", "contacts", "analysis"]
          }
        },
      });

      const rawData = JSON.parse(response.text || "{}");
      
      // Convert list to map for the frontend/storage
      const category_scores: { [key: string]: ScoreLevel } = {};
      (rawData.category_scores_list || []).forEach((item: any) => {
        category_scores[item.id] = item.score;
      });

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
        ...rawData,
        category_scores,
        sources: sources.slice(0, 10)
      };
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }
}


import { GoogleGenAI, Type } from "@google/genai";
import { ProductGroup, AnalysisResult, ScoreLevel } from "./types";

export const SYSTEM_CONFIG = {
  MODEL_NAME: 'gemini-3-pro-preview',
  TEMPERATURE: 0.2,
  API_VERSION: "v3.0 (Context-Based Intelligence)"
};

const buildCatalogContext = (groups: ProductGroup[]): string => {
  return groups.map(group => {
    return `
=== PRODUCT CATEGORY ===
ID: ${group.id}
NAME: "${group.name}"
TARGET PROFILE & LOGIC: 
${group.description}
========================
`;
  }).join('\n');
};

export const SYSTEM_PROMPT_BASE = `
# ROLE AND OBJECTIVE
You are "Zografa Intelligence Agent" – an expert B2B Sales Analyst for "Zografa" (Manufacturer of retail equipment, shelving systems, and commercial furniture).

# GEOGRAPHIC SCOPE:
- Do NOT limit your search to Bulgaria. Search EUROPE-WIDE (EU, UK, Balkans).
- If the company is international, prioritize their European headquarters or distribution network.

# DISTRIBUTOR CHECK (CRITICAL):
- Scan the provided text/website for keywords indicating a list of partners: "Distributors", "Where to buy", "Our Partners", "Dealers", "Export Network", "Дистрибутори", "Партньори".
- If found, set JSON field "distributor_signal": true and provide details.

# TASK: MATRIX SCORING
Analyze the company based STRICTLY on the Dynamic Product Catalog provided in the user message. 
You MUST rate the suitability for EVERY category provided in that list.

# SCORING RULES:
- High: Perfect fit. High probability of sales. Matches the "TARGET PROFILE & LOGIC" perfectly.
- Medium: Fits some criteria but has limitations.
- Low: Matches "НЕПОДХОДЯЩ профил" (Unsuitable profile) or is mostly irrelevant.
- NONE: No logical connection or info found.

# DATA FORMATTING:
- Extract Emails and Phones into SEPARATE arrays. Do not mix them.
- Ensure all reasoning and analysis are in Bulgarian.

# OUTPUT FORMAT
Strictly follow the JSON schema. Use Bulgarian for 'activity', 'analysis', 'distributor_details', and 'scale_analysis.details'.
`;

export class GeminiService {
  private getDomain(input: string): string | null {
    try {
      const url = input.startsWith('http') ? input : `http://${input}`;
      const domain = new URL(url).hostname.replace('www.', '');
      if (domain.includes('.') && domain.length > 3) return domain;
    } catch { }
    return null;
  }

  async analyzeCompany(
    companyName: string,
    productGroups: ProductGroup[],
    vat?: string
  ): Promise<AnalysisResult & { sources: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 1. Build dynamic context from current state
    const dynamicCatalog = buildCatalogContext(productGroups);

    // 2. Smart input handling for search context
    let contextHint = "";
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyName);
    const isUrl = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/.test(companyName);
    const isDigits = /^\d+$/.test(companyName) || (vat && /^\d+$/.test(vat));

    if (isEmail) {
      const domain = companyName.split('@')[1];
      if (!['gmail.com', 'yahoo.com', 'outlook.com', 'abv.bg', 'mail.bg'].includes(domain.toLowerCase())) {
        contextHint += `\n- Potential website domain: ${domain}`;
      }
    } else if (isUrl) {
      const domain = this.getDomain(companyName);
      if (domain) contextHint += `\n- Direct website domain: ${domain}`;
    }

    if (isDigits) {
      contextHint += `\n- The digits represent a VAT/EIK identifier.`;
    }

    const userMessage = `
    DYNAMIC PRODUCT CATALOG (USE THESE DEFINITIONS STRICTLY):
    ${dynamicCatalog}
    
    TARGET COMPANY:
    Name: "${companyName}"
    VAT/EIK Context: ${vat || 'Unknown'}
    ${contextHint}

    INSTRUCTIONS:
    1. Perform web research to understand what this company does and its scale.
    2. Rate suitability for EACH of the ${productGroups.length} categories in the Dynamic Product Catalog using the logic provided for each.
    3. Ensure you follow the specific exclusion rules (НЕПОДХОДЯЩ профил).
    `;

    try {
      const response = await ai.models.generateContent({
        model: SYSTEM_CONFIG.MODEL_NAME,
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_PROMPT_BASE,
          tools: [{ googleSearch: {} }],
          temperature: SYSTEM_CONFIG.TEMPERATURE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedName: { type: Type.STRING },
              activity: { type: Type.STRING },
              clientType: { type: Type.STRING },
              analysis: { type: Type.STRING },
              distributor_signal: { type: Type.BOOLEAN },
              distributor_details: { type: Type.STRING, nullable: true },
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
                  phones: { type: Type.ARRAY, items: { type: Type.STRING } },
                  emails: { type: Type.ARRAY, items: { type: Type.STRING } },
                  website: { type: Type.STRING }
                },
                required: ["phones", "emails", "website", "responsible_persons"]
              }
            },
            required: ["activity", "clientType", "category_scores_list", "scale_analysis", "contacts", "analysis", "distributor_signal"]
          }
        },
      });

      const rawData = JSON.parse(response.text || "{}");
      
      const category_scores: { [key: string]: ScoreLevel } = {};
      (rawData.category_scores_list || []).forEach((item: any) => {
        category_scores[item.id] = item.score;
      });

      const sources: Array<{ title: string; uri: string }> = [];
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any) => {
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

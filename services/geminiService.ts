
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams, Part, AnalysisResult } from "../types";
import { 
  TECHNICAL_TEMPLATE, 
  ORGANIC_TEMPLATE, 
  TECHNICAL_PHOTO_TEMPLATE,
  ORGANIC_PHOTO_TEMPLATE,
  PARTS_GENERATION_PROMPT, 
  COACH_SYSTEM_PROMPT,
  VISION_ANALYZER_PROMPT
} from "../constants";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to interpolate the prompt template
const buildPrompt = (params: GenerationParams): string => {
  const isOrganic = params.category === 'organic';
  const isPhoto = params.mode === 'photo';
  
  // Select the correct template based on Category and Mode
  let template = isOrganic 
    ? (isPhoto ? ORGANIC_PHOTO_TEMPLATE : ORGANIC_TEMPLATE)
    : (isPhoto ? TECHNICAL_PHOTO_TEMPLATE : TECHNICAL_TEMPLATE);
  
  // Basic replacement
  template = template.replace(/{OBJECT_NAME}/g, params.objectName);
  template = template.replace(/{ASPECT_RATIO}/g, params.aspectRatio);
  template = template.replace(/{DETAIL_LEVEL}/g, params.detailLevel);

  try {
    const parsed = JSON.parse(template);
    let finalPrompt = parsed.promptDetails.description;
    
    if (params.showLabels) {
        finalPrompt += " Ensure clear numbered labels with white leader lines.";
    } else {
        finalPrompt += " Do not include text labels or callout lines.";
    }

    if (params.category === 'organic' && params.isKidFriendly) {
        finalPrompt += " Ensure the visual is clinically clean, educational, and suitable for all ages (no gore).";
    }

    // Explicitly reinforce 8K requirement in the text prompt for Ultra settings
    if (params.detailLevel === 'Ultra') {
        finalPrompt += " Render in 8K resolution, ultra-high definition, 100 megapixel texture fidelity.";
    }
    
    // Add user hint if present in photo mode
    if (isPhoto && params.userHint) {
        finalPrompt += ` User hint for context: ${params.userHint}.`;
    }

    return finalPrompt;
  } catch (e) {
    console.error("Template parsing failed", e);
    return `Exploded view of ${params.objectName}`;
  }
};

export const generateImage = async (params: GenerationParams): Promise<string> => {
  const ai = getAIClient();
  const prompt = buildPrompt(params);

  try {
    const isHighFidelity = params.detailLevel === 'High' || params.detailLevel === 'Ultra';
    const modelName = isHighFidelity ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const imageConfig: any = {
      aspectRatio: params.aspectRatio,
    };

    if (modelName === 'gemini-3-pro-image-preview') {
       imageConfig.imageSize = '4K';
    }

    const parts: any[] = [];
    parts.push({ text: prompt });

    // Add reference image if in photo mode
    if (params.mode === 'photo' && params.referenceImage) {
        // Remove data URL prefix if present for the API call
        const base64Data = params.referenceImage.split(',')[1] || params.referenceImage;
        parts.push({
            inlineData: {
                mimeType: 'image/png', // Assuming PNG or standard image type
                data: base64Data
            }
        });
    }

    // FIX: Strictly format contents as an array of Content objects
    const contents = [{ role: 'user', parts: parts }];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: { imageConfig: imageConfig },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Check for safety blocks or other finish reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason) {
        throw new Error(`Generation stopped. Reason: ${finishReason}. The content might have violated safety policies.`);
    }
    
    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    if (JSON.stringify(error).includes("403") || error.message?.includes("403")) {
       throw new Error("Permission Denied: Please check your API Key. You may need to enable the Gemini API in your Google Cloud Console or use a paid project for Image generation.");
    }
    throw error;
  }
};

export const generateObjectParts = async (params: GenerationParams): Promise<Part[]> => {
    const ai = getAIClient();
    const prompt = PARTS_GENERATION_PROMPT
        .replace('{CATEGORY}', params.category)
        .replace('{OBJECT_NAME}', params.objectName);
    
    try {
        const contents = [{ role: 'user', parts: [{ text: prompt }] }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.INTEGER },
                            name: { type: Type.STRING },
                            system: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ['id', 'name', 'system', 'description']
                    }
                }
            }
        });
        
        const text = response.text || "[]";
        return JSON.parse(text) as Part[];
    } catch (e) {
        console.error("Failed to generate parts", e);
        return [];
    }
};

export const createCoachChat = (params: GenerationParams) => {
    const ai = getAIClient();
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: COACH_SYSTEM_PROMPT
        }
    });

    // Seed context
    chat.sendMessage({ message: `Current context: User is creating a ${params.category} view of ${params.objectName}. Aspect: ${params.aspectRatio}.` });
    
    return chat;
};

export const analyzeImage = async (base64Image: string, userHint?: string): Promise<AnalysisResult | null> => {
    const ai = getAIClient();
    const base64Data = base64Image.split(',')[1] || base64Image;

    try {
        const parts: any[] = [
             { text: VISION_ANALYZER_PROMPT + (userHint ? `\nUser Hint: ${userHint}` : '') },
             { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
        ];

        const contents = [{ role: 'user', parts: parts }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: ['technical_product', 'electronics', 'organism', 'unknown'] },
                        canonicalName: { type: Type.STRING },
                        viewpoint: { type: Type.STRING },
                        mainRegion: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER },
                                width: { type: Type.NUMBER },
                                height: { type: Type.NUMBER }
                            }
                        },
                        summary: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        sensitive: { type: Type.BOOLEAN }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as AnalysisResult;
    } catch (e) {
        console.error("Vision Analysis Failed", e);
        return null;
    }
};

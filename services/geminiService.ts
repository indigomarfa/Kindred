
import { GoogleGenAI, Type } from "@google/genai";

// Always use the environment variable directly for API key initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache to speed up repeated queries
const suggestionCache = new Map<string, string[]>();
const relatedCache = new Map<string, string[]>();

/**
 * Generates a creative bio using Gemini AI.
 */
export const generateSmartBio = async (
  interests: string[],
  occupation: string,
  personality: string
): Promise<string> => {
  try {
    const prompt = `
      Write a short, engaging, and modern social bio (max 40 words) for a user on a connection app called "Kindred".
      The user is a ${occupation}, identifies as an ${personality}, and likes: ${interests.join(', ')}.
      The tone should be friendly, professional yet approachable. No hashtags.
    `;

    // Direct call to generateContent with model and prompt
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access .text property directly (not as a function)
    return response.text?.trim() || "Could not generate bio at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate bio at this time.";
  }
};

/**
 * Generates a full profile persona using structured JSON output.
 */
export const generateFullProfile = async (name: string): Promise<any> => {
  try {
    const prompt = `Generate a cohesive and interesting persona for a user named "${name}" on a social connection app. 
    Provide a realistic occupation, a major city, a set of 4-5 specific interests, a personality type (Introvert, Extrovert, or Ambivert), 
    a preferred meeting time (Morning, Afternoon, Evening, or Weekends Only), and a short catchy bio. 
    Ensure all elements feel like they belong to the same person.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            occupation: { type: Type.STRING },
            city: { type: Type.STRING },
            interests: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            personality: { 
              type: Type.STRING,
              description: "Must be one of: Introvert, Extrovert, Ambivert"
            },
            preferredTime: { 
              type: Type.STRING, 
              description: "Must be one of: Morning, Afternoon, Evening, Weekends Only"
            },
            bio: { type: Type.STRING }
          },
          required: ["occupation", "city", "interests", "personality", "preferredTime", "bio"]
        }
      }
    });

    const text = response.text;
    // Cast to any to handle structured JSON response safely in various TS environments
    return text ? (JSON.parse(text) as any) : null;
  } catch (error) {
    console.error("Gemini Full Profile Error:", error);
    return null;
  }
};

/**
 * Suggests interests based on partial input using the model.
 */
export const getInterestSuggestions = async (input: string): Promise<string[]> => {
  if (input.length < 2) return [];
  
  const cacheKey = input.toLowerCase().trim();
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }

  try {
    const prompt = `Suggest 8 unique interests for partial text "${cacheKey}". 
    Focus on intellectual, professional, creative topics. Respond ONLY with a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    // Explicitly cast JSON.parse result to string[] to resolve 'unknown' type inference errors
    const result = JSON.parse(text) as string[];
    suggestionCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};

/**
 * Suggests related interests based on current interests list.
 */
export const getRelatedInterests = async (currentInterests: string[]): Promise<string[]> => {
  if (currentInterests.length === 0) return [];

  const cacheKey = [...currentInterests].sort().join('|').toLowerCase();
  if (relatedCache.has(cacheKey)) {
    return relatedCache.get(cacheKey)!;
  }

  try {
    const prompt = `Given these interests: ${currentInterests.join(', ')}, suggest 6 related interests. 
    Respond ONLY with a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    // Explicitly cast JSON.parse result to string[] to resolve 'unknown' type inference errors
    const result = JSON.parse(text) as string[];
    relatedCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Gemini Related Interests Error:", error);
    return [];
  }
};

import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSmartBio = async (
  interests: string[],
  occupation: string,
  personality: string
): Promise<string> => {
  if (!apiKey) return "Please configure your API Key to use AI features.";

  try {
    const prompt = `
      Write a short, engaging, and modern social bio (max 40 words) for a user on a connection app called "Kindred".
      The user is a ${occupation}, identifies as an ${personality}, and likes: ${interests.join(', ')}.
      The tone should be friendly, professional yet approachable. No hashtags.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate bio at this time.";
  }
};

export const generateFullProfile = async (name: string): Promise<any> => {
  if (!apiKey) return null;

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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Full Profile Error:", error);
    return null;
  }
};

export const getInterestSuggestions = async (input: string): Promise<string[]> => {
  if (!apiKey || input.length < 2) return [];

  try {
    const prompt = `Based on the partial text "${input}", suggest 8 unique, high-quality, and meaningful interests or hobbies. 
    Focus on intellectual, professional, creative, and niche topics. 
    Include variations, synonyms, and specific sub-topics. 
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};

export const getRelatedInterests = async (currentInterests: string[]): Promise<string[]> => {
  if (!apiKey || currentInterests.length === 0) return [];

  try {
    const prompt = `Given these interests: ${currentInterests.join(', ')}, suggest 6 related, complementary, or semantically close interests that the user might also enjoy. 
    Avoid obvious duplicates. Focus on variety and depth.
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Related Interests Error:", error);
    return [];
  }
};

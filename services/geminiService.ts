import { GoogleGenAI } from "@google/genai";

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
import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Updated GoogleGenAI initialization to directly use process.env.API_KEY as per the coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateNewArt(base64ImageData: string): Promise<string> {
  const model = 'gemini-2.5-flash-image';
  
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: 'image/png',
          },
        },
        {
          text: 'Create a new, more detailed and enhanced version of this pixel art. Maintain the original subject and style but improve the shading, color depth, and overall artistic quality.',
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("No image data found in Gemini response.");
}

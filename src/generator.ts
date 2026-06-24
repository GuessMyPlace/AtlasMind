import { db } from './database.js';
import { Type } from '@google/genai';
import { Place, Question } from './types.js';

const ResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the country, city, or landmark" },
    type: { type: Type.STRING, description: "Must be 'country', 'city', or 'landmark'" },
    country: { type: Type.STRING, description: "Full country name of the location" },
    city: { type: Type.STRING, description: "City name if applicable (can be empty/omitted for countries)" },
    latitude: { type: Type.NUMBER, description: "Precise coordinate latitude" },
    longitude: { type: Type.NUMBER, description: "Precise coordinate longitude" },
    description: { type: Type.STRING, description: "Detailed 1-2 sentence description explaining its geographic or cultural significance" },
    difficulty: { type: Type.STRING, description: "Must be 'easy', 'medium', or 'hard' based on how widely known it is globally" },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 search tags"
    },
    clues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 4 clues progressive in detail. Clue 1: Vague geographic context. Clue 2: Historical context or cultural hint. Clue 3: Architectural, statistical, or local specialty hint. Clue 4: Solvable clue with a signature identifier."
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "An educational trivia question about this place" },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 options"
          },
          correct_answer: { type: Type.STRING, description: "The correct option text exactly matching one of the options" },
          explanation: { type: Type.STRING, description: "Explains why this answer is correct" }
        },
        required: ["text", "options", "correct_answer", "explanation"]
      },
      description: "Exactly 2 educational trivia questions about this place"
    }
  },
  required: [
    "name",
    "type",
    "country",
    "latitude",
    "longitude",
    "description",
    "difficulty",
    "tags",
    "clues",
    "questions"
  ]
};

export async function generatePlaceWithGemini(
  ai: any,
  placeNameQuery: string,
  placeType: 'country' | 'city' | 'landmark',
  customInstruction: string = ''
): Promise<{ place: Place; questions: Question[] }> {
  const config = db.getQuotaConfig();

  // 1. Simulate Quota limits
  if (config.simulateQuotaLimit) {
    // Audit recent tokens
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recentLogs = db.getQuotaLogs().filter(l => l.timestamp >= oneMinuteAgo);
    const recentTokensSum = recentLogs.reduce((sum, l) => sum + l.tokens_used, 0);

    if (recentTokensSum >= config.maxTokensPerMinute) {
      throw new Error(`QUOTA_LIMIT_EXCEEDED: Simulated active tokens rate limit of ${config.maxTokensPerMinute} tokens/minute has been reached. Current: ${recentTokensSum}. Try again in 60s.`);
    }

    if (Math.random() < config.artificialErrorRate) {
      throw new Error("ARTIFICIAL_INTERNAL_ERROR: Simulated occasional backend/network failure trigger active.");
    }
  }

  // 2. Perform real prompt composition
  const systemInstruction = `You are AtlasMind, the core geodata generation agent for GuessMyPlace.
Your task is to generate meticulous, accurate structured geodata and educational trivia questions.
Always follow the schema structure strictly.
Do not return any conversational prefix or markdown wrappers outside the raw structural JSON object.`;

  const prompt = `Generate place details for a ${placeType} resembling or named "${placeNameQuery}".
Include exact coordinates (latitude & longitude), a high-quality description, progressive clues, and 2 unique multiple-choice trivia questions.
${customInstruction ? `Additional administrator guidelines: ${customInstruction}` : ''}`;

  try {
    const modelToUse = 'gemini-3.5-flash';
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: ResponseSchema,
        temperature: 0.7
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty response received from Gemini API.");
    }

    const payload = JSON.parse(textOutput.trim());

    // Basic validity enforcement
    const placeId = `p-${Math.random().toString(36).substr(2, 9)}`;
    
    // Format place
    const generatedPlace: Place = {
      id: placeId,
      name: payload.name || placeNameQuery,
      type: (payload.type as any) || placeType,
      latitude: Number(payload.latitude) || 0,
      longitude: Number(payload.longitude) || 0,
      country: payload.country || 'Unknown',
      city: payload.city || undefined,
      description: payload.description || 'Geographic coordinate generated by AtlasMind.',
      difficulty: (payload.difficulty as any) || 'medium',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      clues: Array.isArray(payload.clues) ? payload.clues : [],
      created_at: new Date().toISOString()
    };

    // Format questions
    const generatedQuestions: Question[] = [];
    if (Array.isArray(payload.questions)) {
      for (const q of payload.questions) {
        generatedQuestions.push({
          id: `q-${Math.random().toString(36).substr(2, 9)}`,
          place_id: placeId,
          text: q.text || 'Question text not generated',
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          correct_answer: q.correct_answer || 'A',
          explanation: q.explanation || ''
        });
      }
    }

    // Estimate realistic tokens consumed
    const wordsCount = JSON.stringify(payload).split(/\s+/).length + prompt.split(/\s+/).length;
    const estimatedTokens = Math.max(800, Math.round(wordsCount * 1.4));

    // Log quota usage to database
    db.addQuotaLog({
      tokens_used: estimatedTokens,
      calls_count: 1,
      model: modelToUse,
      prompt_summary: `Generate ${placeType}: "${placeNameQuery}"`
    });

    return {
      place: generatedPlace,
      questions: generatedQuestions
    };
  } catch (error: any) {
    console.error("Gemini data generation failed:", error);
    throw error;
  }
}

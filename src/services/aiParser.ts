/**
 * AI-Powered Storyboard Parser using OpenAI GPT
 * Uses GPT-4 to intelligently parse user input and generate storyboard elements
 */

import OpenAI from 'openai';
import { Character, Scene } from '../types/storyboard';

// Initialize OpenAI client
// In Expo/React Native, environment variables must be prefixed with EXPO_PUBLIC_
const getOpenAIKey = () => {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  console.log('[AIParser] OpenAI API Key check:', {
    exists: !!key,
    prefix: key?.substring(0, 10),
    length: key?.length
  });
  return key || 'your-api-key-here';
};

const openai = new OpenAI({
  apiKey: getOpenAIKey(),
  dangerouslyAllowBrowser: true // Note: In production, use backend proxy
});

interface AIParseResult {
  characters: Array<{
    name: string;
    description: string;
    appearance: {
      age?: string;
      gender?: string;
      build?: string;
      hair?: string;
      clothing?: string;
      distinctiveFeatures?: string[];
    };
    role: string;
  }>;
  scenes: Array<{
    name: string;
    location: string;
    timeOfDay: string;
    lighting: string;
    mood: string;
    environment: string;
    weather?: string;
  }>;
  storyBeats: string[];
  genre: string;
  mood: string;
  targetAudience: string;
}

/**
 * Use GPT-4 to parse user input and extract storyboard elements
 * Temperature: 0.2 for consistent, accurate results
 */
export async function parseUserInputWithAI(
  userInput: string,
  panelCount: number = 4
): Promise<AIParseResult> {
  console.log('[AIParser] Parsing user input with GPT-4:', userInput);

  const systemPrompt = `You are an expert storyboard artist and script analyst. Your job is to analyze a user's story idea and break it down into detailed storyboard elements.

CRITICAL RULES:
1. Stay EXACTLY true to the user's idea - do not add creative liberties
2. Extract only what is explicitly stated or clearly implied
3. If details are missing, use minimal, generic descriptions
4. Preserve the user's original intent and tone
5. Be precise and consistent in your analysis

Output Format: JSON only, no markdown, no explanations.`;

  const userPrompt = `Analyze this storyboard idea and extract the following elements:

User's Idea: "${userInput}"
Number of Panels: ${panelCount}

Extract:
1. **Characters**: List all characters/subjects mentioned. For each:
   - name (e.g., "Main Character", "The Dragon", "Person 1")
   - description (brief, based on user's text)
   - appearance (age, gender, build, hair, clothing, distinctive features if mentioned)
   - role (protagonist, antagonist, supporting, etc.)

2. **Scenes**: List all locations/settings. For each:
   - name (descriptive name)
   - location (the actual place: "park", "office", "medieval kitchen", etc.)
   - timeOfDay ("morning", "afternoon", "evening", "night", "unknown")
   - lighting (based on context: "natural daylight", "indoor lighting", "dramatic", etc.)
   - mood (the emotional tone: "cheerful", "tense", "mysterious", etc.)
   - environment (detailed description of the setting)
   - weather (if mentioned or relevant)

3. **Story Beats**: Break the idea into ${panelCount} sequential story beats/moments:
   - Beat 1: Establishing shot
   - Beats 2-${panelCount - 1}: Progressive story moments
   - Beat ${panelCount}: Resolution/conclusion
   Each beat should be a clear, actionable description for that panel.

4. **Genre**: Classify the genre (action, comedy, drama, horror, sci-fi, fantasy, etc.)

5. **Mood**: Overall mood/tone of the story

6. **Target Audience**: Who is this for? (general, animators, filmmakers, marketers, architects)

Return ONLY valid JSON in this exact format:
{
  "characters": [{"name": "...", "description": "...", "appearance": {...}, "role": "..."}],
  "scenes": [{"name": "...", "location": "...", "timeOfDay": "...", "lighting": "...", "mood": "...", "environment": "...", "weather": "..."}],
  "storyBeats": ["beat 1", "beat 2", ...],
  "genre": "...",
  "mood": "...",
  "targetAudience": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // gpt-4o supports JSON mode
      temperature: 0.2, // Low temperature for consistent, accurate results
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from GPT');
    }

    const parsed: AIParseResult = JSON.parse(content);
    console.log('[AIParser] Successfully parsed:', parsed);

    return parsed;
  } catch (error) {
    console.error('[AIParser] Error:', error);
    throw new Error(`AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert AI parse result to app format
 */
export function convertAIResultToAppFormat(aiResult: AIParseResult) {
  const { v4: uuidv4 } = require('uuid');

  // Convert characters
  const characters: Character[] = aiResult.characters.map(char => ({
    id: uuidv4(),
    name: char.name,
    description: char.description,
    appearance: {
      age: char.appearance.age || 'adult',
      gender: char.appearance.gender,
      build: char.appearance.build || 'average',
      hair: char.appearance.hair,
      clothing: char.appearance.clothing || 'casual',
      distinctiveFeatures: Array.isArray(char.appearance.distinctiveFeatures)
        ? char.appearance.distinctiveFeatures
        : []
    },
    role: char.role as any
  }));

  // Convert scenes
  const scenes: Scene[] = aiResult.scenes.map(scene => ({
    id: uuidv4(),
    name: scene.name,
    location: scene.location,
    timeOfDay: scene.timeOfDay as any,
    lighting: scene.lighting,
    mood: scene.mood,
    environment: scene.environment,
    weather: scene.weather
  }));

  return {
    characters,
    scenes,
    storyBeats: aiResult.storyBeats,
    genre: aiResult.genre,
    mood: aiResult.mood,
    targetAudience: aiResult.targetAudience as any
  };
}

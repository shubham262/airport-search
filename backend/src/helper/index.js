import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
const SearchIntentSchema = z.object({
	intent: z.enum(["iata", "city", "region", "country", "unknown"]),
	normalized_query: z
		.string()
		.describe(
			"Corrected English spelling (e.g., 'Londn' -> 'London', '東京' -> 'Tokyo', 'Bali' -> 'Denpasar')"
		),
	region_code: z
		.string()
		.optional()
		.describe(
			"If intent is region/state, guess the ISO region code (e.g. Hawaii -> US-HI)"
		),
});

export const parseSearchIntent = async (rawQuery) => {
	const { object } = await generateObject({
		model: google("gemini-2.5-flash"),
		schema: SearchIntentSchema,
		prompt: `
            You are a travel search query parser. 
            Analyze the user's raw input: "${rawQuery}".
            
            Rules:
            1. Fix typos (e.g., "München" -> "Munich").
            2. Translate to English (e.g., "パリ" -> "Paris").
            3. Resolve tourism aliases to actual municipalities (e.g., "Bali" -> "Denpasar").
            4. If it's a 3-letter code like "JFK" or "LON", intent is 'iata' and normalized_query is uppercase.
            5. If it's a state/province like "Hawaii" or "Ontario", intent is 'region' and provide the ISO region_code if known.
        `,
	});

	return object;
};

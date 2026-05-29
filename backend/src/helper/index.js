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
const intentCache = new Map();
const MAX_CACHE_SIZE = 1000;
export const parseSearchIntent = async (rawQuery) => {
	try {
		const cacheKey = rawQuery.trim().toLowerCase();
		if (intentCache.has(cacheKey)) {
			return intentCache.get(cacheKey);
		}
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
		intentCache.set(cacheKey, object);

		if (intentCache.size > MAX_CACHE_SIZE) {
			const oldestKey = intentCache.keys().next().value;
			intentCache.delete(oldestKey);
		}
		return object;
	} catch (error) {
		console.warn("AI Parser failed, using fallback:", error.message);

		return {
			intent: rawQuery.length === 3 ? "iata" : "unknown",
			normalized_query: rawQuery,
		};
	}
};
export const buildMatchQuery = (intentData) => {
	const { intent, normalized_query, region_code } = intentData;

	switch (intent) {
		case "iata":
			return {
				$or: [
					{ iata_code: normalized_query },
					{ municipality: { $regex: `^${normalized_query}`, $options: "i" } },
				],
			};
		case "region":
			if (region_code) {
				return { iso_region: region_code };
			}

			break;
	}

	return {
		$or: [
			{ municipality: { $regex: `^${normalized_query}$`, $options: "i" } },
			{ name: { $regex: normalized_query, $options: "i" } },
			{ aliases: { $regex: normalized_query, $options: "i" } },
		],
	};
};

export const buildAggregationPipeline = (matchQuery, normalizedQuery) => {
	return [
		{ $match: matchQuery },
		{
			$addFields: {
				relevanceScore: {
					$switch: {
						branches: [
							// 0: Exact municipality match → highest priority
							{
								case: {
									$regexMatch: {
										input: "$municipality",
										regex: `^${normalizedQuery}$`,
										options: "i",
									},
								},
								then: 0,
							},
							// 1: Municipality starts with query
							{
								case: {
									$regexMatch: {
										input: "$municipality",
										regex: `^${normalizedQuery}`,
										options: "i",
									},
								},
								then: 1,
							},
							// 2: Name contains query
							{
								case: {
									$regexMatch: {
										input: "$name",
										regex: normalizedQuery,
										options: "i",
									},
								},
								then: 2,
							},
						],
						default: 3,
					},
				},
			},
		},

		{ $sort: { relevanceScore: 1, tier: 1 } },
		{ $limit: 10 },
		{ $project: { __v: 0, createdAt: 0, updatedAt: 0 } },
	];
};

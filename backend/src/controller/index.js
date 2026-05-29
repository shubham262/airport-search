import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import db from "../model/index.js";
import {
	buildAggregationPipeline,
	buildMatchQuery,
	parseSearchIntent,
} from "../helper/index.js";

const { Airport } = db;
const searchCache = new Map();
const MAX_SEARCH_CACHE_SIZE = 2000;
export const seedAirportDataController = async (req, res) => {
	try {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const csvFilePath = path.join(__dirname, "../data/airports.csv");

		await Airport.deleteMany({});

		const batchSize = 2000;
		let batch = [];
		let totalInserted = 0;

		await new Promise((resolve, reject) => {
			fs.createReadStream(csvFilePath)
				.pipe(csv())
				.on("data", async (row) => {
					// THE RUTHLESS FILTER:
					// Drop closed airports, heliports, and small airports UNLESS they have an IATA code
					if (
						!["large_airport", "medium_airport"].includes(row.type) &&
						!row.iata_code
					)
						return;
					if (row.type === "closed") return;

					// Parse keywords into an array
					const keywordsArray = row.keywords
						? row.keywords.split(",").map((k) => k.trim())
						: [];

					// Assign Tier (1 = Global Hub, 2 = Regional, 3 = Small/Niche)
					const tier =
						row.type === "large_airport"
							? 1
							: row.type === "medium_airport"
							? 2
							: 3;

					// Build the Mongoose document
					const airportDoc = {
						ident: row.ident,
						type: row.type,
						name: row.name,
						location: {
							type: "Point",
							// MongoDB requires [longitude, latitude] strictly in this order
							coordinates: [
								parseFloat(row.longitude_deg),
								parseFloat(row.latitude_deg),
							],
						},
						elevation_ft: row.elevation_ft
							? parseInt(row.elevation_ft, 10)
							: null,
						iso_country: row.iso_country,
						iso_region: row.iso_region,
						municipality: row.municipality || "",
						iata_code: row.iata_code || "",
						icao_code: row.icao_code || "",
						tier: tier,
						keywords: keywordsArray,
						aliases: [], // Empty initially, can be patched later if needed
					};

					batch.push(airportDoc);

					// 3. Batch Insert Execution
					if (batch.length >= batchSize) {
						// Pause the stream while the database catches up
						const currentBatch = [...batch];
						batch = []; // Clear the batch immediately

						// We don't await here directly in the stream to prevent blocking,
						// but Mongoose connection pooling handles concurrent inserts well.
						Airport.insertMany(currentBatch).catch((err) => {
							console.error("Batch insert error:", err);
						});
						totalInserted += currentBatch.length;
					}
				})
				.on("end", async () => {
					// 4. Insert any remaining documents in the final batch
					if (batch.length > 0) {
						try {
							await Airport.insertMany(batch);
							totalInserted += batch.length;
						} catch (err) {
							console.error("Final batch insert error:", err);
							return reject(err);
						}
					}
					resolve();
				})
				.on("error", (error) => {
					reject(error);
				});
		});

		console.log(`Successfully seeded ${totalInserted} airports.`);

		return res.status(200).json({
			success: true,
			message: `Database successfully seeded with ${totalInserted} airports.`,
		});
	} catch (error) {
		console.error("Error seeding airports data:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to seed airports data",
			details: error.message,
		});
	}
};
export const searchAirportsController = async (req, res) => {
	try {
		const { query } = req.query;
		if (!query || query.length < 2) {
			return res.status(200).json({ success: true, intent: null, results: [] });
		}

		//in memory cache check
		const cacheKey = query.trim().toLowerCase();
		if (searchCache.has(cacheKey)) {
			return res.status(200).json(searchCache.get(cacheKey));
		}

		const intentData = await parseSearchIntent(query);

		const matchQuery = buildMatchQuery(intentData);
		const pipeline = buildAggregationPipeline(
			matchQuery,
			intentData.normalized_query
		);
		const results = await Airport.aggregate(pipeline);
		const responseData = {
			success: true,
			intent: intentData,
			results,
		};
		searchCache.set(cacheKey, responseData);
		return res.status(200).json(responseData);
	} catch (error) {
		console.error("Search API Error:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to execute search",
			details: error.message,
		});
	}
};

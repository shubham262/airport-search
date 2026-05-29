import mongoose, { Schema } from "mongoose";

const airportSchema = new mongoose.Schema(
	{
		ident: {
			type: String,
			required: true,
			trim: true,
			unique: true, 
		},
		type: {
			type: String,
			enum: [
				"large_airport",
				"medium_airport",
				"small_airport",
				"seaplane_base",
				"heliport",
				"closed",
			],
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		location: {
			
			type: {
				type: String,
				enum: ["Point"],
				default: "Point",
			},
			coordinates: {
				type: [Number], 
				required: true,
			},
		},
		elevation_ft: {
			type: Number,
			default: null,
		},
		iso_country: {
			type: String,
			required: true,
			trim: true, 
		},
		iso_region: {
			type: String,
			required: true,
			trim: true, 
		},
		municipality: {
			type: String,
			trim: true, 
		},
		iata_code: {
			type: String,
			trim: true,
			uppercase: true, 
		},
		icao_code: {
			type: String,
			trim: true,
			uppercase: true,
		},
		tier: {
			type: Number,
			required: true,
			default: 3,
			
		},
		keywords: [
			{
				type: String,
				trim: true,
			},
		],
		aliases: [
			{
				type: String,
				trim: true,
			},
		],
	},
	{ timestamps: true }
);

airportSchema.index({ iata_code: 1 });
airportSchema.index({ iso_region: 1 });

airportSchema.index({ municipality: 1 });

airportSchema.index({ name: "text", municipality: "text", aliases: "text" });

airportSchema.index({ location: "2dsphere" });

const Airport = mongoose.model("Airport", airportSchema);

export default Airport;

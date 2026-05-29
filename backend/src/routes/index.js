import express from "express";
import {
	searchAirportsController,
	seedAirportDataController,
} from "../controller/index.js";
const router = express.Router();
router.post("/seed", seedAirportDataController);
router.get("/search", searchAirportsController);
export default router;

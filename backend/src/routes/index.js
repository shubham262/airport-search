import express from "express";
import { seedAirportDataController } from "../controller/index.js";
const router = express.Router();
router.post("/seed", seedAirportDataController);
router.get("/search",)
export default router;

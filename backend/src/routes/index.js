import express from "express";
import { seedAirportDataController } from "../controller/index.js";
const router = express.Router();
router.post("/seed", seedAirportDataController);
export default router;

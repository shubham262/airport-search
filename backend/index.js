import express from "express";
import cors from "cors";
import { handleMongoDBConnection } from "./src/config/index.js";
import airportRoutes from "./src/routes/index.js";
await handleMongoDBConnection();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/airports", airportRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

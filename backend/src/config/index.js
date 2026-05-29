import mongoose from "mongoose";

export const handleMongoDBConnection = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("mongodb connection successfull");
	} catch (error) {
		console.log("error==>handleMongoDBConnection", error);
	}
};

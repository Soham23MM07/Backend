import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log(`Connect With Database ${DB_NAME}`);
  } catch (error) {
    console.log("Not Connect With Database");
    process.exit(1);
  }
};

export { connectDB };

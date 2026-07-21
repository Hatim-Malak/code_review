import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./logger.js";
dotenv.config();

export const connectdb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL)
        logger.info(`your database has been connected ${conn.connection.host}`)
    } catch (error) {
        logger.error(`error with connecting with mongodb ${error}`)        
    }
}
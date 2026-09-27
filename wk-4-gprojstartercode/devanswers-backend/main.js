import dotenv from 'dotenv';
import { startServer } from "./server.js";
import { connectToDB } from "./db.js";

dotenv.config();

async function startApp() {
    try {
        await connectToDB();
        await startServer();
    } catch (error) {
        console.error('Error starting application:', error);
        process.exit(1);
    }
}

startApp();

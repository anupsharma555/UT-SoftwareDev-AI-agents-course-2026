import express from "express";
import { searchThreads } from "../controllers/searchController.js";
import authHandler from "../middleware/authHandler.js";

const router = express.Router();

router.get("/threads", authHandler, searchThreads);

export default router;

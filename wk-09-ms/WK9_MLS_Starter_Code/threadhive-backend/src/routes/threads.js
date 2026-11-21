import express from "express";
import {
  getAllThreads,
  getThreadByID,
  createThread,
  updateThread,
  deleteThread,
  getThreadSummary,
  rephraseText,
} from "../controllers/threadController.js";

import authHandler from "../middleware/authHandler.js";

const router = express.Router();

router.get("/", authHandler, getAllThreads);
router.get("/:id", authHandler, getThreadByID);
router.get("/:id/summary", authHandler, getThreadSummary);
router.post("/rephrase", authHandler, rephraseText);
router.post("/", authHandler, createThread);
router.put("/:id", authHandler, updateThread);
router.delete("/:id", authHandler, deleteThread);

export default router;

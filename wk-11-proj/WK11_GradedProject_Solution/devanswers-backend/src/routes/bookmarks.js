import express from "express";

import {
  saveBookmark,
  unsaveBookmark,
  getSavedQuestions,
  getSavedQuestionIds,
} from "../controllers/bookmarkController.js";
import authenticate from "../middleware/authHandler.js";

const router = express.Router();

// All bookmark routes require authentication.
// Static /ids declared before param routes (defensive ordering).
router.get("/ids", authenticate, getSavedQuestionIds);
router.get("/", authenticate, getSavedQuestions);
router.post("/", authenticate, saveBookmark);
router.delete("/:questionId", authenticate, unsaveBookmark);

export default router;

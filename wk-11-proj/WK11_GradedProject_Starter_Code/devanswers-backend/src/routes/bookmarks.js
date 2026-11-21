import express from "express";
import {
  addBookmark,
  removeBookmark,
  getBookmarkIds,
  getBookmarks,
} from "../controllers/bookmarkController.js";
import authenticate from "../middleware/authHandler.js";

const router = express.Router();

// All bookmark routes are per-user and require authentication
router.get("/", authenticate, getBookmarks);
router.get("/ids", authenticate, getBookmarkIds);
router.post("/", authenticate, addBookmark);
router.delete("/:questionId", authenticate, removeBookmark);

export default router;

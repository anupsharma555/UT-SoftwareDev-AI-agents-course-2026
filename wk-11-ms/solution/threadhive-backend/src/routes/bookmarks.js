import express from "express";
import authHandler from "../middleware/authHandler.js";
import {
  addBookmark,
  deleteBookmark,
  getBookmarks,
} from "../controllers/bookmarkController.js";

const router = express.Router();

router.post("/threads/:id/bookmark", authHandler, addBookmark);
router.delete("/threads/:id/bookmark", authHandler, deleteBookmark);
router.get("/bookmarks", authHandler, getBookmarks);

export default router;

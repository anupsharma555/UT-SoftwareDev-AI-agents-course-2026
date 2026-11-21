import mongoose from "mongoose";
import Bookmark from "../models/Bookmark.js";
import Thread from "../models/Thread.js";
import { createAppError } from "../utils/createAppError.js";

export const createBookmark = async (userId, threadId) => {
  if (!mongoose.isValidObjectId(threadId)) {
    throw createAppError("Invalid thread id", 400);
  }

  const thread = await Thread.findById(threadId);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }

  try {
    const bookmark = await Bookmark.create({ user: userId, thread: threadId });
    return { bookmark, created: true };
  } catch (err) {
    // Unique compound index ({ user, thread }) makes saves idempotent: a
    // duplicate insert raises E11000, so we return the existing bookmark.
    if (err.code === 11000) {
      const bookmark = await Bookmark.findOne({
        user: userId,
        thread: threadId,
      });
      return { bookmark, created: false };
    }
    throw err;
  }
};

export const removeBookmark = async (userId, threadId) => {
  if (!mongoose.isValidObjectId(threadId)) {
    throw createAppError("Invalid thread id", 400);
  }

  // Idempotent: findOneAndDelete returns null when nothing matched, no throw.
  await Bookmark.findOneAndDelete({ user: userId, thread: threadId });
};

export const getBookmarksByUser = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "thread",
      populate: [
        { path: "author", select: "name" },
        { path: "subreddit", select: "name description" },
      ],
    });

  // Drop bookmarks whose thread was deleted (populate -> null) so the list
  // never returns dangling entries.
  return bookmarks.map((b) => b.thread).filter((thread) => thread !== null);
};

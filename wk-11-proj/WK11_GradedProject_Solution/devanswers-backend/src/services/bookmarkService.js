import mongoose from "mongoose";
import Bookmark from "../models/Bookmark.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import { createAppError } from "../utils/createAppError.js";

export const saveBookmarkService = async (userId, questionId) => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw createAppError("A valid questionId is required", 400);
  }

  const question = await Question.findById(questionId);
  if (!question) {
    throw createAppError("Question not found", 404);
  }

  const existing = await Bookmark.findOne({ user: userId, question: questionId });
  if (existing) {
    return { bookmark: existing, created: false };
  }

  try {
    const bookmark = await Bookmark.create({ user: userId, question: questionId });
    return { bookmark, created: true };
  } catch (error) {
    // A racing insert (two tabs / double-click) trips the unique index; treat as
    // "already saved" by returning the row that won the race rather than a 500.
    if (error.code === 11000) {
      const bookmark = await Bookmark.findOne({ user: userId, question: questionId });
      return { bookmark, created: false };
    }
    throw error;
  }
};

export const unsaveBookmarkService = async (userId, questionId) => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw createAppError("A valid questionId is required", 400);
  }

  // Idempotent: deleting a non-existent bookmark is not an error.
  await Bookmark.deleteOne({ user: userId, question: questionId });

  return { questionId };
};

export const getSavedQuestionsService = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "question",
      populate: [
        { path: "author", select: "name" },
        { path: "tags" },
      ],
    });

  const savedQuestions = await Promise.all(
    bookmarks
      // Drop dangling bookmarks whose question was since deleted.
      .filter((bookmark) => bookmark.question)
      .map(async (bookmark) => {
        const question = bookmark.question.toObject();
        const answerCount = await Answer.countDocuments({
          questionId: question._id,
        });
        return { ...question, answerCount, savedAt: bookmark.createdAt };
      }),
  );

  return savedQuestions;
};

export const getSavedQuestionIdsService = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId })
    .select("question")
    .sort({ createdAt: -1 });

  return bookmarks.map((bookmark) => bookmark.question.toString());
};

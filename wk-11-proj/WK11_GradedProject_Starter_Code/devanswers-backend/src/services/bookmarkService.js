import mongoose from "mongoose";
import Bookmark from "../models/Bookmark.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import { createAppError } from "../utils/createAppError.js";

const assertValidQuestionId = (questionId) => {
  // isValidObjectId also accepts numbers, which then fail to cast (500), so require a string.
  if (typeof questionId !== "string" || !mongoose.isValidObjectId(questionId)) {
    throw createAppError("Invalid question id", 400);
  }
};

// Saves a question for a user. Idempotent: returns { created: false } if it was already saved.
export const addBookmarkService = async (userId, questionId) => {
  if (!questionId) {
    throw createAppError("questionId is required", 400);
  }
  assertValidQuestionId(questionId);

  const questionExists = await Question.exists({ _id: questionId });
  if (!questionExists) {
    throw createAppError("Question not found", 404);
  }

  try {
    await Bookmark.create({ user: userId, question: questionId });
    return { created: true };
  } catch (error) {
    // Duplicate key on the unique (user, question) index means it is already saved.
    if (error.code === 11000) {
      return { created: false };
    }
    throw error;
  }
};

// Removes a saved question. Idempotent: succeeds even if it was not saved.
export const removeBookmarkService = async (userId, questionId) => {
  assertValidQuestionId(questionId);
  await Bookmark.deleteOne({ user: userId, question: questionId });
};

// Question ids saved by the user, newest saved first.
export const getBookmarkedIdsService = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1, _id: -1 })
    .select("question");

  return bookmarks.map((bookmark) => bookmark.question.toString());
};

// Full question objects saved by the user, newest saved first. Same shape as getAllQuestionsService.
export const getBookmarkedQuestionsService = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1, _id: -1 })
    .populate({
      path: "question",
      populate: [{ path: "author", select: "name" }, { path: "tags" }],
    });

  // Skip any orphaned bookmark whose question no longer exists.
  const questions = bookmarks
    .map((bookmark) => bookmark.question)
    .filter(Boolean);

  return Promise.all(
    questions.map(async (question) => {
      const answerCount = await Answer.countDocuments({ questionId: question._id });
      return { ...(question.toObject?.() ?? question), answerCount };
    }),
  );
};

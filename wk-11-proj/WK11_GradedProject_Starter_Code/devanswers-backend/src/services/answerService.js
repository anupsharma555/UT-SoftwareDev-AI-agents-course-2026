import mongoose from 'mongoose';
import { createAppError } from '../utils/createAppError.js';
import Answer from '../models/Answer.js';
import { handleVote } from './voteService.js';
import { getAI } from '../utils/geminiClient.js';

export const getAnswersByQuestionIdService = async (questionId) => {
  const answers = await Answer.find({ questionId }).populate('author', 'name');

  if (!answers || answers.length === 0) {
    throw createAppError("No answers found for this question", 404);
  }

  return answers;
};


export const createAnswerService = async ({ questionId, answerText, author }) => {
  const newAnswer = new Answer({
    questionId,
    answerText,
    author,
  });

  await newAnswer.save();

  const populatedAnswer = await Answer.findById(newAnswer._id).populate('author', 'name');

  if (!populatedAnswer) {
    throw createAppError('Failed to populate answer after saving', 500);
  }

  return populatedAnswer;
};

export const updateAnswerService = async (answerId, answerText, loggedInUser) => {
  if (!mongoose.isValidObjectId(answerId)) {
    throw createAppError('Invalid answer id', 400);
  }

  const answer = await Answer.findById(answerId);

  if (!answer) {
    throw createAppError('Answer not found', 404);
  }

  // Only the author may edit (admins included are NOT allowed to edit others' posts).
  if (answer.author.toString() !== loggedInUser.id.toString()) {
    throw createAppError('Not authorized to update this answer', 403);
  }

  const newText = typeof answerText === 'string' ? answerText.trim() : '';
  if (!newText) {
    throw createAppError('Answer text is required', 400);
  }

  // Saving identical text is not an edit: leave editedAt untouched.
  // Older answers were stored untrimmed, so compare trimmed values.
  if ((answer.answerText ?? '').trim() !== newText) {
    answer.answerText = newText;
    answer.editedAt = new Date();
    await answer.save();
  }

  return Answer.findById(answerId).populate('author', 'name');
};

export const deleteAnswerService = async (answerId, loggedInUser) => {
  const answer = await Answer.findById(answerId);

  if (!answer) {
    throw createAppError("Answer not found", 404);
  }

  if (
    answer.author.toString() !== loggedInUser.id.toString() &&
    !loggedInUser.isAdmin
  ) {
    throw createAppError('Not authorized to delete this answer', 403);
  }

  await Answer.findByIdAndDelete(answerId);
};

export const upvoteAnswerService = async (answerId, userId) => {
  const document = await handleVote(Answer, answerId, userId, "upvote");

  if (!document) {
    throw createAppError("Failed to upvote answer", 400);
  }

  return document;
};


export const downvoteAnswerService = async (answerId, userId) => {
  const document = await handleVote(Answer, answerId, userId, "downvote");

  if (!document) {
    throw createAppError("Failed to downvote answer", 400);
  }

  return document;
};

export const summarizeAnswersService = async (questionTitle, questionDescription, answers) => {
  if (!answers || answers.length < 3) {
    throw createAppError('At least 3 answers are required to summarize.', 400);
  }

  const answersText = answers
    .map((a, i) => `${i + 1}. ${a.answerText}`)
    .join('\n\n');

  const prompt = `Summarize the following answers to a developer question in 3-5 sentences.
Cover: the main consensus approach, key differences between answers, and any important caveats.
Return only the summary text — no JSON, no markdown, no bullet points.

Question: ${questionTitle}
${questionDescription}

Answers:
${answersText}`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return { summary: response.text.trim() };
};
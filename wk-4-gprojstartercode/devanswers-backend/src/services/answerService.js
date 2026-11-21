import Answer from '../models/Answer.js';
import { createAppError } from '../utils/createAppError.js';
import { handleVote } from './voteService.js';

// Enforce ownership in the service for every caller that edits or deletes answers.
function requireAnswerEditor(answer, user, action) {
  if (answer.author.toString() !== user?.id?.toString() && !user?.isAdmin) {
    throw createAppError(`Not authorized to ${action} this answer`, 403);
  }
}

export async function getAnswersByQuestionIdService(questionId) {
  const answers = await Answer.find({ questionId }).populate('author', 'name');
  if (!answers?.length) {
    throw createAppError('No answers found for this question', 404);
  }
  return answers;
}

export async function createAnswerService({ questionId, answerText, author }) {
  const answer = new Answer({ questionId, answerText, author });
  await answer.save();
  await answer.populate('author', 'name');
  return answer;
}

export async function updateAnswerService(answerId, answerText, loggedInUser) {
  const answer = await Answer.findById(answerId);
  if (!answer) {
    throw createAppError('Answer not found', 404);
  }

  requireAnswerEditor(answer, loggedInUser, 'update');
  answer.answerText = answerText;
  await answer.save();
  await answer.populate('author', 'name');
  return answer;
}

export async function deleteAnswerService(answerId, loggedInUser) {
  const answer = await Answer.findById(answerId);
  if (!answer) {
    throw createAppError('Answer not found', 404);
  }

  requireAnswerEditor(answer, loggedInUser, 'delete');
  await Answer.findByIdAndDelete(answerId);
}

async function voteOnAnswer(answerId, userId, voteType) {
  const answer = await handleVote(Answer, answerId, userId, voteType);
  if (!answer) {
    throw createAppError(`Failed to ${voteType} answer`, 400);
  }
  return answer;
}

export function upvoteAnswerService(answerId, userId) {
  return voteOnAnswer(answerId, userId, 'upvote');
}

export function downvoteAnswerService(answerId, userId) {
  return voteOnAnswer(answerId, userId, 'downvote');
}

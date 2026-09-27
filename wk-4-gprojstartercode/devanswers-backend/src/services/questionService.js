import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Tag from '../models/Tag.js';
import { createAppError } from '../utils/createAppError.js';
import { handleVote } from './voteService.js';

// Create and update share tag resolution so questions store tag IDs consistently.
async function resolveTagIds(tags) {
  if (typeof tags !== 'string') {
    throw createAppError('Tags must be a comma-separated string', 400);
  }

  // Ignore empty entries and repeated names before looking up or creating tags.
  const names = [...new Set(tags.split(',').map((name) => name.trim()).filter(Boolean))];
  const ids = [];

  for (const name of names) {
    let tag = await Tag.findOne({ name });
    if (!tag) {
      tag = await Tag.create({ name });
    }
    ids.push(tag._id);
  }

  return ids;
}

function requireQuestionEditor(question, user, action) {
  if (question.author.toString() !== user?.id?.toString() && !user?.isAdmin) {
    throw createAppError(`Not authorized to ${action} this question`, 403);
  }
}

export async function getAllQuestionsService() {
  const questions = await Question.find({})
    .populate({ path: 'author', select: 'name' })
    .populate('tags')
    .sort({ createdAt: -1 });

  if (!questions?.length) {
    throw createAppError('No questions found', 404);
  }

  return Promise.all(questions.map(async (question) => ({
    ...question.toObject(),
    answerCount: await Answer.countDocuments({ questionId: question._id }),
  })));
}

export async function getQuestionByIdService(id) {
  // Return the new view count from the same database operation that increments it.
  const question = await Question.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true },
  )
    .populate({ path: 'author', select: 'name' })
    .populate('tags');

  if (!question) {
    throw createAppError('Question not found', 404);
  }

  const answers = await Answer.find({ questionId: id })
    .populate({ path: 'author', select: 'name' });

  return { ...question.toObject(), answers };
}

export async function createQuestionService({ title, description, tags, author }) {
  const tagIds = await resolveTagIds(tags);
  const question = new Question({ title, description, tags: tagIds, author });
  await question.save();
  return question;
}

export async function updateQuestionService(id, title, description, tags, loggedInUser) {
  const question = await Question.findById(id);
  if (!question) {
    throw createAppError('Question not found', 404);
  }

  requireQuestionEditor(question, loggedInUser, 'update');

  if (title !== undefined) question.title = title;
  if (description !== undefined) question.description = description;
  if (tags !== undefined) question.tags = await resolveTagIds(tags);

  await question.save();
  return question;
}

export async function deleteQuestionService(id, loggedInUser) {
  const question = await Question.findById(id);
  if (!question) {
    throw createAppError('Question not found', 404);
  }

  requireQuestionEditor(question, loggedInUser, 'delete');
  await Question.findByIdAndDelete(id);
  await Answer.deleteMany({ questionId: id });
  return question;
}

async function voteOnQuestion(questionId, userId, voteType) {
  const question = await handleVote(Question, questionId, userId, voteType);
  if (!question) {
    throw createAppError(`Failed to ${voteType} question`, 400);
  }
  return question;
}

export function upvoteQuestionService(questionId, userId) {
  return voteOnQuestion(questionId, userId, 'upvote');
}

export function downvoteQuestionService(questionId, userId) {
  return voteOnQuestion(questionId, userId, 'downvote');
}

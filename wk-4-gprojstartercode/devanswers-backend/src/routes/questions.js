import express from 'express';
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
} from '../controllers/questionController.js';
import {
  getAnswersByQuestionId,
  createAnswer,
} from '../controllers/answerController.js';
import authenticate from '../middleware/authHandler.js';

const router = express.Router();

// Public question and answer reads.
router.get('/', getAllQuestions);
router.get('/:questionId/answers', getAnswersByQuestionId);
router.get('/:id', getQuestionById);

// Authenticated question and answer writes.
router.post('/', authenticate, createQuestion);
router.post('/:questionId/answers', authenticate, createAnswer);
router.put('/:id', authenticate, updateQuestion);
router.delete('/:id', authenticate, deleteQuestion);
router.post('/:id/upvote', authenticate, upvoteQuestion);
router.post('/:id/downvote', authenticate, downvoteQuestion);

export default router;

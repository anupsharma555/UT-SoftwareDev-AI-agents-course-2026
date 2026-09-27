import express from 'express';
import authRouter from './auth.js';
import questionsRouter from './questions.js';
import answersRouter from './answers.js';
import tagsRouter from './tags.js';

const router = express.Router();

// Registration and login are public.
router.use('/auth', authRouter);

// Resource routers apply authentication to endpoints that need it.
router.use('/questions', questionsRouter);
router.use('/answers', answersRouter);
router.use('/tags', tagsRouter);

export default router;

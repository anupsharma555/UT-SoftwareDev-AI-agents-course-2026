import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import questionReducer, {
  fetchQuestions,
  fetchQuestionById,
  updateQuestion,
  updateAnswer,
} from '../../src/reducers/questionSlice';

/**
 * Integration Tests: Edit Flow with Redux + MSW
 * Real question slice, MSW-intercepted API. No component rendering.
 */

const BASE_URL = 'http://localhost:3001/api';

const createTestStore = () =>
  configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({
        userInfo: { userId: 'user-1', token: 'mock-jwt-token-alice', name: 'Alice Johnson' },
      }),
    },
  });

describe('Edit Flow Integration Tests (Redux + MSW)', () => {
  let store;

  beforeEach(async () => {
    store = createTestStore();
    await store.dispatch(fetchQuestions());
    await store.dispatch(fetchQuestionById('question-1'));
  });

  describe('updateQuestion', () => {
    it('updates the current question in place and keeps its answers and votes', async () => {
      const before = store.getState().question.currentQuestion;

      await store.dispatch(
        updateQuestion({
          questionId: 'question-1',
          title: 'New title',
          description: 'New description',
          tags: 'react, redux',
        }),
      );

      const after = store.getState().question.currentQuestion;
      expect(after.title).toBe('New title');
      expect(after.description).toBe('New description');
      expect(after.tags.map((t) => t.name)).toEqual(['react', 'redux']);
      expect(after.editedAt).toBe('2026-02-01T10:00:00.000Z');
      expect(after.answers).toEqual(before.answers);
      expect(after.voteCount).toBe(before.voteCount);
      expect(after.author).toEqual(before.author);
    });

    it('updates the matching entry in the question list', async () => {
      await store.dispatch(
        updateQuestion({ questionId: 'question-1', title: 'New title', description: 'D', tags: 'a' }),
      );

      const listEntry = store.getState().question.questions.find((q) => q._id === 'question-1');
      expect(listEntry.title).toBe('New title');
    });

    it('never sets the page-wide loading flag', async () => {
      const promise = store.dispatch(
        updateQuestion({ questionId: 'question-1', title: 'T', description: 'D', tags: 'a' }),
      );
      expect(store.getState().question.loading).toBe(false);
      await promise;
      expect(store.getState().question.loading).toBe(false);
    });

    it('rejects with the server message and leaves state unchanged on 403', async () => {
      server.use(
        http.put(`${BASE_URL}/questions/:id`, () =>
          HttpResponse.json(
            { success: false, message: 'Not authorized to update this question' },
            { status: 403 },
          ),
        ),
      );
      const before = store.getState().question.currentQuestion;

      const result = await store.dispatch(
        updateQuestion({ questionId: 'question-1', title: 'Hacked', description: 'D', tags: 'a' }),
      );

      expect(result.type).toBe('question/updateQuestion/rejected');
      expect(result.payload).toBe('Not authorized to update this question');
      expect(store.getState().question.currentQuestion).toEqual(before);
    });
  });

  describe('updateAnswer', () => {
    it('replaces only the edited answer', async () => {
      await store.dispatch(updateAnswer({ answerId: 'answer-2', answerText: 'Edited text' }));

      const answers = store.getState().question.currentQuestion.answers;
      const edited = answers.find((a) => a._id === 'answer-2');
      const other = answers.find((a) => a._id === 'answer-1');
      expect(edited.answerText).toBe('Edited text');
      expect(edited.editedAt).toBe('2026-02-01T10:00:00.000Z');
      expect(edited.author.name).toBe('Alice Johnson');
      expect(other.answerText).toBe('Use the useState hook to manage local component state.');
      expect(other.editedAt).toBeUndefined();
    });

    it('rejects with the server message on 400', async () => {
      server.use(
        http.put(`${BASE_URL}/answers/:answerId`, () =>
          HttpResponse.json({ success: false, message: 'Answer text is required' }, { status: 400 }),
        ),
      );

      const result = await store.dispatch(updateAnswer({ answerId: 'answer-2', answerText: ' ' }));

      expect(result.payload).toBe('Answer text is required');
    });
  });
});

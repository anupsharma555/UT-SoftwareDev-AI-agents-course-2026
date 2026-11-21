// Unit tests for questionSlice.js using Vitest. The tests should verify:
// - The initial state is correctly defined.
// - Reducer state transitions for fetchQuestions (pending, fulfilled, rejected).
// - Creating a new question adds it to the state (postQuestion fulfilled, rejected).
//
// Uses the direct reducer + action creator pattern (same as MLS reducer tests):
// questionReducer(state, thunkAction.fulfilled(payload)) — no service mocking needed.

import { describe, it, expect } from 'vitest';
import questionReducer, {
  fetchQuestions,
  postQuestion,
  editQuestion,
  editAnswer,
} from '../../../src/reducers/questionSlice.js';

describe('questionSlice', () => {
  const initialState = {
    questions: [],
    currentQuestion: null,
    loading: false,
    error: null,
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      const state = questionReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchQuestions async thunk', () => {
    it('should handle pending state', () => {
      const state = questionReducer(initialState, fetchQuestions.pending());

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state and populate questions', () => {
      const mockQuestions = [
        { _id: 'q1', title: 'First Question' },
        { _id: 'q2', title: 'Second Question' },
      ];

      const state = questionReducer(
        initialState,
        fetchQuestions.fulfilled(mockQuestions, '')
      );

      expect(state.loading).toBe(false);
      expect(state.questions).toEqual(mockQuestions);
      expect(state.questions).toHaveLength(2);
      expect(state.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const errorMessage = 'Failed to fetch questions';
      const state = questionReducer(
        initialState,
        fetchQuestions.rejected(null, '', null, errorMessage)
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('postQuestion async thunk', () => {
    it('should add new question to list on fulfilled', () => {
      const existingState = {
        ...initialState,
        questions: [{ _id: 'q1', title: 'Existing Question' }],
      };

      const newQuestion = {
        _id: 'q3',
        title: 'New Question',
        description: 'Description',
        tags: ['redux'],
      };

      const state = questionReducer(
        existingState,
        postQuestion.fulfilled(newQuestion, '', {})
      );

      expect(state.questions).toHaveLength(2);
      expect(state.questions).toContainEqual(newQuestion);
      expect(state.currentQuestion).toEqual(newQuestion);
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const errorMessage = 'Failed to post question';
      const state = questionReducer(
        initialState,
        postQuestion.rejected(null, '', {}, errorMessage)
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('editQuestion async thunk', () => {
    it('should replace currentQuestion and the matching questions[] entry on fulfilled', () => {
      const existingState = {
        ...initialState,
        questions: [
          { _id: 'q1', title: 'Old Title', answerCount: 2 },
          { _id: 'q2', title: 'Other' },
        ],
        currentQuestion: {
          _id: 'q1',
          title: 'Old Title',
          description: 'Old description',
          isEdited: false,
          answers: [{ _id: 'a1', answerText: 'An answer' }],
        },
      };

      const payload = {
        _id: 'q1',
        title: 'New Title',
        description: 'New description',
        tags: [{ _id: 't1', name: 'react' }],
        author: { _id: 'user-1', name: 'Alice' },
        isEdited: true,
        editedAt: '2026-06-12T00:00:00.000Z',
      };

      const state = questionReducer(
        existingState,
        editQuestion.fulfilled(payload, '', { questionId: 'q1' })
      );

      // currentQuestion reflects the edit
      expect(state.currentQuestion.title).toBe('New Title');
      expect(state.currentQuestion.description).toBe('New description');
      expect(state.currentQuestion.isEdited).toBe(true);
      expect(state.currentQuestion.editedAt).toBe('2026-06-12T00:00:00.000Z');
      // answers (not returned by the update endpoint) are preserved
      expect(state.currentQuestion.answers).toHaveLength(1);
      // matching list entry is updated, others untouched
      expect(state.questions[0].title).toBe('New Title');
      expect(state.questions[0].isEdited).toBe(true);
      expect(state.questions[1].title).toBe('Other');
    });

    it('should set error on rejected', () => {
      const errorMessage = 'Failed to update question';
      const state = questionReducer(
        initialState,
        editQuestion.rejected(null, '', {}, errorMessage)
      );

      expect(state.error).toBe(errorMessage);
    });
  });

  describe('editAnswer async thunk', () => {
    it('should replace the matching answer in currentQuestion.answers on fulfilled', () => {
      const existingState = {
        ...initialState,
        currentQuestion: {
          _id: 'q1',
          answers: [
            { _id: 'a1', answerText: 'Old text', isEdited: false, voteCount: 3 },
            { _id: 'a2', answerText: 'Untouched answer' },
          ],
        },
      };

      const payload = {
        _id: 'a1',
        answerText: 'Updated text',
        author: { _id: 'user-1', name: 'Alice' },
        isEdited: true,
        editedAt: '2026-06-12T00:00:00.000Z',
      };

      const state = questionReducer(
        existingState,
        editAnswer.fulfilled(payload, '', { answerId: 'a1' })
      );

      expect(state.currentQuestion.answers[0].answerText).toBe('Updated text');
      expect(state.currentQuestion.answers[0].isEdited).toBe(true);
      // other answers are left alone
      expect(state.currentQuestion.answers[1].answerText).toBe('Untouched answer');
    });

    it('should set error on rejected', () => {
      const errorMessage = 'Failed to update answer';
      const state = questionReducer(
        initialState,
        editAnswer.rejected(null, '', {}, errorMessage)
      );

      expect(state.error).toBe(errorMessage);
    });
  });
});

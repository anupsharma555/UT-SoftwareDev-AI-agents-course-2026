// Unit tests for bookmarkSlice.js using the direct reducer + action creator
// pattern (same as questionSlice.test.jsx) — no service mocking needed.

import { describe, it, expect } from 'vitest';
import bookmarkReducer, {
  fetchSavedIds,
  fetchSavedQuestions,
  toggleBookmark,
  clearBookmarks,
} from '../../../src/reducers/bookmarkSlice.js';

describe('bookmarkSlice', () => {
  const initialState = {
    savedIds: [],
    savedQuestions: [],
    loadingIds: false,
    loadingList: false,
    error: null,
  };

  describe('initial state', () => {
    it('returns the initial state', () => {
      const state = bookmarkReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchSavedIds', () => {
    it('populates savedIds on fulfilled', () => {
      const ids = ['q1', 'q2'];
      const state = bookmarkReducer(
        initialState,
        fetchSavedIds.fulfilled(ids, ''),
      );

      expect(state.loadingIds).toBe(false);
      expect(state.savedIds).toEqual(ids);
    });

    it('sets loadingIds on pending', () => {
      const state = bookmarkReducer(initialState, fetchSavedIds.pending());
      expect(state.loadingIds).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchSavedQuestions', () => {
    it('populates savedQuestions on fulfilled', () => {
      const questions = [
        { _id: 'q1', title: 'First' },
        { _id: 'q2', title: 'Second' },
      ];
      const state = bookmarkReducer(
        initialState,
        fetchSavedQuestions.fulfilled(questions, ''),
      );

      expect(state.loadingList).toBe(false);
      expect(state.savedQuestions).toEqual(questions);
    });

    it('sets loadingList on pending', () => {
      const state = bookmarkReducer(
        initialState,
        fetchSavedQuestions.pending(),
      );
      expect(state.loadingList).toBe(true);
    });
  });

  describe('toggleBookmark', () => {
    it('adds an id to savedIds when saving', () => {
      const state = bookmarkReducer(
        initialState,
        toggleBookmark.fulfilled({ questionId: 'q1', op: 'save' }, '', {
          questionId: 'q1',
        }),
      );

      expect(state.savedIds).toContain('q1');
    });

    it('does not duplicate an id already saved', () => {
      const existing = { ...initialState, savedIds: ['q1'] };
      const state = bookmarkReducer(
        existing,
        toggleBookmark.fulfilled({ questionId: 'q1', op: 'save' }, '', {
          questionId: 'q1',
        }),
      );

      expect(state.savedIds).toEqual(['q1']);
    });

    it('removes the id and its card from savedQuestions when unsaving', () => {
      const existing = {
        ...initialState,
        savedIds: ['q1', 'q2'],
        savedQuestions: [
          { _id: 'q1', title: 'First' },
          { _id: 'q2', title: 'Second' },
        ],
      };

      const state = bookmarkReducer(
        existing,
        toggleBookmark.fulfilled({ questionId: 'q1', op: 'unsave' }, '', {
          questionId: 'q1',
        }),
      );

      expect(state.savedIds).toEqual(['q2']);
      expect(state.savedQuestions).toEqual([{ _id: 'q2', title: 'Second' }]);
    });

    it('sets error on rejected', () => {
      const state = bookmarkReducer(
        initialState,
        toggleBookmark.rejected(null, '', { questionId: 'q1' }, 'Bookmark failed'),
      );

      expect(state.error).toBe('Bookmark failed');
    });
  });

  describe('clearBookmarks', () => {
    it('resets state to initial', () => {
      const populated = {
        savedIds: ['q1'],
        savedQuestions: [{ _id: 'q1' }],
        loadingIds: false,
        loadingList: false,
        error: 'some error',
      };

      const state = bookmarkReducer(populated, clearBookmarks());
      expect(state).toEqual(initialState);
    });
  });
});

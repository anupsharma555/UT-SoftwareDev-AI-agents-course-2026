import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import bookmarkReducer, {
  fetchBookmarkIds,
  fetchBookmarkedQuestions,
  toggleBookmark,
} from '../../src/reducers/bookmarkSlice';
import userReducer, { logout } from '../../src/reducers/userSlice';
import { mockBookmarkedIds, mockQuestions } from '../mocks/mockData';

/**
 * Integration Tests: Bookmark Flow with Redux + MSW
 * Real bookmark slice, MSW-intercepted API. No component rendering.
 */

const BASE_URL = 'http://localhost:3001/api';

const createTestStore = () =>
  configureStore({
    reducer: {
      bookmark: bookmarkReducer,
      user: userReducer,
    },
    preloadedState: {
      user: {
        userInfo: { userId: 'user-1', token: 'mock-jwt-token-alice', name: 'Alice Johnson' },
        login: { status: 'idle', error: null },
        registration: { status: 'idle', error: null },
      },
    },
  });

describe('Bookmark Flow Integration Tests (Redux + MSW)', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('loads the saved ids', async () => {
    await store.dispatch(fetchBookmarkIds());

    expect(store.getState().bookmark.ids).toEqual(mockBookmarkedIds);
  });

  it('loads the saved questions and syncs the ids', async () => {
    await store.dispatch(fetchBookmarkedQuestions());

    const { questions, ids } = store.getState().bookmark;
    expect(questions.map((q) => q._id)).toEqual(['question-2']);
    expect(ids).toEqual(['question-2']);
  });

  it('saves a question (adds it to the front of the ids)', async () => {
    await store.dispatch(fetchBookmarkIds());

    await store.dispatch(toggleBookmark({ questionId: 'question-1', shouldBookmark: true }));

    expect(store.getState().bookmark.ids).toEqual(['question-1', 'question-2']);
  });

  it('unsaves a question', async () => {
    await store.dispatch(fetchBookmarkIds());

    await store.dispatch(toggleBookmark({ questionId: 'question-2', shouldBookmark: false }));

    expect(store.getState().bookmark.ids).toEqual([]);
  });

  it('updates the saved state immediately, before the request finishes', async () => {
    const promise = store.dispatch(
      toggleBookmark({ questionId: 'question-1', shouldBookmark: true }),
    );

    expect(store.getState().bookmark.ids).toContain('question-1');
    await promise;
  });

  it('rolls back a failed save and keeps the server message', async () => {
    server.use(
      http.post(`${BASE_URL}/bookmarks`, () =>
        HttpResponse.json({ success: false, message: 'Token is not valid.' }, { status: 401 }),
      ),
    );

    const result = await store.dispatch(
      toggleBookmark({ questionId: 'question-1', shouldBookmark: true }),
    );

    expect(result.type).toBe('bookmark/toggleBookmark/rejected');
    expect(store.getState().bookmark.ids).not.toContain('question-1');
    expect(store.getState().bookmark.error).toBe('Token is not valid.');
  });

  it('rolls back a failed unsave', async () => {
    await store.dispatch(fetchBookmarkIds());
    server.use(
      http.delete(`${BASE_URL}/bookmarks/:questionId`, () =>
        HttpResponse.json({ success: false, message: 'Boom' }, { status: 500 }),
      ),
    );

    await store.dispatch(toggleBookmark({ questionId: 'question-2', shouldBookmark: false }));

    expect(store.getState().bookmark.ids).toContain('question-2');
  });

  it('clears all saved state on logout', async () => {
    await store.dispatch(fetchBookmarkedQuestions());
    expect(store.getState().bookmark.questions.length).toBeGreaterThan(0);

    store.dispatch(logout());

    expect(store.getState().bookmark).toEqual({ ids: [], questions: [], pending: {}, error: null });
  });

  it('ignores a second toggle for the same question while the first is in flight', async () => {
    let posts = 0;
    let deletes = 0;
    server.use(
      http.post(`${BASE_URL}/bookmarks`, () => {
        posts += 1;
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
      http.delete(`${BASE_URL}/bookmarks/:questionId`, () => {
        deletes += 1;
        return HttpResponse.json({ data: {} });
      }),
    );

    const first = store.dispatch(toggleBookmark({ questionId: 'question-1', shouldBookmark: true }));
    const second = store.dispatch(toggleBookmark({ questionId: 'question-1', shouldBookmark: false }));
    await Promise.all([first, second]);

    expect(posts).toBe(1);
    expect(deletes).toBe(0);
    expect(store.getState().bookmark.ids).toContain('question-1');
    expect(store.getState().bookmark.pending).toEqual({});
  });

  it('keeps an in-flight save when a slower ids fetch returns without it', async () => {
    let releasePost;
    server.use(
      http.post(`${BASE_URL}/bookmarks`, async () => {
        await new Promise((resolve) => { releasePost = resolve; });
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
    );

    const toggle = store.dispatch(toggleBookmark({ questionId: 'question-1', shouldBookmark: true }));
    await store.dispatch(fetchBookmarkIds()); // server does not know about question-1 yet

    expect(store.getState().bookmark.ids).toContain('question-1');
    releasePost();
    await toggle;
    expect(store.getState().bookmark.ids).toContain('question-1');
  });

  it("discards a fetch that finishes after logout, so the next user never sees the previous user's saves", async () => {
    let releaseFetch;
    server.use(
      http.get(`${BASE_URL}/bookmarks/ids`, async () => {
        await new Promise((resolve) => { releaseFetch = resolve; });
        return HttpResponse.json({ data: ['question-2'] });
      }),
    );

    const fetch = store.dispatch(fetchBookmarkIds());
    await new Promise((resolve) => setTimeout(resolve, 0));
    store.dispatch(logout());
    releaseFetch();
    await fetch;

    expect(store.getState().bookmark.ids).toEqual([]);
  });

  it('only ever contains questions that exist in the mock data', () => {
    expect(mockQuestions.some((q) => q._id === mockBookmarkedIds[0])).toBe(true);
  });
});

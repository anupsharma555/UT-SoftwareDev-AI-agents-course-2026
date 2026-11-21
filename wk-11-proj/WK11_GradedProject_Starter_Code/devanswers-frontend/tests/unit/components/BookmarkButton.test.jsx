import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Link } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import BookmarkButton from '../../../src/components/Shared/BookmarkButton';
import bookmarkReducer from '../../../src/reducers/bookmarkSlice';

const BASE_URL = 'http://localhost:3001/api';

const createStore = ({ userInfo = { userId: 'user-1', token: 'tok' }, ids = [] } = {}) =>
  configureStore({
    reducer: {
      user: () => ({ userInfo }),
      bookmark: bookmarkReducer,
    },
    preloadedState: { bookmark: { ids, questions: [], pending: {}, error: null } },
  });

const renderButton = (storeOptions, ui = <BookmarkButton questionId="q1" />) => {
  const store = createStore(storeOptions);
  render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the unsaved state when the question is not saved', () => {
    renderButton({ ids: [] });

    const button = screen.getByRole('button', { name: 'Bookmark question' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the saved state when the question is saved', () => {
    renderButton({ ids: ['q1'] });

    const button = screen.getByRole('button', { name: 'Remove bookmark' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('saves the question on click and updates immediately', async () => {
    const user = userEvent.setup();
    const store = renderButton({ ids: [] });

    await user.click(screen.getByRole('button', { name: 'Bookmark question' }));

    expect(store.getState().bookmark.ids).toContain('q1');
    expect(await screen.findByRole('button', { name: 'Remove bookmark' })).toBeInTheDocument();
  });

  it('unsaves the question on click', async () => {
    const user = userEvent.setup();
    const store = renderButton({ ids: ['q1'] });

    await user.click(screen.getByRole('button', { name: 'Remove bookmark' }));

    expect(store.getState().bookmark.ids).not.toContain('q1');
  });

  it('alerts and sends no request when the user is not logged in', async () => {
    const user = userEvent.setup();
    let requested = false;
    server.use(
      http.post(`${BASE_URL}/bookmarks`, () => {
        requested = true;
        return HttpResponse.json({ data: {} });
      }),
    );
    const store = renderButton({ userInfo: null });

    await user.click(screen.getByRole('button', { name: 'Bookmark question' }));

    expect(window.alert).toHaveBeenCalledWith('You must be logged in to bookmark a question.');
    expect(requested).toBe(false);
    expect(store.getState().bookmark.ids).toEqual([]);
  });

  it('never shows a saved icon to an anonymous user', () => {
    renderButton({ userInfo: null, ids: ['q1'] });

    expect(screen.getByRole('button', { name: 'Bookmark question' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reverts and alerts when the server rejects the save', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/bookmarks`, () =>
        HttpResponse.json({ success: false, message: 'Token is not valid.' }, { status: 401 }),
      ),
    );
    const store = renderButton({ ids: [] });

    await user.click(screen.getByRole('button', { name: 'Bookmark question' }));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(window.alert.mock.calls[0][0]).toContain('Token is not valid.');
    expect(store.getState().bookmark.ids).toEqual([]);
  });

  it('does not follow a surrounding link when clicked', async () => {
    const user = userEvent.setup();
    renderButton(
      { ids: [] },
      <Link to="/question/q1" onClick={() => { window.__linkClicked = true; }}>
        <BookmarkButton questionId="q1" />
      </Link>,
    );
    window.__linkClicked = false;

    await user.click(screen.getByRole('button', { name: 'Bookmark question' }));

    expect(window.__linkClicked).toBe(false);
  });
});

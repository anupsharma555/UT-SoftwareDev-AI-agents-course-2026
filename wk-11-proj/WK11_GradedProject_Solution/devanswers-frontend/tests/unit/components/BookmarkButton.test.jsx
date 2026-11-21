import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BookmarkButton from '../../../src/components/Shared/BookmarkButton';
import bookmarkReducer from '../../../src/reducers/bookmarkSlice';

const createStore = ({
  userInfo = { userId: 'user-1', name: 'Alice', token: 'mock-jwt-token-alice' },
  savedIds = [],
} = {}) =>
  configureStore({
    reducer: {
      bookmark: bookmarkReducer,
      user: () => ({ userInfo }),
    },
    preloadedState: {
      bookmark: {
        savedIds,
        savedQuestions: [],
        loadingIds: false,
        loadingList: false,
        error: null,
      },
    },
  });

const renderButton = (storeOptions = {}) => {
  const store = createStore(storeOptions);
  const utils = render(
    <Provider store={store}>
      <BookmarkButton questionId="question-1" />
    </Provider>,
  );
  return { store, ...utils };
};

describe('BookmarkButton', () => {
  it('renders the outline (Save) icon when the question is not saved', () => {
    renderButton({ savedIds: [] });
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders the filled (Saved) icon when the question is saved', () => {
    renderButton({ savedIds: ['question-1'] });
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
  });

  it('renders nothing when the user is not authenticated', () => {
    const { container } = renderButton({ userInfo: null });
    expect(container.innerHTML).toBe('');
  });

  it('dispatches toggleBookmark on click, flipping the icon to Saved', async () => {
    const { store } = renderButton({ savedIds: [] });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // After the toggleBookmark thunk resolves (MSW POST /bookmarks), the id is
    // added to savedIds and the icon flips.
    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument();
    expect(store.getState().bookmark.savedIds).toContain('question-1');
  });
});

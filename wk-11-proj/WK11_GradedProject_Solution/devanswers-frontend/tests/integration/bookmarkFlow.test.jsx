import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import QuestionCard from '../../src/components/Question/QuestionCard';
import Profile from '../../src/pages/Profile/Profile';
import questionReducer from '../../src/reducers/questionSlice';
import bookmarkReducer from '../../src/reducers/bookmarkSlice';
import { resetBookmarks } from '../mocks/handlers';
import { mockQuestions } from '../mocks/mockData';

/**
 * Integration: bookmark flow with Redux + MSW.
 * Saving from a card flips the icon to filled; the saved question then appears
 * on the profile, and unsaving it there removes the card.
 */

const authedUser = {
  userId: 'user-1',
  name: 'Alice Johnson',
  token: 'mock-jwt-token-alice',
};

const createStore = () =>
  configureStore({
    reducer: {
      question: questionReducer,
      bookmark: bookmarkReducer,
      user: () => ({ userInfo: authedUser, loading: false, error: null }),
    },
  });

const renderWith = (store, ui) =>
  render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>,
  );

describe('Bookmark Flow Integration (Redux + MSW)', () => {
  beforeEach(() => {
    resetBookmarks([]);
  });

  it('saves a question from a card, shows it on the profile, then unsaves it there', async () => {
    const store = createStore();
    const question = mockQuestions[0];

    // 1) Save from a question card — icon flips to filled.
    const card = renderWith(store, <QuestionCard question={question} />);

    await userEvent.click(
      card.getByRole('button', { name: 'Save' }),
    );

    expect(
      await card.findByRole('button', { name: 'Saved' }),
    ).toBeInTheDocument();
    expect(store.getState().bookmark.savedIds).toContain(question._id);

    card.unmount();

    // 2) Profile lists the saved question.
    const profile = renderWith(store, <Profile />);

    expect(await profile.findByText(question.title)).toBeInTheDocument();

    // 3) Unsaving from the profile removes the card.
    await userEvent.click(profile.getByRole('button', { name: 'Saved' }));

    await waitFor(() =>
      expect(profile.queryByText(question.title)).not.toBeInTheDocument(),
    );
    expect(store.getState().bookmark.savedIds).not.toContain(question._id);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import QuestionCard from '../../../src/components/Question/QuestionCard';
import QuestionContent from '../../../src/components/Question/QuestionContent';
import questionReducer from '../../../src/reducers/questionSlice';
import bookmarkReducer from '../../../src/reducers/bookmarkSlice';

const question = {
  _id: 'q1',
  title: 'How do I use React hooks?',
  description: 'Help with hooks.',
  voteCount: 1,
  answerCount: 0,
  tags: [{ _id: 't1', name: 'react' }],
  author: { _id: 'user-2', name: 'Bob' },
  createdAt: '2026-01-10T10:00:00.000Z',
};

const renderWithStore = (ui, ids = []) => {
  const store = configureStore({
    reducer: {
      question: questionReducer,
      bookmark: bookmarkReducer,
      user: () => ({ userInfo: { userId: 'user-1', token: 'tok' } }),
    },
    preloadedState: { bookmark: { ids, questions: [], pending: {}, error: null } },
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>,
  );
};

describe('Bookmark control placement', () => {
  it('shows an unsaved bookmark control on a question card', () => {
    renderWithStore(<QuestionCard question={question} />);

    expect(screen.getByRole('button', { name: 'Bookmark question' })).toBeInTheDocument();
  });

  it('shows a saved bookmark control on a question card for a saved question', () => {
    renderWithStore(<QuestionCard question={question} />, ['q1']);

    expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeInTheDocument();
  });

  it('shows the bookmark control on the question page', () => {
    renderWithStore(<QuestionContent question={question} />);

    expect(screen.getByRole('button', { name: 'Bookmark question' })).toBeInTheDocument();
  });
});

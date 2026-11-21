import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import QuestionDetail from '../../src/pages/Question/QuestionDetail';
import questionReducer from '../../src/reducers/questionSlice';

/**
 * Integration Tests: inline Edit flow (Redux + real components + MSW).
 * Renders the QuestionDetail page so edits dispatched from the inline forms
 * propagate back through the store and re-render the displayed content.
 */

const author = { userId: 'user-1', token: 'mock-jwt-token-alice', name: 'Alice Johnson' };

const renderDetail = (questionId, userInfo) => {
  const store = configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({ userInfo, loading: false, error: null }),
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/question/${questionId}`]}>
        <Routes>
          <Route path="/question/:id" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  return store;
};

describe('Edit Flow Integration Tests (Redux + components + MSW)', () => {
  it('lets the author edit a question description inline and shows the edited badge without navigating', async () => {
    const user = userEvent.setup();
    // question-3 is authored by user-1 and has no answers (single Edit control)
    renderDetail('question-3', author);

    // Wait for the question to load
    await screen.findByText('How do I center a div in CSS?');

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const description = screen.getByLabelText('Edit description');
    await user.clear(description);
    await user.type(description, 'Use display: flex with justify-content and align-items.');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Updated content and the edited badge appear in place
    await waitFor(() => {
      expect(
        screen.getByText('Use display: flex with justify-content and align-items.')
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/edited/i)).toBeInTheDocument();

    // Still on the detail view (no navigation) — the answer form is present
    expect(screen.getByRole('button', { name: /post answer/i })).toBeInTheDocument();
  });

  it('lets the author edit one of their answers inline and shows the edited badge', async () => {
    const user = userEvent.setup();
    // question-1 has answer-2 authored by user-1
    renderDetail('question-1', author);

    const answerText = await screen.findByText(
      'You can also lift the state up to a common parent component.'
    );
    const answerCard = answerText.closest('.alist-answer-card');

    await user.click(within(answerCard).getByRole('button', { name: /^edit$/i }));

    const textarea = within(answerCard).getByLabelText('Edit answer');
    await user.clear(textarea);
    await user.type(textarea, 'Lifting state up to a shared parent is the idiomatic fix.');
    await user.click(within(answerCard).getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Lifting state up to a shared parent is the idiomatic fix.')
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });

  it('shows no Edit controls to a logged-in non-author', async () => {
    // user-99 authored neither question-1 nor any of its answers
    renderDetail('question-1', { userId: 'user-99', token: 'mock-jwt-token-other' });

    await screen.findByText('How do I manage state in React?');

    expect(
      screen.queryByRole('button', { name: /^edit$/i })
    ).not.toBeInTheDocument();
  });
});

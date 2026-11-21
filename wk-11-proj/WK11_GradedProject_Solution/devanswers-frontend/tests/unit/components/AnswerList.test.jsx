import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AnswerList from '../../../src/components/Answer/AnswerList';
import questionReducer, {
  fetchQuestionById,
} from '../../../src/reducers/questionSlice';

const createMockStore = (userInfo = { userId: 'user-1' }) => {
  return configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({
        userInfo,
        loading: false,
        error: null,
      }),
    },
  });
};

const mockAnswers = [
  {
    _id: 'a1',
    answerText: 'Use the useState hook for local state.',
    author: { _id: 'user-2', name: 'Alice' },
    voteCount: 5,
    createdAt: '2026-01-15T12:00:00.000Z',
  },
  {
    _id: 'a2',
    answerText: 'You can also try lifting state up.',
    author: { _id: 'user-3', name: 'Bob' },
    voteCount: -2,
    createdAt: '2026-01-15T13:00:00.000Z',
  },
];

const renderAnswerList = (answers = mockAnswers, userInfo = { userId: 'user-1' }) => {
  const store = createMockStore(userInfo);
  const utils = render(
    <Provider store={store}>
      <AnswerList answers={answers} />
    </Provider>
  );
  return { store, ...utils };
};

describe('AnswerList Component', () => {
  it('renders all answer texts', () => {
    renderAnswerList();
    expect(screen.getByText('Use the useState hook for local state.')).toBeInTheDocument();
    expect(screen.getByText('You can also try lifting state up.')).toBeInTheDocument();
  });

  it('renders answer authors', () => {
    renderAnswerList();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders answer vote counts', () => {
    renderAnswerList();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('renders the answers count heading', () => {
    renderAnswerList();
    expect(screen.getByText('2 Answers')).toBeInTheDocument();
  });

  it('shows singular "Answer" for one answer', () => {
    renderAnswerList([mockAnswers[0]]);
    expect(screen.getByText('1 Answer')).toBeInTheDocument();
  });

  it('renders upvote and downvote buttons for each answer', () => {
    renderAnswerList();
    const buttons = screen.getAllByRole('button');
    // At least 2 upvote + 2 downvote = 4 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders "Answered by" label for each answer', () => {
    renderAnswerList();
    const answeredByTexts = screen.getAllByText(/Answered by/i);
    expect(answeredByTexts).toHaveLength(2);
  });

  it('renders empty state when no answers provided', () => {
    renderAnswerList([]);
    expect(screen.getByText(/No answers yet/i)).toBeInTheDocument();
  });

  it('shows "0 Answers" heading when answers array is empty', () => {
    renderAnswerList([]);
    expect(screen.getByText('0 Answers')).toBeInTheDocument();
  });

  describe('edit controls', () => {
    it('shows an Edit button only on answers the current user authored', () => {
      // user-2 authored a1 only
      renderAnswerList(mockAnswers, { userId: 'user-2' });
      expect(
        screen.getAllByRole('button', { name: /^edit$/i })
      ).toHaveLength(1);
    });

    it('shows no Edit buttons for a non-author', () => {
      renderAnswerList(mockAnswers, { userId: 'user-99' });
      expect(
        screen.queryByRole('button', { name: /^edit$/i })
      ).not.toBeInTheDocument();
    });

    it('shows no Edit buttons for a logged-out visitor', () => {
      renderAnswerList(mockAnswers, null);
      expect(
        screen.queryByRole('button', { name: /^edit$/i })
      ).not.toBeInTheDocument();
    });

    it('pre-fills the textarea when editing an owned answer', async () => {
      const user = userEvent.setup();
      renderAnswerList(mockAnswers, { userId: 'user-2' });

      await user.click(screen.getByRole('button', { name: /^edit$/i }));

      expect(screen.getByLabelText('Edit answer')).toHaveValue(
        'Use the useState hook for local state.'
      );
    });

    it('disables Save when the answer text is blank', async () => {
      const user = userEvent.setup();
      renderAnswerList(mockAnswers, { userId: 'user-2' });

      await user.click(screen.getByRole('button', { name: /^edit$/i }));
      await user.clear(screen.getByLabelText('Edit answer'));

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('dispatches editAnswer on Save', async () => {
      const user = userEvent.setup();
      const { store } = renderAnswerList(mockAnswers, { userId: 'user-2' });
      // Seed currentQuestion so the editAnswer reducer has answers to update
      store.dispatch(
        fetchQuestionById.fulfilled(
          { _id: 'q1', answers: mockAnswers },
          '',
          'q1'
        )
      );

      await user.click(screen.getByRole('button', { name: /^edit$/i }));
      const textarea = screen.getByLabelText('Edit answer');
      await user.clear(textarea);
      await user.type(textarea, 'A clearer answer');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        const updated = store
          .getState()
          .question.currentQuestion.answers.find((a) => a._id === 'a1');
        expect(updated.isEdited).toBe(true);
        expect(updated.answerText).toBe('A clearer answer');
      });
    });

    it('renders an "edited" badge for an edited answer', () => {
      renderAnswerList([{ ...mockAnswers[0], isEdited: true }]);
      expect(screen.getByText(/edited/i)).toBeInTheDocument();
    });

    it('does not render an "edited" badge for an un-edited answer', () => {
      renderAnswerList([mockAnswers[0]]);
      expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
    });
  });
});

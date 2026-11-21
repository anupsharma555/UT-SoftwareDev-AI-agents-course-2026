import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import QuestionContent from '../../../src/components/Question/QuestionContent';
import questionReducer from '../../../src/reducers/questionSlice';

const createMockStore = (userInfo = { userId: 'user-1' }) => {
  return configureStore({
    reducer: {
      question: questionReducer,
      user: () => ({
        userInfo,
        loading: false,
        error: null,
      }),
      bookmark: () => ({
        savedIds: [],
        savedQuestions: [],
        loadingIds: false,
        loadingList: false,
        error: null,
      }),
    },
  });
};

const mockQuestion = {
  _id: 'q1',
  title: 'How do I use the useEffect hook?',
  description: 'I have trouble with the dependency array.',
  voteCount: 8,
  tags: [
    { _id: 't1', name: 'react' },
    { _id: 't2', name: 'hooks' },
  ],
  author: { _id: 'user-2', name: 'Alice' },
  createdAt: '2026-01-15T00:00:00.000Z',
};

const renderQuestionContent = (
  question = mockQuestion,
  userInfo = { userId: 'user-1' },
) => {
  const store = createMockStore(userInfo);
  const utils = render(
    <Provider store={store}>
      <QuestionContent question={question} />
    </Provider>
  );
  return { store, ...utils };
};

describe('QuestionContent Component', () => {
  it('renders the question title', () => {
    renderQuestionContent();
    expect(screen.getByText('How do I use the useEffect hook?')).toBeInTheDocument();
  });

  it('renders the question description', () => {
    renderQuestionContent();
    expect(screen.getByText('I have trouble with the dependency array.')).toBeInTheDocument();
  });

  it('renders the vote count', () => {
    renderQuestionContent();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders tags as badges', () => {
    renderQuestionContent();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('hooks')).toBeInTheDocument();
  });

  it('renders the author name', () => {
    renderQuestionContent();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders upvote and downvote buttons', () => {
    renderQuestionContent();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the "Asked" date text', () => {
    renderQuestionContent();
    expect(screen.getByText(/Asked/i)).toBeInTheDocument();
  });

  it('renders "Posted by" label for the author', () => {
    renderQuestionContent();
    expect(screen.getByText(/Posted by/i)).toBeInTheDocument();
  });

  describe('edit controls', () => {
    const ownerInfo = { userId: 'user-2' }; // matches mockQuestion.author._id

    it('shows an Edit button to the author', () => {
      renderQuestionContent(mockQuestion, ownerInfo);
      expect(
        screen.getByRole('button', { name: /^edit$/i })
      ).toBeInTheDocument();
    });

    it('does not show an Edit button to a non-author', () => {
      renderQuestionContent(mockQuestion, { userId: 'user-1' });
      expect(
        screen.queryByRole('button', { name: /^edit$/i })
      ).not.toBeInTheDocument();
    });

    it('does not show an Edit button to a logged-out visitor', () => {
      renderQuestionContent(mockQuestion, null);
      expect(
        screen.queryByRole('button', { name: /^edit$/i })
      ).not.toBeInTheDocument();
    });

    it('pre-fills the form with current title, description, and comma-joined tags', async () => {
      const user = userEvent.setup();
      renderQuestionContent(mockQuestion, ownerInfo);

      await user.click(screen.getByRole('button', { name: /^edit$/i }));

      expect(screen.getByLabelText('Edit title')).toHaveValue(
        'How do I use the useEffect hook?'
      );
      expect(screen.getByLabelText('Edit description')).toHaveValue(
        'I have trouble with the dependency array.'
      );
      expect(screen.getByLabelText('Edit tags')).toHaveValue('react, hooks');
    });

    it('disables Save when title or description is blank', async () => {
      const user = userEvent.setup();
      renderQuestionContent(mockQuestion, ownerInfo);

      await user.click(screen.getByRole('button', { name: /^edit$/i }));
      await user.clear(screen.getByLabelText('Edit description'));

      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('dispatches editQuestion on Save', async () => {
      const user = userEvent.setup();
      const { store } = renderQuestionContent(mockQuestion, ownerInfo);

      await user.click(screen.getByRole('button', { name: /^edit$/i }));
      const descInput = screen.getByLabelText('Edit description');
      await user.clear(descInput);
      await user.type(descInput, 'Updated description text');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        const cq = store.getState().question.currentQuestion;
        expect(cq?.isEdited).toBe(true);
        expect(cq?.description).toBe('Updated description text');
      });
    });

    it('restores original content and exits edit mode on Cancel', async () => {
      const user = userEvent.setup();
      renderQuestionContent(mockQuestion, ownerInfo);

      await user.click(screen.getByRole('button', { name: /^edit$/i }));
      await user.clear(screen.getByLabelText('Edit description'));
      await user.type(screen.getByLabelText('Edit description'), 'Throwaway');
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByLabelText('Edit description')).not.toBeInTheDocument();
      expect(
        screen.getByText('I have trouble with the dependency array.')
      ).toBeInTheDocument();
    });

    it('renders an "edited" badge when the question is edited', () => {
      renderQuestionContent({
        ...mockQuestion,
        isEdited: true,
        editedAt: '2026-01-16T00:00:00.000Z',
      });
      expect(screen.getByText(/edited/i)).toBeInTheDocument();
    });

    it('does not render an "edited" badge for an un-edited question', () => {
      renderQuestionContent(mockQuestion);
      expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
    });
  });
});

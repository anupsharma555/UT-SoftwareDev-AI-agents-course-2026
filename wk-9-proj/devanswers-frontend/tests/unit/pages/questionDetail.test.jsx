import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { summarizeAnswers } from '../../../src/services/questionService.js';
import QuestionDetail from '../../../src/pages/Question/QuestionDetail';

vi.mock('../../../src/services/questionService.js', () => ({
  summarizeAnswers: vi.fn(),
}));

const createMockStore = ({ currentQuestion = null, loading = false, error = null, token } = {}) => {
  return configureStore({
    reducer: {
      question: () => ({ questions: [], currentQuestion, loading, error }),
      user: () => ({
        userInfo: { userId: 'u1', token },
        loading: false,
        error: null,
      }),
    },
  });
};

const renderQuestionDetail = (storeOptions = {}, questionId = 'q1') => {
  const store = createMockStore(storeOptions);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/question/${questionId}`]}>
        <Routes>
          <Route path="/question/:id" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('QuestionDetail Page', () => {
  const mockQuestion = {
    _id: 'q1',
    title: 'How do I use the useEffect hook?',
    description: 'I have trouble with the dependency array.',
    voteCount: 8,
    tags: [{ _id: 't1', name: 'react' }, { _id: 't2', name: 'hooks' }],
    author: { _id: 'u2', name: 'Alice' },
    createdAt: '2026-01-15T00:00:00.000Z',
    answers: [],
  };

  it('shows question not found when no current question is loaded', () => {
    renderQuestionDetail();
    expect(screen.getByText(/question not found/i)).toBeInTheDocument();
  });

  it('shows an error message when there is an error', () => {
    renderQuestionDetail({ error: 'Not Found' });
    expect(screen.getByText(/error loading question/i)).toBeInTheDocument();
  });

  it('renders the question title when a question is loaded', () => {
    renderQuestionDetail({ currentQuestion: mockQuestion });
    expect(screen.getByText('How do I use the useEffect hook?')).toBeInTheDocument();
  });

  it('renders the question description when a question is loaded', () => {
    renderQuestionDetail({ currentQuestion: mockQuestion });
    expect(screen.getByText('I have trouble with the dependency array.')).toBeInTheDocument();
  });

  it('renders the answer form when a question is loaded', () => {
    renderQuestionDetail({ currentQuestion: mockQuestion });
    expect(screen.getByPlaceholderText(/write your answer here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post answer/i })).toBeInTheDocument();
  });

  it('renders the answers section heading when a question is loaded', () => {
    renderQuestionDetail({ currentQuestion: mockQuestion });
    expect(screen.getByText('0 Answers')).toBeInTheDocument();
  });

  it('renders question tags when a question is loaded', () => {
    renderQuestionDetail({ currentQuestion: mockQuestion });
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('hooks')).toBeInTheDocument();
  });

  describe('Answer summarizer', () => {
    const answers = [1, 2, 3].map((n) => ({
      _id: `a${n}`,
      answerText: `Answer ${n}`,
      author: { _id: 'u3', name: 'Bob' },
      voteCount: 0,
      createdAt: '2026-01-16T00:00:00.000Z',
    }));

    beforeEach(() => vi.clearAllMocks());

    it('is hidden when logged out or with fewer than 3 answers', () => {
      renderQuestionDetail({ currentQuestion: { ...mockQuestion, answers } });
      expect(screen.queryByRole('button', { name: /summarize answers/i })).not.toBeInTheDocument();
    });

    it('is hidden with fewer than 3 answers even when logged in', () => {
      renderQuestionDetail({
        currentQuestion: { ...mockQuestion, answers: answers.slice(0, 2) },
        token: 'jwt',
      });
      expect(screen.queryByRole('button', { name: /summarize answers/i })).not.toBeInTheDocument();
    });

    it('shows a dismissible summary and lets the user regenerate it', async () => {
      summarizeAnswers.mockResolvedValue('This is the summary.');
      const user = userEvent.setup();
      renderQuestionDetail({ currentQuestion: { ...mockQuestion, answers }, token: 'jwt' });

      await user.click(screen.getByRole('button', { name: /summarize answers/i }));
      expect(await screen.findByText('This is the summary.')).toBeInTheDocument();
      expect(summarizeAnswers).toHaveBeenCalledWith('q1', 'jwt');
      expect(screen.queryByRole('button', { name: /summarize answers/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /close/i }));
      await waitFor(() => expect(screen.queryByText('This is the summary.')).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: /summarize answers/i })).toBeInTheDocument();
    });
  });
});

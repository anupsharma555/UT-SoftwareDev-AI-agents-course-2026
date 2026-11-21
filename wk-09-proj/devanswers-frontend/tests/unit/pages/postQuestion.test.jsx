import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { improveQuestion } from '../../../src/services/questionService.js';
import PostQuestion from '../../../src/pages/Question/PostQuestion';

vi.mock('../../../src/services/questionService.js', async (importOriginal) => ({
  ...(await importOriginal()),
  improveQuestion: vi.fn(),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      question: () => ({ questions: [], currentQuestion: null, loading: false, error: null }),
      user: () => ({
        userInfo: { userId: 'u1', token: 'tok' },
        loading: false,
        error: null,
      }),
    },
  });
};

const renderPostQuestion = () => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <PostQuestion />
      </BrowserRouter>
    </Provider>
  );
};

describe('PostQuestion Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    renderPostQuestion();
    expect(screen.getByText('Ask a Question')).toBeInTheDocument();
  });

  it('renders the title input', () => {
    renderPostQuestion();
    expect(screen.getByPlaceholderText(/what's your programming question/i)).toBeInTheDocument();
  });

  it('renders the description textarea', () => {
    renderPostQuestion();
    expect(screen.getByPlaceholderText(/provide more details about your question/i)).toBeInTheDocument();
  });

  it('renders the tags input and submit button', () => {
    renderPostQuestion();
    expect(screen.getByPlaceholderText(/e.g., javascript, react, css/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post question/i })).toBeInTheDocument();
  });

  it('allows typing in the title field', async () => {
    renderPostQuestion();
    const titleInput = screen.getByPlaceholderText(/what's your programming question/i);

    await userEvent.type(titleInput, 'How do I use Redux Toolkit?');
    expect(titleInput).toHaveValue('How do I use Redux Toolkit?');
  });

  it('allows typing in the description field', async () => {
    renderPostQuestion();
    const descriptionInput = screen.getByPlaceholderText(/provide more details about your question/i);

    await userEvent.type(descriptionInput, 'I want to manage state effectively.');
    expect(descriptionInput).toHaveValue('I want to manage state effectively.');
  });

  it('allows typing in the tags field', async () => {
    renderPostQuestion();
    const tagsInput = screen.getByPlaceholderText(/e.g., javascript, react, css/i);

    await userEvent.type(tagsInput, 'javascript, react');
    expect(tagsInput).toHaveValue('javascript, react');
  });

  it('requests suggestions once and lets each suggestion be accepted or rejected independently', async () => {
    improveQuestion.mockResolvedValue({
      title: 'Improved question title',
      description: 'Improved question description',
      tags: 'javascript, react',
    });
    renderPostQuestion();

    const titleInput = screen.getByPlaceholderText(/what's your programming question/i);
    const descriptionInput = screen.getByPlaceholderText(/provide more details about your question/i);
    const tagsInput = screen.getByPlaceholderText(/e.g., javascript, react, css/i);
    await userEvent.type(titleInput, 'My question');
    await userEvent.type(descriptionInput, 'My details');
    await userEvent.type(tagsInput, 'js');
    await userEvent.click(screen.getByRole('button', { name: /optimize question with ai/i }));

    expect(await screen.findByText('Suggested title')).toBeInTheDocument();
    expect(improveQuestion).toHaveBeenCalledTimes(1);
    expect(improveQuestion).toHaveBeenCalledWith(
      { title: 'My question', description: 'My details', tags: 'js' },
      'tok',
    );
    expect(screen.getByRole('button', { name: /post question/i })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Accept suggested title' }));
    expect(titleInput).toHaveValue('Improved question title');
    expect(screen.queryByText('Suggested title')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reject suggested description' }));
    expect(descriptionInput).toHaveValue('My details');
    expect(screen.queryByText('Suggested description')).not.toBeInTheDocument();
    expect(screen.getByText('Suggested tags')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Accept suggested tags' }));
    expect(tagsInput).toHaveValue('javascript, react');
    expect(screen.queryByText('Suggested tags')).not.toBeInTheDocument();
  });
});

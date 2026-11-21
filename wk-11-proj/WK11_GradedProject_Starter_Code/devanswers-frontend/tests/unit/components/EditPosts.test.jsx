import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Provider, useSelector } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import QuestionContent from '../../../src/components/Question/QuestionContent';
import QuestionCard from '../../../src/components/Question/QuestionCard';
import AnswerList from '../../../src/components/Answer/AnswerList';
import EditedBadge from '../../../src/components/Shared/EditedBadge';
import questionReducer from '../../../src/reducers/questionSlice';
import { mockQuestions } from '../../mocks/mockData';

const BASE_URL = 'http://localhost:3001/api';
const ALICE = { userId: 'user-1', name: 'Alice Johnson', token: 'tok' };
const BOB = { userId: 'user-2', name: 'Bob Smith', token: 'tok-bob' };

// question-1 is authored by Alice (user-1); answer-1 by Bob, answer-2 by Alice.
const question = mockQuestions[0];

// Renders from the store, like QuestionDetail does, so saved edits show up.
const ConnectedQuestion = () => {
  const current = useSelector((state) => state.question.currentQuestion);
  return (
    <>
      <QuestionContent question={current} />
      <AnswerList answers={current.answers} question={current} />
    </>
  );
};

const renderPage = (userInfo = ALICE, currentQuestion = question) => {
  const store = configureStore({
    reducer: { question: questionReducer, user: () => ({ userInfo }) },
    preloadedState: {
      question: { questions: [], currentQuestion, loading: false, error: null },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ConnectedQuestion />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

const trackRequests = (method, path) => {
  const calls = [];
  server.use(
    http[method](`${BASE_URL}${path}`, async ({ request }) => {
      calls.push(await request.json());
      return HttpResponse.json({ success: true, data: {} });
    }),
  );
  return calls;
};

describe('Edit question', () => {
  it('shows the edit control to the author', () => {
    renderPage(ALICE);
    expect(screen.getByRole('button', { name: 'Edit question' })).toBeInTheDocument();
  });

  it('hides the edit control from other users and anonymous visitors', () => {
    renderPage(BOB);
    expect(screen.queryByRole('button', { name: 'Edit question' })).not.toBeInTheDocument();
  });

  it('hides the edit control when logged out', () => {
    renderPage(null);
    expect(screen.queryByRole('button', { name: 'Edit question' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit answer' })).not.toBeInTheDocument();
  });

  it('opens a form pre-filled with the current content', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));

    expect(screen.getByLabelText('Title')).toHaveValue(question.title);
    expect(screen.getByLabelText('Description')).toHaveValue(question.description);
    expect(screen.getByLabelText('Tags')).toHaveValue('javascript, react');
  });

  it('discards changes on cancel', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Something else');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText(question.title)).toBeInTheDocument();
    expect(screen.queryByText('Something else')).not.toBeInTheDocument();
  });

  it.each([
    ['Title', 'Title is required'],
    ['Description', 'Description is required'],
    ['Tags', 'At least one tag is required'],
  ])('blocks saving a blank %s and sends no request', async (field, message) => {
    const user = userEvent.setup();
    const calls = trackRequests('put', '/questions/:id');
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));
    await user.clear(screen.getByLabelText(field));
    await user.type(screen.getByLabelText(field), '   ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('saves and shows the updated content and the edited label without a reload', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'A clearer title');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('A clearer title')).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(screen.getAllByText('(edited)').length).toBeGreaterThan(0);
    // Answers are still on the page after the edit.
    expect(screen.getByText(question.answers[0].answerText)).toBeInTheDocument();
  });

  it('keeps the form open with the server message when the save fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.put(`${BASE_URL}/questions/:id`, () =>
        HttpResponse.json(
          { success: false, message: 'Not authorized to update this question' },
          { status: 403 },
        ),
      ),
    );
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));
    await user.type(screen.getByLabelText('Title'), ' more');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Not authorized to update this question')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue(`${question.title} more`);
  });
});

describe('Edit answer', () => {
  it('shows the edit control only on answers the user wrote', () => {
    renderPage(ALICE);

    const editButtons = screen.getAllByRole('button', { name: 'Edit answer' });
    expect(editButtons).toHaveLength(1);
    const aliceAnswer = screen.getByText(question.answers[1].answerText).closest('.alist-answer-card');
    expect(within(aliceAnswer).getByRole('button', { name: 'Edit answer' })).toBeInTheDocument();
  });

  it('pre-fills, cancels, and leaves other answers alone', async () => {
    const user = userEvent.setup();
    renderPage(ALICE);

    await user.click(screen.getByRole('button', { name: 'Edit answer' }));
    expect(screen.getByLabelText('Answer text')).toHaveValue(question.answers[1].answerText);
    expect(screen.getByText(question.answers[0].answerText)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Answer text')).not.toBeInTheDocument();
    expect(screen.getByText(question.answers[1].answerText)).toBeInTheDocument();
  });

  it('blocks a blank answer and sends no request', async () => {
    const user = userEvent.setup();
    const calls = trackRequests('put', '/answers/:answerId');
    renderPage(ALICE);

    await user.click(screen.getByRole('button', { name: 'Edit answer' }));
    await user.clear(screen.getByLabelText('Answer text'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Answer text is required')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('saves and updates the answer in place with the edited label', async () => {
    const user = userEvent.setup();
    renderPage(ALICE);

    await user.click(screen.getByRole('button', { name: 'Edit answer' }));
    await user.clear(screen.getByLabelText('Answer text'));
    await user.type(screen.getByLabelText('Answer text'), 'A better answer');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const updated = await screen.findByText('A better answer');
    const card = updated.closest('.alist-answer-card');
    expect(within(card).getByText('(edited)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Answer text')).not.toBeInTheDocument();
  });
});

describe('Edited indicator', () => {
  it('renders nothing for a post that was never edited', () => {
    const { container } = render(<EditedBadge editedAt={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "(edited)" with the edit date in a tooltip', () => {
    render(<EditedBadge editedAt="2026-01-17T09:30:00.000Z" />);

    const badge = screen.getByText('(edited)');
    expect(badge.getAttribute('title')).toMatch(/^Edited Jan 17, 2026 at /);
  });

  it('is not shown on a never-edited question page', () => {
    renderPage(ALICE, { ...question, answers: [] });
    expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
  });

  it('is shown on an edited question page', () => {
    renderPage(ALICE, { ...mockQuestions[2] });
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });
});

describe('List views', () => {
  it('never show the edit control or the edited label on question cards', () => {
    const store = configureStore({
      reducer: { question: questionReducer, user: () => ({ userInfo: ALICE }) },
    });
    // question-3 is Alice's and has been edited.
    render(
      <Provider store={store}>
        <MemoryRouter>
          <QuestionCard question={mockQuestions[2]} />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
  });
});

describe('Saving state', () => {
  it('does not swap the page for the full-page spinner while saving', async () => {
    const user = userEvent.setup();
    const store = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit question' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(store.getState().question.loading).toBe(false);
    await waitFor(() => expect(screen.queryByLabelText('Title')).not.toBeInTheDocument());
  });
});

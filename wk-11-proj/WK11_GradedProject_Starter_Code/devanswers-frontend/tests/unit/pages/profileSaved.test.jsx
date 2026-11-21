import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import Profile from '../../../src/pages/Profile/Profile';
import bookmarkReducer from '../../../src/reducers/bookmarkSlice';
import questionReducer from '../../../src/reducers/questionSlice';
import { mockQuestions } from '../../mocks/mockData';

const BASE_URL = 'http://localhost:3001/api';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const renderProfile = () => {
  const store = configureStore({
    reducer: {
      user: () => ({ userInfo: { userId: 'user-1', name: 'Alice', token: 'tok' } }),
      bookmark: bookmarkReducer,
      question: questionReducer,
    },
  });
  render(
    <Provider store={store}>
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    </Provider>,
  );
  return store;
};

describe('Profile: Saved Questions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the saved questions', async () => {
    renderProfile();

    expect(screen.getByText('Saved Questions')).toBeInTheDocument();
    const saved = mockQuestions.find((q) => q._id === 'question-2');
    expect(await screen.findByText(saved.title)).toBeInTheDocument();
  });

  it('only shows questions that are saved, not the whole feed', async () => {
    renderProfile();

    const saved = mockQuestions.find((q) => q._id === 'question-2');
    await screen.findByText(saved.title);
    const notSaved = mockQuestions.find((q) => q._id === 'question-1');
    expect(screen.queryByText(notSaved.title)).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing is saved', async () => {
    server.use(
      http.get(`${BASE_URL}/bookmarks`, () => HttpResponse.json({ success: true, data: [] })),
    );
    renderProfile();

    expect(await screen.findByText('No saved questions yet')).toBeInTheDocument();
  });

  it('lists saved questions newest-saved first, not by when they were posted', async () => {
    // Saved order from the server: question-1 (posted Jan 14) saved after question-3 (posted Jan 16).
    server.use(
      http.get(`${BASE_URL}/bookmarks`, () =>
        HttpResponse.json({
          success: true,
          data: [mockQuestions[0], mockQuestions[2]],
        }),
      ),
    );
    renderProfile();

    await screen.findByText(mockQuestions[0].title);
    const titles = screen
      .getAllByRole('link')
      .map((link) => link.textContent)
      .filter((text) => [mockQuestions[0].title, mockQuestions[2].title].includes(text));
    expect(titles).toEqual([mockQuestions[0].title, mockQuestions[2].title]);
  });

  it('shows an error instead of the empty state when loading fails', async () => {
    server.use(
      http.get(`${BASE_URL}/bookmarks`, () =>
        HttpResponse.json({ success: false, message: 'Token is not valid.' }, { status: 401 }),
      ),
    );
    renderProfile();

    expect(await screen.findByText(/Could not load saved questions: Token is not valid\./)).toBeInTheDocument();
    expect(screen.queryByText('No saved questions yet')).not.toBeInTheDocument();
  });

  it('removes a question from the list immediately when it is unsaved', async () => {
    const user = userEvent.setup();
    renderProfile();
    const saved = mockQuestions.find((q) => q._id === 'question-2');
    await screen.findByText(saved.title);

    await user.click(screen.getByRole('button', { name: 'Remove bookmark' }));

    await waitFor(() => expect(screen.queryByText(saved.title)).not.toBeInTheDocument());
    expect(screen.getByText('No saved questions yet')).toBeInTheDocument();
  });
});

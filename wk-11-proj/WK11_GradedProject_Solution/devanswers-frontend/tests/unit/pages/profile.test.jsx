import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Profile from '../../../src/pages/Profile/Profile';
import bookmarkReducer from '../../../src/reducers/bookmarkSlice';
import { server } from '../../mocks/server';
import { mockQuestions } from '../../mocks/mockData';

const BASE_URL = 'http://localhost:3000/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = ({
  userInfo = { userId: 'u1', name: 'TestUser', token: 'tok' },
} = {}) => {
  return configureStore({
    reducer: {
      user: () => ({ userInfo, loading: false, error: null }),
      bookmark: bookmarkReducer,
    },
  });
};

const renderProfile = (storeOptions = {}) => {
  const store = createMockStore(storeOptions);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    </Provider>
  );
};

describe('Profile Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the profile heading when authenticated', () => {
    renderProfile();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('shows Edit Profile button when not in edit mode', () => {
    renderProfile();
    expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderProfile({ userInfo: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows activity stats section when authenticated', () => {
    renderProfile();
    expect(screen.getByText('Activity Stats')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Answers')).toBeInTheDocument();
  });

  it('enters edit mode when Edit Profile button is clicked', async () => {
    renderProfile();
    await userEvent.click(screen.getByText(/edit profile/i));

    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('exits edit mode when Cancel button is clicked', async () => {
    renderProfile();
    await userEvent.click(screen.getByText(/edit profile/i));
    await userEvent.click(screen.getByText(/cancel/i));

    expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
  });

  it('shows form inputs in edit mode', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByText(/edit profile/i));

    // Full Name and Email inputs should now be enabled
    expect(screen.getByPlaceholderText(/enter your name/i)).not.toBeDisabled();
    expect(screen.getByPlaceholderText(/enter your email/i)).not.toBeDisabled();
  });

  it('renders a card for each saved question', async () => {
    server.use(
      http.get(`${BASE_URL}/bookmarks`, () =>
        HttpResponse.json({ data: mockQuestions.slice(0, 2) }),
      ),
    );

    renderProfile();

    expect(await screen.findByText(mockQuestions[0].title)).toBeInTheDocument();
    expect(await screen.findByText(mockQuestions[1].title)).toBeInTheDocument();
    expect(screen.getByText('Saved Questions')).toBeInTheDocument();
  });

  it('shows the empty state when no questions are saved', async () => {
    server.use(
      http.get(`${BASE_URL}/bookmarks`, () => HttpResponse.json({ data: [] })),
    );

    renderProfile();

    expect(
      await screen.findByText(/haven't saved any questions yet/i),
    ).toBeInTheDocument();
  });
});

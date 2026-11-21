import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import Home from '../../src/pages/User/Home';
import ThreadPage from '../../src/pages/User/ThreadPage';
import { server } from '../mocks/server';
import { renderWithProviders } from '../utils/renderWithProviders';

const BASE_URL = 'http://localhost:5000/api';
const pageRoutes = (
  <Routes>
    <Route path="/home" element={<Home />} />
    <Route path="/thread/:threadId" element={<ThreadPage />} />
  </Routes>
);

describe('Thread UI workflow', () => {
  it('loads threads and displays their content', async () => {
    renderWithProviders(<Home />);

    expect(await screen.findByText('Getting Started with React')).toBeInTheDocument();
    expect(screen.getByText('How do I start learning React?')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Tips and Tricks')).toBeInTheDocument();
  });

  it('creates a thread in the selected community and places it at the top', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Home />);

    await screen.findByText('Getting Started with React');
    await user.click(screen.getByRole('button', { name: /create/i }));
    await user.type(screen.getByPlaceholderText("What's on your mind?"), 'A new integration thread');
    await user.type(screen.getByPlaceholderText('Share your thoughts...'), 'Created from the UI test');
    await user.selectOptions(screen.getByRole('combobox'), 'sub-1');
    await user.click(screen.getByRole('button', { name: /post thread/i }));

    const createdThread = await screen.findByText('A new integration thread');
    expect(createdThread).toBeInTheDocument();
    expect(screen.getByText('Created from the UI test')).toBeInTheDocument();
    const createdThreadCard = createdThread.closest('.thread-card');
    expect(createdThreadCard).toBe(createdThreadCard.parentElement.firstElementChild);
  });

  it('applies server-returned upvotes and downvotes to a visible thread', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Home />);

    const title = await screen.findByText('Getting Started with React');
    const card = title.closest('.thread-card');
    const voteCount = card.querySelector('.vote-count');
    expect(voteCount).toHaveTextContent('15');

    await user.click(within(card).getByRole('button', { name: 'Upvote item' }));
    await waitFor(() => expect(voteCount).toHaveTextContent('16'));

    await user.click(within(card).getByRole('button', { name: 'Downvote item' }));
    await waitFor(() => expect(voteCount).toHaveTextContent('15'));
  });

  it('opens the thread detail view and fetches the selected thread', async () => {
    const user = userEvent.setup();
    renderWithProviders(pageRoutes);

    await screen.findByText('Getting Started with React');
    const threadLink = screen
      .getAllByRole('link', { name: /view comments/i })
      .find((link) => link.getAttribute('href') === '/thread/thread-1');
    await user.click(threadLink);

    expect(await screen.findByText('How do I start learning React?')).toBeInTheDocument();
    expect(screen.getByText('💬 Comments')).toBeInTheDocument();
  });

  it('shows the API error and a Go Back control for an unknown thread', async () => {
    renderWithProviders(pageRoutes, { initialRoute: '/thread/thread-404' });

    expect(await screen.findByText('Thread not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
  });

  it('shows a visible error when the thread list request fails', async () => {
    server.use(
      http.get(`${BASE_URL}/threads`, () =>
        HttpResponse.json(
          { success: false, message: 'Feed unavailable' },
          { status: 500 },
        ),
      ),
    );
    renderWithProviders(<Home />);

    expect(await screen.findByText('Error: Feed unavailable')).toBeInTheDocument();
  });
});

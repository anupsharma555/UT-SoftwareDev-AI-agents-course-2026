import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import ThreadPage from '../../src/pages/User/ThreadPage';
import { server } from '../mocks/server';
import { renderWithProviders } from '../utils/renderWithProviders';

const BASE_URL = 'http://localhost:5000/api';
const threadRoute = (
  <Routes>
    <Route path="/thread/:threadId" element={<ThreadPage />} />
  </Routes>
);

describe('Comment UI workflow', () => {
  it('loads only comments for the selected thread', async () => {
    renderWithProviders(threadRoute, { initialRoute: '/thread/thread-1' });

    expect(await screen.findByText('Great question! Start with the official docs.')).toBeInTheDocument();
    expect(screen.getByText('I recommend watching tutorials on YouTube.')).toBeInTheDocument();
    expect(screen.queryByText('Use arrow functions for cleaner code.')).not.toBeInTheDocument();
  });

  it('posts a comment with the populated author and updates the comment count', async () => {
    const user = userEvent.setup();
    renderWithProviders(threadRoute, { initialRoute: '/thread/thread-1' });

    await screen.findByText('Great question! Start with the official docs.');
    await user.type(screen.getByPlaceholderText('Write a comment...'), 'A UI-created comment');
    await user.click(screen.getByRole('button', { name: /post comment/i }));

    const createdComment = await screen.findByText('A UI-created comment');
    expect(within(createdComment.closest('.comment-card')).getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('3 total')).toBeInTheDocument();
  });

  it('upvotes and downvotes the selected comment using server-returned counts', async () => {
    const user = userEvent.setup();
    renderWithProviders(threadRoute, { initialRoute: '/thread/thread-1' });

    const comment = await screen.findByText('Great question! Start with the official docs.');
    const card = comment.closest('.comment-card');
    const voteCount = card.querySelector('.comment-vote-count');
    expect(voteCount).toHaveTextContent('5');

    await user.click(within(card).getByRole('button', { name: 'Upvote' }));
    await waitFor(() => expect(voteCount).toHaveTextContent('6'));

    await user.click(within(card).getByRole('button', { name: 'Downvote' }));
    await waitFor(() => expect(voteCount).toHaveTextContent('5'));
  });

  it('shows the empty-comments state when the API returns no comments', async () => {
    server.use(
      http.get(`${BASE_URL}/comments/thread/thread-1`, () =>
        HttpResponse.json({ success: true, message: 'OK', data: [] }),
      ),
    );
    renderWithProviders(threadRoute, { initialRoute: '/thread/thread-1' });

    expect(await screen.findByText('No comments yet. Be the first!')).toBeInTheDocument();
  });

  it('displays a comments API error without hiding the thread content', async () => {
    server.use(
      http.get(`${BASE_URL}/comments/thread/:threadId`, () =>
        HttpResponse.json(
          { success: false, message: 'Comments unavailable' },
          { status: 500 },
        ),
      ),
    );
    renderWithProviders(threadRoute, { initialRoute: '/thread/thread-1' });

    expect(await screen.findByText('How do I start learning React?')).toBeInTheDocument();
    expect(await screen.findByText('Error loading comments: Comments unavailable')).toBeInTheDocument();
  });
});

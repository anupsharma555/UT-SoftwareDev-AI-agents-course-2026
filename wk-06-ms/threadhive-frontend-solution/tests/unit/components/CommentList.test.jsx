import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CommentList from '../../../src/components/Comment/CommentList';

// Mock the userService
vi.mock('../../../src/services/userService', () => ({
  getUserName: vi.fn((userId) => {
    const users = {
      'u1': 'Alice',
      'u2': 'Bob',
      'u3': 'Charlie'
    };
    return users[userId] || 'Unknown';
  })
}));

describe('CommentList Component', () => {
  const mockComments = [
    {
      _id: 'c1',
      user: 'u1',
      content: 'This is the first comment',
      voteCount: 5
    },
    {
      _id: 'c2',
      user: 'u2',
      content: 'This is the second comment',
      voteCount: -2
    }
  ];

  it('renders all comments', () => {
    render(<CommentList comments={mockComments} />);
    expect(screen.getByText('This is the first comment')).toBeInTheDocument();
    expect(screen.getByText('This is the second comment')).toBeInTheDocument();
  });

  it('renders comment authors', () => {
    render(<CommentList comments={mockComments} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders comment vote counts', () => {
    render(<CommentList comments={mockComments} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('renders comment badge for each comment', () => {
    render(<CommentList comments={mockComments} />);
    const badges = screen.getAllByText(/comment/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders user avatar with first letter of username', () => {
    const { container } = render(<CommentList comments={mockComments} />);
    const avatars = container.querySelectorAll('.comment-avatar');
    expect(avatars[0]).toHaveTextContent('A');
    expect(avatars[1]).toHaveTextContent('B');
  });

  it('renders upvote and downvote buttons for each comment', () => {
    render(<CommentList comments={mockComments} />);
    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    const downvoteButtons = screen.getAllByLabelText(/downvote/i);

    expect(upvoteButtons).toHaveLength(2);
    expect(downvoteButtons).toHaveLength(2);
  });

  it('shows alert when upvote button is clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CommentList comments={mockComments} />);

    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    await userEvent.click(upvoteButtons[0]);

    expect(alertSpy).toHaveBeenCalledWith('Upvote clicked!');
    alertSpy.mockRestore();
  });

  it('shows alert when downvote button is clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CommentList comments={mockComments} />);

    const downvoteButtons = screen.getAllByLabelText(/downvote/i);
    await userEvent.click(downvoteButtons[0]);

    expect(alertSpy).toHaveBeenCalledWith('Downvote clicked!');
    alertSpy.mockRestore();
  });

  it('renders empty list when no comments provided', () => {
    const { container } = render(<CommentList comments={[]} />);
    const commentCards = container.querySelectorAll('.comment-card');
    expect(commentCards).toHaveLength(0);
  });

  it('handles unknown user gracefully', () => {
    const commentWithUnknownUser = [{
      _id: 'c3',
      user: 'u999',
      content: 'Comment from unknown user',
      voteCount: 0
    }];

    render(<CommentList comments={commentWithUnknownUser} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

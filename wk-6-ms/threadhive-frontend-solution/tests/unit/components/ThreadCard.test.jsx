import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThreadCard from '../../../src/components/ThreadList/ThreadCard';

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

describe('ThreadCard Component', () => {
  const mockThread = {
    _id: 't1',
    title: 'Test Thread Title',
    content: 'This is test thread content',
    author: 'u1',
    subreddit: 'javascript',
    subredditName: 'javascript',
    upvotedBy: ['u2', 'u3'],
    downvotedBy: [],
    voteCount: 2
  };

  const mockGoBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders thread title', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByText('Test Thread Title')).toBeInTheDocument();
  });

  it('renders thread content', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByText('This is test thread content')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders subreddit name', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByText('r/javascript')).toBeInTheDocument();
  });

  it('renders back to home button', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
  });

  it('calls goBack when back button is clicked', async () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);

    await userEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('calculates and displays correct vote count', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays upvote and downvote buttons', () => {
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);
    expect(screen.getByLabelText(/upvote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/downvote/i)).toBeInTheDocument();
  });

  it('shows alert when upvote button is clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);

    await userEvent.click(screen.getByLabelText(/upvote/i));
    expect(alertSpy).toHaveBeenCalledWith('Upvote clicked!');

    alertSpy.mockRestore();
  });

  it('shows alert when downvote button is clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ThreadCard thread={mockThread} goBack={mockGoBack} />);

    await userEvent.click(screen.getByLabelText(/downvote/i));
    expect(alertSpy).toHaveBeenCalledWith('Downvote clicked!');

    alertSpy.mockRestore();
  });
});

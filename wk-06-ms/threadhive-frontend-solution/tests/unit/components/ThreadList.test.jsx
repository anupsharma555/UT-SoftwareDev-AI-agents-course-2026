import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ThreadList from '../../../src/components/ThreadList/ThreadList';

describe('ThreadList Component', () => {
  const mockThreads = [
    {
      _id: 't1',
      title: 'First Thread',
      content: 'Content of first thread',
      subreddit: 'javascript',
      voteCount: 5
    },
    {
      _id: 't2',
      title: 'Second Thread',
      content: 'Content of second thread',
      subreddit: 'react',
      voteCount: 3
    }
  ];

  const mockOnSelect = vi.fn();

  it('renders all threads', () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);
    expect(screen.getByText('First Thread')).toBeInTheDocument();
    expect(screen.getByText('Second Thread')).toBeInTheDocument();
  });

  it('renders thread content', () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);
    expect(screen.getByText('Content of first thread')).toBeInTheDocument();
    expect(screen.getByText('Content of second thread')).toBeInTheDocument();
  });

  it('renders subreddit badges', () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);
    expect(screen.getByText('r/javascript')).toBeInTheDocument();
    expect(screen.getByText('r/react')).toBeInTheDocument();
  });

  it('renders vote counts for all threads', () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders view comments buttons for each thread', () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);
    const viewButtons = screen.getAllByRole('button', { name: /view comments/i });
    expect(viewButtons).toHaveLength(2);
  });

  it('calls onSelect with correct thread when view comments is clicked', async () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);

    const viewButtons = screen.getAllByRole('button', { name: /view comments/i });
    await userEvent.click(viewButtons[0]);

    expect(mockOnSelect).toHaveBeenCalledWith(mockThreads[0]);
  });

  it('renders upvote and downvote buttons for each thread', () => {
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);
    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    const downvoteButtons = screen.getAllByLabelText(/downvote/i);

    expect(upvoteButtons).toHaveLength(2);
    expect(downvoteButtons).toHaveLength(2);
  });

  it('shows alert when upvote button is clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);

    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    await userEvent.click(upvoteButtons[0]);

    expect(alertSpy).toHaveBeenCalledWith('Upvote clicked!');
    alertSpy.mockRestore();
  });

  it('shows alert when downvote button is clicked', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ThreadList threads={mockThreads} onSelect={mockOnSelect} />);

    const downvoteButtons = screen.getAllByLabelText(/downvote/i);
    await userEvent.click(downvoteButtons[0]);

    expect(alertSpy).toHaveBeenCalledWith('Downvote clicked!');
    alertSpy.mockRestore();
  });

  it('renders empty list when no threads provided', () => {
    const { container } = render(<ThreadList threads={[]} onSelect={mockOnSelect} />);
    const threadCards = container.querySelectorAll('.thread-card');
    expect(threadCards).toHaveLength(0);
  });
});

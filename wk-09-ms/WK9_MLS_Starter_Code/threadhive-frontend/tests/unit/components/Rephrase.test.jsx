import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../mocks/server';
import CommentForm from '../../../src/components/Comment/CommentForm';

const URL = 'http://localhost:5001/api/threads/rephrase';

function Harness() {
  const [text, setText] = useState('');
  return (
    <CommentForm
      commentText={text}
      onCommentChange={(e) => setText(e.target.value)}
      onReplaceText={setText}
    />
  );
}

const typeAndRephrase = async (value) => {
  await userEvent.type(screen.getByPlaceholderText(/write a comment/i), value);
  await userEvent.click(screen.getByRole('button', { name: /rephrase comment with ai/i }));
};

describe('Rephrase with AI (comment form)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'test-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('disables the button when the field is empty', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: /rephrase comment with ai/i })).toBeDisabled();
  });

  it('shows the suggestion without replacing the text, then replaces on accept', async () => {
    render(<Harness />);
    const textarea = screen.getByPlaceholderText(/write a comment/i);
    await typeAndRephrase('hello');

    expect(await screen.findByTestId('rephrase-suggestion-comment')).toHaveTextContent('Rephrased: hello');
    expect(textarea).toHaveValue('hello');

    await userEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(textarea).toHaveValue('Rephrased: hello');
    expect(screen.queryByTestId('rephrase-suggestion-comment')).not.toBeInTheDocument();
  });

  it('keeps the original text on reject', async () => {
    render(<Harness />);
    await typeAndRephrase('hello');
    await userEvent.click(await screen.findByRole('button', { name: /reject/i }));

    expect(screen.getByPlaceholderText(/write a comment/i)).toHaveValue('hello');
    expect(screen.queryByTestId('rephrase-suggestion-comment')).not.toBeInTheDocument();
  });

  it('shows a loading state while rephrasing', async () => {
    server.use(
      http.post(URL, async () => {
        await delay(100);
        return HttpResponse.json({ data: { rephrased: 'done' } });
      }),
    );
    render(<Harness />);
    await typeAndRephrase('hello');
    expect(screen.getByText(/rephrasing/i)).toBeInTheDocument();
    await screen.findByTestId('rephrase-suggestion-comment');
  });

  it('keeps the original text and shows an error when the AI call fails', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({ success: false, message: 'Failed to generate response.' }, { status: 502 }),
      ),
    );
    render(<Harness />);
    await typeAndRephrase('hello');

    expect(await screen.findByText(/failed to generate response/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write a comment/i)).toHaveValue('hello');
    await waitFor(() => expect(screen.getByRole('button', { name: /rephrase comment with ai/i })).toBeEnabled());
  });
});

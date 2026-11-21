import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../mocks/server';
import CreateThreadForm from '../../../src/components/Forms/CreateThreadForm';
import threadsReducer from '../../../src/reducers/threadListSlice';
import subredditsReducer from '../../../src/reducers/subredditSlice';

vi.mock('../../../src/services/subredditService', () => ({
  fetchSubreddits: vi.fn().mockResolvedValue([]),
  createSubreddit: vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'test-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

const setup = () => {
  const store = configureStore({ reducer: { threads: threadsReducer, subreddits: subredditsReducer } });
  render(
    <Provider store={store}>
      <CreateThreadForm onClose={() => {}} />
    </Provider>,
  );
};

describe('CreateThreadForm rephrase', () => {
  it('rephrases title and body independently with accept/reject', async () => {
    setup();
    const title = screen.getByPlaceholderText(/what's on your mind/i);
    const body = screen.getByPlaceholderText(/share your thoughts/i);
    await userEvent.type(title, 'my title');
    await userEvent.type(body, 'my body');

    await userEvent.click(screen.getByRole('button', { name: /rephrase title with ai/i }));
    expect(await screen.findByTestId('rephrase-suggestion-title')).toHaveTextContent('Rephrased: my title');
    expect(screen.queryByTestId('rephrase-suggestion-content')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(title).toHaveValue('Rephrased: my title');

    await userEvent.click(screen.getByRole('button', { name: /rephrase content with ai/i }));
    await userEvent.click(await screen.findByRole('button', { name: /reject/i }));
    expect(body).toHaveValue('my body');
  });

  it('only the clicked field shows loading', async () => {
    server.use(
      http.post('http://localhost:5001/api/threads/rephrase', async () => {
        await delay(100);
        return HttpResponse.json({ data: { rephrased: 'x' } });
      }),
    );
    setup();
    await userEvent.type(screen.getByPlaceholderText(/what's on your mind/i), 't');
    await userEvent.type(screen.getByPlaceholderText(/share your thoughts/i), 'b');
    await userEvent.click(screen.getByRole('button', { name: /rephrase title with ai/i }));

    expect(screen.getAllByText(/rephrasing/i)).toHaveLength(1);
    expect(screen.getByRole('button', { name: /rephrase content with ai/i })).toBeEnabled();
    await screen.findByTestId('rephrase-suggestion-title');
  });

  it('keeps original text when the AI call fails', async () => {
    server.use(
      http.post('http://localhost:5001/api/threads/rephrase', () =>
        HttpResponse.json({ message: 'boom' }, { status: 502 }),
      ),
    );
    setup();
    const title = screen.getByPlaceholderText(/what's on your mind/i);
    await userEvent.type(title, 'keep me');
    await userEvent.click(screen.getByRole('button', { name: /rephrase title with ai/i }));
    expect(await screen.findByText('boom')).toBeInTheDocument();
    expect(title).toHaveValue('keep me');
  });
});

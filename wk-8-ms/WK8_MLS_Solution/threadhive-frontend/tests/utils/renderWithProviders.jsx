import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../src/reducers/authSlice';
import commentReducer from '../../src/reducers/commentSlice';
import currentThreadReducer from '../../src/reducers/currentThreadSlice';
import subredditReducer from '../../src/reducers/subredditSlice';
import themeReducer from '../../src/reducers/themeSlice';
import threadReducer from '../../src/reducers/threadListSlice';
import { mockAuthResponse } from '../mocks/mockData';

const reducer = {
  auth: authReducer,
  threads: threadReducer,
  currentThread: currentThreadReducer,
  comments: commentReducer,
  theme: themeReducer,
  subreddits: subredditReducer,
};

export const authenticatedState = {
  auth: {
    token: mockAuthResponse.success.token,
    user: mockAuthResponse.success.user,
    login: { status: 'idle', error: null },
    registration: { status: 'idle', error: null },
  },
};

export function renderWithProviders(
  ui,
  { preloadedState = authenticatedState, initialRoute = '/home', ...options } = {},
) {
  const store = configureStore({ reducer, preloadedState });
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </Provider>,
    options,
  );

  return { ...result, store };
}

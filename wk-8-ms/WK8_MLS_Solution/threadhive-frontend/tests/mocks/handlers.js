import { http, HttpResponse } from 'msw';
import {
  mockDatabase,
  mockAuthResponse,
} from './mockData';

const BASE_URL = 'http://localhost:5000/api';
const success = (data, message = 'Request successful', options = {}) =>
  HttpResponse.json({ success: true, message, data }, options);
const failure = (message, status) =>
  HttpResponse.json({ success: false, message }, { status });
const currentDatabase = () => mockDatabase;

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'john@example.com' && body.password === 'password123') {
      return success(mockAuthResponse.success, 'Login successful');
    }

    return failure('Invalid credentials', 401);
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'existing@example.com') {
      return failure('Email already exists', 400);
    }

    return success(mockAuthResponse.register, 'User registered successfully');
  }),

  // Thread endpoints
  http.get(`${BASE_URL}/threads`, () => {
    return success(currentDatabase().threads);
  }),

  http.get(`${BASE_URL}/threads/:id`, ({ params }) => {
    const thread = currentDatabase().threads.find((item) => item._id === params.id);

    if (!thread) {
      return failure('Thread not found', 404);
    }

    return success(thread);
  }),

  http.post(`${BASE_URL}/threads`, async ({ request }) => {
    const body = await request.json();
    const database = currentDatabase();
    const subreddit = database.subreddits.find(
      (item) => item._id === body.subreddit,
    );

    if (!body.title?.trim() || !body.content?.trim() || !subreddit) {
      return failure('Title, content, and subreddit are required', 400);
    }

    const thread = {
      _id: `thread-created-${database.nextThreadId++}`,
      title: body.title,
      content: body.content,
      subreddit,
      author: database.users.user1,
      voteCount: 0,
      commentCount: 0,
      createdAt: '2024-01-13T00:00:00.000Z',
    };
    database.threads.unshift(thread);

    return success(thread, 'Thread created successfully', { status: 201 });
  }),

  http.post(`${BASE_URL}/threads/:id/upvote`, ({ params }) => {
    const thread = currentDatabase().threads.find((item) => item._id === params.id);

    if (!thread) {
      return failure('Thread not found', 404);
    }

    thread.voteCount += 1;
    return success(thread, 'Thread upvoted successfully');
  }),

  http.post(`${BASE_URL}/threads/:id/downvote`, ({ params }) => {
    const thread = currentDatabase().threads.find((item) => item._id === params.id);

    if (!thread) {
      return failure('Thread not found', 404);
    }

    thread.voteCount -= 1;
    return success(thread, 'Thread downvoted successfully');
  }),

  // Comment endpoints
  http.get(`${BASE_URL}/comments/thread/:threadId`, ({ params }) => {
    const comments = currentDatabase().comments.filter(
      (comment) => comment.thread === params.threadId,
    );
    return success(comments);
  }),

  http.post(`${BASE_URL}/comments`, async ({ request }) => {
    const body = await request.json();
    const database = currentDatabase();
    const thread = database.threads.find((item) => item._id === body.thread);

    if (!body.content?.trim() || !thread) {
      return failure('Content and a valid thread are required', 400);
    }

    const newComment = {
      _id: `comment-created-${database.nextCommentId++}`,
      thread: body.thread,
      content: body.content,
      user: database.users.user1,
      voteCount: 0,
      createdAt: new Date().toISOString(),
    };
    database.comments.push(newComment);
    thread.commentCount += 1;
    return success(newComment, 'Comment created successfully', { status: 201 });
  }),

  http.post(`${BASE_URL}/comments/:id/upvote`, ({ params }) => {
    const comment = currentDatabase().comments.find((item) => item._id === params.id);

    if (!comment) {
      return failure('Comment not found', 404);
    }

    comment.voteCount += 1;
    return success(comment, 'Comment upvoted successfully');
  }),

  http.post(`${BASE_URL}/comments/:id/downvote`, ({ params }) => {
    const comment = currentDatabase().comments.find((item) => item._id === params.id);

    if (!comment) {
      return failure('Comment not found', 404);
    }

    comment.voteCount -= 1;
    return success(comment, 'Comment downvoted successfully');
  }),

  // Subreddit endpoints
  http.get(`${BASE_URL}/subreddits`, () => {
    return success(currentDatabase().subreddits);
  }),

  http.get(`${BASE_URL}/subreddits/:id`, ({ params }) => {
    const subreddit = currentDatabase().subreddits.find((item) => item._id === params.id);

    if (!subreddit) {
      return failure('Subreddit not found', 404);
    }

    return success(subreddit);
  }),

  http.post(`${BASE_URL}/subreddits`, async ({ request }) => {
    const body = await request.json();
    const database = currentDatabase();

    if (!body.name?.trim() || !body.description?.trim()) {
      return failure('Name and description are required', 400);
    }

    const subreddit = {
      _id: `sub-created-${database.nextSubredditId++}`,
      ...body,
      author: database.users.user1._id,
      subscribers: 1,
      createdAt: new Date().toISOString(),
    };
    database.subreddits.push(subreddit);

    return success(subreddit, 'Subreddit created successfully', { status: 201 });
  }),

  // User endpoints
  http.get(`${BASE_URL}/users/:id`, ({ params }) => {
    const user = Object.values(currentDatabase().users).find((item) => item._id === params.id);

    if (!user) {
      return failure('User not found', 404);
    }

    return success(user);
  }),
];

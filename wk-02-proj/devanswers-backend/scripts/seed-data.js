import { Types } from 'mongoose';

// ── Users ─────────────────────────────────────────────────────────────────────
const u1 = new Types.ObjectId();
const u2 = new Types.ObjectId();
const u3 = new Types.ObjectId();
const u4 = new Types.ObjectId();
const u5 = new Types.ObjectId();
const u6 = new Types.ObjectId();

export const users = [
  { _id: u1, name: 'Alice Johnson',  email: 'alice@example.com',  password: 'hashed_password_1', createdAt: '2023-01-01T10:00:00Z' },
  { _id: u2, name: 'Bob Smith',      email: 'bob@example.com',    password: 'hashed_password_2', createdAt: '2023-02-15T08:30:00Z' },
  { _id: u3, name: 'Charlie Lee',    email: 'charlie@example.com', password: 'hashed_password_3', createdAt: '2023-03-01T12:00:00Z' },
  { _id: u4, name: 'Diana Prince',   email: 'diana@example.com',  password: 'hashed_password_4', createdAt: '2023-04-11T09:45:00Z' },
  { _id: u5, name: 'Evan Brown',     email: 'evan@example.com',   password: 'hashed_password_5', createdAt: '2023-05-01T14:30:00Z' },
  { _id: u6, name: 'Jhonny William', email: 'jhonny@example.com', password: 'hashed_password_6', createdAt: '2023-06-20T11:00:00Z' },
];

// ── Questions ─────────────────────────────────────────────────────────────────
const q1 = new Types.ObjectId();
const q2 = new Types.ObjectId();
const q3 = new Types.ObjectId();
const q4 = new Types.ObjectId();
const q5 = new Types.ObjectId();
const q6 = new Types.ObjectId();
const q7 = new Types.ObjectId();

export const questions = [
  {
    _id: q1,
    title: 'How do I center a div using css flexbox?',
    description: "I'm trying to center a div both vertically and horizontally using flexbox. i've set `display: flex` and tried `justify-content` and `align-items`, but it's not centering. any suggestions?",
    tags: ['css', 'html'],
    upvotes: [u2, u3],
    downvotes: [],
    voteCount: 2,
    views: 120,
    author: u1,
    createdAt: '2023-08-01T12:00:00Z',
  },
  {
    _id: q2,
    title: 'What is the difference between let, const, and var in javascript?',
    description: "I'm confused about when to use let, const, or var in javascript. can someone explain the differences and best practices for using each?",
    tags: ['javascript'],
    upvotes: [],
    downvotes: [],
    voteCount: 0,
    views: 45,
    author: u2,
    createdAt: '2023-09-11T10:05:00Z',
  },
  {
    _id: q3,
    title: 'How can I improve the performance of a react app?',
    description: 'My react application is lagging when rendering large lists. What are some effective techniques to optimize performance?',
    tags: ['react', 'performance'],
    upvotes: [u4, u5, u1],
    downvotes: [],
    voteCount: 3,
    views: 80,
    author: u3,
    createdAt: '2023-03-06T11:15:00Z',
  },
  {
    _id: q4,
    title: 'Why is my async function returning a promise instead of the actual value?',
    description: 'I have an async function that returns data, but when I call it, I get a promise instead of the value. What am I doing wrong?',
    tags: ['javascript', 'async', 'js'],
    upvotes: [u1],
    downvotes: [u5],
    voteCount: 0,
    views: 32,
    author: u4,
    createdAt: '2023-07-20T15:30:00Z',
  },
  {
    _id: q5,
    title: 'How do I set up routing with react router v6?',
    description: "I'm new to react router v6 and can't figure out how to define routes correctly. Can someone provide a basic example?",
    tags: ['react', 'react-router'],
    upvotes: [],
    downvotes: [],
    voteCount: 0,
    views: 10,
    author: u5,
    createdAt: '2023-04-11T09:45:00Z',
  },
  {
    _id: q6,
    title: 'What are the best practices for handling errors in Node.js?',
    description: 'I want to implement proper error handling in my Node.js application. What are the recommended patterns and best practices?',
    tags: ['nodejs', 'javascript', 'error-handling'],
    upvotes: [u1, u4],
    downvotes: [],
    voteCount: 2,
    views: 65,
    author: u2,
    createdAt: '2024-06-15T14:30:00Z',
  },
  {
    _id: q7,
    title: 'How to implement authentication with JWT in Express?',
    description: "I'm building a REST API and need to implement JWT-based authentication. What's the best approach?",
    tags: ['nodejs', 'express', 'jwt', 'authentication'],
    upvotes: [u3],
    downvotes: [],
    voteCount: 1,
    views: 42,
    author: u4,
    createdAt: '2025-01-20T08:15:00Z',
  },
];

// ── Answers ───────────────────────────────────────────────────────────────────
const a1 = new Types.ObjectId();
const a2 = new Types.ObjectId();
const a3 = new Types.ObjectId();
const a4 = new Types.ObjectId();
const a5 = new Types.ObjectId();
const a6 = new Types.ObjectId();
const a7 = new Types.ObjectId();

export const answers = [
  {
    _id: a1,
    questionId: q1,
    answerText: 'you can center a div using flexbox by setting `display: flex`, `justify-content: center`, and `align-items: center` on the parent container.',
    author: u3,
    upvotes: [u1, u3],
    downvotes: [],
    voteCount: 2,
    createdAt: '2023-10-01T12:00:00Z',
  },
  {
    _id: a2,
    questionId: q2,
    answerText: "`var` is function-scoped, while `let` and `const` are block-scoped. use `const` when you don't plan to reassign, and `let` otherwise.",
    author: u3,
    upvotes: [],
    downvotes: [],
    voteCount: 0,
    createdAt: '2024-12-11T10:05:00Z',
  },
  {
    _id: a3,
    questionId: q3,
    answerText: 'use `react.memo`, `usecallback`, and pagination or virtualization (like `react-window`) to improve react app performance.',
    author: u4,
    upvotes: [u5, u1, u3, u2, u4],
    downvotes: [],
    voteCount: 5,
    createdAt: '2025-03-06T14:15:00Z',
  },
  {
    _id: a4,
    questionId: q3,
    answerText: 'you can also try to lazy load components and split your bundle.',
    author: u5,
    upvotes: [],
    downvotes: [],
    voteCount: 0,
    createdAt: '2024-11-17T19:30:00Z',
  },
  {
    _id: a5,
    questionId: q5,
    answerText: 'in react router v6, use `<browserrouter>`, `<routes>` and `<route>` elements to define routes.',
    author: u1,
    upvotes: [u2],
    downvotes: [],
    voteCount: 1,
    createdAt: '2024-10-11T09:45:00Z',
  },
  {
    _id: a6,
    questionId: q1,
    answerText: 'You can center a div using flex',
    author: u1,
    upvotes: [u2],
    downvotes: [],
    voteCount: 1,
    createdAt: '2023-12-10T19:15:00Z',
  },
  {
    _id: a7,
    questionId: q1,
    answerText: 'you can center div using margin auto horizontally',
    author: u2,
    upvotes: [u1, u2, u3, u4, u5],
    downvotes: [],
    voteCount: 5,
    createdAt: '2025-05-12T06:35:00Z',
  },
];

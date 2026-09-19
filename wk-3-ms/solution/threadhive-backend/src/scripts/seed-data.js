import mongoose from 'mongoose';
const { Types } = mongoose;

const u1 = new Types.ObjectId();
const u2 = new Types.ObjectId();
const u3 = new Types.ObjectId();

export const users = [
  { _id: u1, name: 'Alice', email: 'alice@example.com', password: 'password123' },
  { _id: u2, name: 'Bob', email: 'bob@example.com', password: 'password123' },
  { _id: u3, name: 'Charlie', email: 'charlie@example.com', password: 'password123' }
];

export const subreddits = [
  {
    name: 'javascript',
    description: 'All about JavaScript programming',
    author: u1
  },
  {
    name: 'node',
    description: 'Node.js news and discussions',
    author: u2
  },
  {
    name: 'webdev',
    description: 'General web development topics',
    author: u3
  }
];

export const threads = [
  {
    title: 'How do I learn Node.js?',
    content: 'I am new to backend and want to learn Node.js. Any good resources?',
    subredditName: 'node',
    author: u1
  },
  {
    title: 'Best way to manage state in React?',
    content: 'What is the best way to manage state in larger React applications?',
    subredditName: 'javascript',
    author: u2
  },
  {
    title: 'Modern CSS frameworks',
    content: 'Which CSS frameworks are popular in 2025?',
    subredditName: 'webdev',
    author: u3
  }
];

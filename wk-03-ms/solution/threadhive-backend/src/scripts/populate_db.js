// scripts/populate_db.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Subreddit from '../models/Subreddit.js';
import Thread from '../models/Thread.js';
import { users, subreddits, threads } from './seed-data.js';

dotenv.config();

// Connect to DB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Clear collections
async function clearDatabase() {
  try {
    await Promise.all([
      User.deleteMany({}),
      Subreddit.deleteMany({}),
      Thread.deleteMany({})
    ]);
    console.log(' Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

// Insert users
async function insertUsers() {
  try {
    const createdUsers = await User.insertMany(users);
    console.log(`Inserted ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error(' Error inserting users:', error);
    throw error;
  }
}

// Insert subreddits
async function insertSubreddits() {
  try {
    const createdSubs = await Subreddit.insertMany(subreddits);
    console.log(` Inserted ${createdSubs.length} subreddits`);
    return createdSubs;
  } catch (error) {
    console.error(' Error inserting subreddits:', error);
    throw error;
  }
}

// Create thread docs with proper subreddit references
function prepareThreadDocs(subredditMap) {
  return threads.map(thread => ({
    title: thread.title,
    content: thread.content,
    author: thread.author,
    subreddit: subredditMap[thread.subredditName],
    upvotes: 0,
    downvotes: 0
  }));
}

// Insert threads
async function insertThreads(subredditDocs) {
  try {
    const subredditMap = Object.fromEntries(
      subredditDocs.map(sub => [sub.name, sub._id])
    );
    const threadDocs = prepareThreadDocs(subredditMap);

    const createdThreads = await Thread.insertMany(threadDocs);
    console.log(`Inserted ${createdThreads.length} threads`);
    return createdThreads;
  } catch (error) {
    console.error('Error inserting threads:', error);
    throw error;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    await connectToDatabase();
    await clearDatabase();

    const createdUsers = await insertUsers();
    const createdSubreddits = await insertSubreddits();
    await insertThreads(createdSubreddits);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error(' Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seedDatabase();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';

import { users, questions, answers } from './seed-data.js';

dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

async function clearExistingData() {
  try {
    await Promise.all([
      User.deleteMany({}),
      Question.deleteMany({}),
      Answer.deleteMany({}),
    ]);
    console.log('Deleted existing data');
  } catch (error) {
    console.error('Error clearing existing data:', error);
    throw error;
  }
}

async function createUsers(users) {
  try {
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
}

async function createQuestions(questions) {
  try {
    const createdQuestions = await Question.insertMany(questions);
    console.log(`Created ${createdQuestions.length} questions`);
    return createdQuestions;
  } catch (error) {
    console.error('Error creating questions:', error);
    throw error;
  }
}

async function createAnswers(answers) {
  try {
    const createdAnswers = await Answer.insertMany(answers);
    console.log(`Created ${createdAnswers.length} answers`);
    return createdAnswers;
  } catch (error) {
    console.error('Error creating answers:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await clearExistingData();
    await createUsers(users);
    await createQuestions(questions);
    await createAnswers(answers);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

main().catch(console.error);

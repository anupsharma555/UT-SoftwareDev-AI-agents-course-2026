import "dotenv/config";
import fs from "node:fs/promises";
import mongoose from "mongoose";

import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";

async function loadData(filename) {
  const filePath = new URL(`../data/${filename}`, import.meta.url);
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

function validateUniqueIds(records, label) {
  const ids = records.map(({ _id }) => String(_id));

  if (ids.length !== new Set(ids).size) {
    throw new Error(`${label} data contains duplicate ObjectIds.`);
  }

  if (ids.some((id) => !mongoose.isObjectIdOrHexString(id))) {
    throw new Error(`${label} data contains an invalid ObjectId.`);
  }
}

function validateSeedData(users, subreddits, threads) {
  if (users.length !== 10 || subreddits.length !== 6 || threads.length !== 20) {
    throw new Error(
      "Seed data must contain 10 users, 6 subreddits, and 20 threads."
    );
  }

  validateUniqueIds(users, "User");
  validateUniqueIds(subreddits, "Subreddit");
  validateUniqueIds(threads, "Thread");
  validateUniqueIds([...users, ...subreddits, ...threads], "Seed");

  const userIds = new Set(users.map(({ _id }) => String(_id)));
  const subredditIds = new Set(subreddits.map(({ _id }) => String(_id)));

  if (subreddits.some(({ author }) => !userIds.has(String(author)))) {
    throw new Error(
      "A subreddit references a user that is not in the seed data."
    );
  }

  if (
    threads.some(
      ({ author, subreddit }) =>
        !userIds.has(String(author)) || !subredditIds.has(String(subreddit))
    )
  ) {
    throw new Error("A thread references data that is not in the seed data.");
  }
}

async function seedDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is required. Add it to the .env file before seeding."
    );
  }

  console.log("Loading seed data...");
  const [users, subreddits, threads] = await Promise.all([
    loadData("users.json"),
    loadData("subreddits.json"),
    loadData("threads.json"),
  ]);

  validateSeedData(users, subreddits, threads);

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("Clearing existing threads, subreddits, and users...");
  await Thread.deleteMany({});
  await Subreddit.deleteMany({});
  await User.deleteMany({});

  console.log(`Inserting ${users.length} users...`);
  await User.insertMany(users);
  console.log(`Inserting ${subreddits.length} subreddits...`);
  await Subreddit.insertMany(subreddits);
  console.log(`Inserting ${threads.length} threads...`);
  await Thread.insertMany(threads);

  console.log("Database seeded successfully.");
}

try {
  await seedDatabase();
} catch (error) {
  console.error("Database seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

import "dotenv/config";
import mongoose from "mongoose";

import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";

const runId = new mongoose.Types.ObjectId().toString();
const testEmail = `crud-test-${runId}@example.com`;
const testSubredditName = `crud-test-${runId}`;
const testThreadTitle = `CRUD test thread ${runId}`;

let total = 0;
let passed = 0;
const failures = [];

let seededUser;
let testUser;
let testSubreddit;
let testThread;

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function test(name, operation) {
  total += 1;

  try {
    await operation();
    passed += 1;
    console.log(`PASS ${total}/20: ${name}`);
  } catch (error) {
    failures.push({ name, message: error.message });
    console.error(`FAIL ${total}/20: ${name} - ${error.message}`);
  }
}

async function runTests() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is required. Seed the database before testing."
    );
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  await test("reads at least 10 seeded users", async () => {
    expect((await User.countDocuments()) >= 10, "Expected at least 10 users.");
  });

  await test("reads at least 6 seeded subreddits", async () => {
    expect(
      (await Subreddit.countDocuments()) >= 6,
      "Expected at least 6 subreddits."
    );
  });

  await test("reads at least 20 seeded threads", async () => {
    expect(
      (await Thread.countDocuments()) >= 20,
      "Expected at least 20 threads."
    );
  });

  await test("finds a seeded user", async () => {
    seededUser = await User.findOne();
    expect(seededUser, "No seeded user was found.");
  });

  await test("populates a seeded subreddit author", async () => {
    const subreddit = await Subreddit.findOne().populate("author");
    expect(subreddit?.author?.email, "Subreddit author was not populated.");
  });

  await test("populates a seeded thread author and subreddit", async () => {
    const thread = await Thread.findOne()
      .populate("author")
      .populate("subreddit");
    expect(thread?.author?.email, "Thread author was not populated.");
    expect(thread?.subreddit?.name, "Thread subreddit was not populated.");
  });

  await test("creates a user", async () => {
    testUser = await User.create({
      name: "CRUD Test User",
      email: testEmail,
      password: "test-password-not-for-authentication",
      createdAt: new Date(),
    });
    expect(testUser._id, "Created user has no ObjectId.");
  });

  await test("reads the created user by email", async () => {
    const user = await User.findOne({ email: testEmail });
    expect(
      String(user?._id) === String(testUser?._id),
      "Created user was not found."
    );
  });

  await test("updates a user name", async () => {
    const result = await User.updateOne(
      { _id: testUser?._id },
      { name: "Updated CRUD Test User" }
    );
    expect(result.modifiedCount === 1, "User name was not updated.");
  });

  await test("reads the updated user name", async () => {
    const user = await User.findById(testUser?._id);
    expect(
      user?.name === "Updated CRUD Test User",
      "Updated user name was not saved."
    );
  });

  await test("creates a subreddit with a user reference", async () => {
    testSubreddit = await Subreddit.create({
      name: testSubredditName,
      description: "Temporary subreddit created by the CRUD test script.",
      author: testUser?._id,
      createdAt: new Date(),
    });
    expect(testSubreddit._id, "Created subreddit has no ObjectId.");
  });

  await test("reads the created subreddit by name", async () => {
    const subreddit = await Subreddit.findOne({ name: testSubredditName });
    expect(
      String(subreddit?._id) === String(testSubreddit?._id),
      "Created subreddit was not found."
    );
  });

  await test("updates a subreddit description", async () => {
    const result = await Subreddit.updateOne(
      { _id: testSubreddit?._id },
      { description: "Updated CRUD test description." }
    );
    expect(
      result.modifiedCount === 1,
      "Subreddit description was not updated."
    );
  });

  await test("creates a thread with valid references", async () => {
    testThread = await Thread.create({
      title: testThreadTitle,
      content: "Temporary thread created by the CRUD test script.",
      author: testUser?._id,
      subreddit: testSubreddit?._id,
      createdAt: new Date(),
    });
    expect(testThread._id, "Created thread has no ObjectId.");
  });

  await test("reads the created thread with populated references", async () => {
    const thread = await Thread.findById(testThread?._id)
      .populate("author")
      .populate("subreddit");
    expect(
      thread?.author?.email === testEmail,
      "Created thread author is incorrect."
    );
    expect(
      thread?.subreddit?.name === testSubredditName,
      "Created thread subreddit is incorrect."
    );
  });

  await test("updates a thread title", async () => {
    const result = await Thread.updateOne(
      { _id: testThread?._id },
      { title: `${testThreadTitle} updated` }
    );
    expect(result.modifiedCount === 1, "Thread title was not updated.");
  });

  await test("updates thread vote totals", async () => {
    const result = await Thread.updateOne(
      { _id: testThread?._id },
      { upvotes: 8, downvotes: 3, voteCount: 5 }
    );
    expect(result.modifiedCount === 1, "Thread votes were not updated.");
  });

  await test("reads the updated thread fields", async () => {
    const thread = await Thread.findById(testThread?._id);
    expect(
      thread?.title.endsWith("updated"),
      "Updated thread title was not saved."
    );
    expect(thread?.voteCount === 5, "Updated vote count was not saved.");
  });

  await test("deletes the temporary thread", async () => {
    const result = await Thread.deleteOne({ _id: testThread?._id });
    expect(result.deletedCount === 1, "Temporary thread was not deleted.");
    testThread = null;
  });

  await test("deletes the temporary subreddit and user", async () => {
    const [subredditResult, userResult] = await Promise.all([
      Subreddit.deleteOne({ _id: testSubreddit?._id }),
      User.deleteOne({ _id: testUser?._id }),
    ]);
    expect(
      subredditResult.deletedCount === 1,
      "Temporary subreddit was not deleted."
    );
    expect(userResult.deletedCount === 1, "Temporary user was not deleted.");
    testSubreddit = null;
    testUser = null;
  });
}

async function cleanup() {
  await Promise.all([
    testThread && Thread.deleteOne({ _id: testThread._id }),
    testSubreddit && Subreddit.deleteOne({ _id: testSubreddit._id }),
    testUser && User.deleteOne({ _id: testUser._id }),
  ]);
}

try {
  await runTests();

  if (failures.length > 0) {
    throw new Error(
      `${failures.length} of ${total} CRUD tests failed: ${failures
        .map(({ name }) => name)
        .join(", ")}`
    );
  }

  console.log(`All ${passed} CRUD tests passed.`);
} catch (error) {
  console.error("CRUD test run failed:", error.message);
  process.exitCode = 1;
} finally {
  await cleanup();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

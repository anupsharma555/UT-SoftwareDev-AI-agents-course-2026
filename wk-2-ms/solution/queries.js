import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./models/User.js";
import Subreddit from "./models/Subreddit.js";
import Thread from "./models/Thread.js";

// 1. Find user by email diana@example.com
async function query1() {
  const user = await User.findOne({ email: "diana@example.com" });
  console.log("Query 1: User by email\n", user);
}

// 2. Get threads in a subreddit programming
async function query2() {
  const subreddit = await Subreddit.findOne({ name: "programming" });
  const threads = await Thread.find({ subreddit: subreddit._id }).populate(
    "author",
  );
  console.log("Query 2: Threads in subreddit\n", threads);
}

// 3. Users who posted threads
async function query3() {
  const userIds = await Thread.distinct("author");
  const users = await User.find({ _id: { $in: userIds } });
  console.log("Query 3: Users who posted threads\n", users);
}

// 4. Threads created on or after January 1, 2024
async function query4() {
  const threads = await Thread.find({
    createdAt: { $gte: new Date("2024-01-01") },
  });
  console.log("Query 4: Threads created after Jan 2024\n", threads);
}

// 5. Add a new thread (Create) Subreddit devops author Ethan
async function query5() {
  const subreddit = await Subreddit.findOne({ name: "devops" });
  const author = await User.findOne({ name: "Ethan" });

  const thread = await Thread.create({
    title: "Docker and kubernetes?",
    content: "Which one is better for large-scale apps?",
    subreddit: subreddit._id,
    author: author._id,
    upvotes: 0,
    downvotes: 0,
    voteCount: 0,
    createdAt: new Date(),
  });

  console.log("Query 5: Created thread\n", thread);
}

// 6. Update thread title Docker and kubernetes?
async function query6() {
  const thread = await Thread.findOne({ title: "Docker and kubernetes?" });
  if (!thread) {
    console.log("Thread not found.");
    return;
  }
  thread.title = "How to start learning Node.js in 2025?";
  await thread.save();
  console.log("Query 6: Updated thread title\n", thread);
}

// 7. Delete all subreddits and their associated threads
async function query7() {
  const subreddits = await Subreddit.find({});

  for (const subreddit of subreddits) {
    const threadDeleteResult = await Thread.deleteMany({
      subreddit: subreddit._id,
    });
    console.log(
      `Deleted ${threadDeleteResult.deletedCount} threads for subreddit ${subreddit.name}`,
    );
  }

  const subredditDeleteResult = await Subreddit.deleteMany({});
  console.log(
    `Query 7: Deleted ${subredditDeleteResult.deletedCount} subreddits`,
  );
}

// 8. Find the author ID and thread count for the user who posted the most threads
async function query8() {
  const result = await Thread.aggregate([
    { $group: { _id: "$author", threadCount: { $sum: 1 } } },
    { $sort: { threadCount: -1 } },
    { $limit: 1 },
  ]);
  console.log("Query 8: Top author by thread count\n", result);
}

async function runQueries() {
  // Uncomment the query you want to run
  // await query1();
  // await query2();
  // await query3();
  // await query4();
  // await query5();
  // await query6();
  // await query7();
  // await query8();
}

async function main() {
  try {
    dotenv.config();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    await runQueries();
  } catch (err) {
    console.error("DB connection failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

main();

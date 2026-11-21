import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./models/User.js";
import Subreddit from "./models/Subreddit.js";
import Thread from "./models/Thread.js";

//1. Find user by email diana@example.com
async function query1() {
  const user = await User.findOne({ email: "diana@example.com" });
  console.log(user);
}

// 2. Get threads in the programming subreddit
async function query2() {
  const subreddit = await Subreddit.findOne({ name: "programming" });
  const threads = await Thread.find({ subreddit: subreddit._id });
  console.log(threads);
}

// 3. Find users who posted threads
async function query3() {
  const userIds = await Thread.distinct("author");
  const users = await User.find({ _id: { $in: userIds } });
  console.log(users);
}

// 4. Find threads created on or after January 1, 2024
async function query4() {
  const threads = await Thread.find({
    createdAt: { $gte: new Date("2024-01-01") },
  });
  console.log(threads); // Write code for Query 4 here
}

// 5. Add a new thread in devops authored by Ethan
async function query5() {
  const subreddit = await Subreddit.findOne({ name: "devops" });
  const author = await User.findOne({ name: "Ethan" });

  const newThread = await Thread.create({
    title: "Docker or Kubernetes?",
    content: "Discussion about DevOps practices.",
    subreddit: subreddit._id,
    author: author._id,
    createdAt: new Date(),
  });

  console.log(newThread);
}

// 6. Update the title of the thread "Docker and kubernetes?"
async function query6() {
  const thread = await Thread.findOne({ title: "Docker or Kubernetes?" });

  if (!thread) {
    console.log("Thread not found.");
    return;
  }

  thread.title = "How to start learning Node.js in 2025?";
  await thread.save();
  console.log(thread);
}

// 7. Delete all subreddits and their associated threads
async function query7() {
  const subreddits = await Subreddit.find({});

  for (const subreddit of subreddits) {
    await Thread.deleteMany({ subreddit: subreddit._id });
  }

  const result = await Subreddit.deleteMany({});
  console.log(`Deleted ${result.deletedCount} subreddits.`);
}

// 8. Find the author ID and thread count for the user who posted the most threads
async function query8() {
  const result = await Thread.aggregate([
    { $group: { _id: "$author", threadCount: { $sum: 1 } } },
    { $sort: { threadCount: -1 } },
    { $limit: 1 },
  ]);

  console.log(result);
}

async function runQueries() {
  // Uncomment the query you want to run
  // await query1();
  // await query2();
  // await query3();
  // await query4();
  // await query5();
  //await query6();
  await query7();
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

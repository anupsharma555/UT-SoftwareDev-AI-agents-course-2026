import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";

export const fetchAllSubreddits = async () => {
  return await Subreddit.find();
};

export const createNewSubreddit = async (name, description, author) => {
  const existingSubreddit = await Subreddit.findOne({ name });

  if (existingSubreddit) {
    return null; 
  }

  const newSubreddit = new Subreddit({ name, description, author });
  await newSubreddit.save();

  return newSubreddit;
};

export const fetchSubredditWithThreads = async (id) => {
  const subreddit = await Subreddit.findById(id);
  if (!subreddit) {
    return null; 
  }

  const threads = await Thread.find({ subreddit: id })
    .populate("author")
    .sort({ createdAt: -1 });

  return { subreddit, threads };
};


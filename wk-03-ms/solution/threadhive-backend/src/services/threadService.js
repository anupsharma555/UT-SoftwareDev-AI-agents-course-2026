import Thread from "../models/Thread.js";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";

export const fetchAllThreads = async () => {
  return await Thread.find()
    .populate({ path: "author", model: User })
    .populate({ path: "subreddit", model: Subreddit })
    .sort({ createdAt: -1 });
};

export const fetchThreadById = async (id) => {
  return await Thread.findById(id)
    .populate({ path: "author" })
    .populate({ path: "subreddit" });
};

export const createNewThread = async (title, content, author, subreddit) => {
  const newThread = new Thread({ title, content, author, subreddit });
  await newThread.save();

  return await Thread.findById(newThread._id)
    .populate({ path: "subreddit", select: "name description" })
    .populate({ path: "author", select: "username" });
};

export const updateThreadById = async (id, updateData) => {
  return await Thread.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteThreadById = async (id) => {
  return await Thread.findByIdAndDelete(id);
};


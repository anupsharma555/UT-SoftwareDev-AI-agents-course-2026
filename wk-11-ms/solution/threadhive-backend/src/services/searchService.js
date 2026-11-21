import Thread from "../models/Thread.js";

const MAX_QUERY_LENGTH = 100;
const RESULT_LIMIT = 50;

export const searchThreads = async (query) => {
  const trimmed = (query ?? "").trim();

  // Blank/whitespace/missing query never returns the whole collection.
  if (!trimmed) {
    return [];
  }

  // Bound scan cost for very long queries.
  const clamped = trimmed.slice(0, MAX_QUERY_LENGTH);

  // Escape regex metacharacters so the query is matched literally
  // (prevents regex injection / ReDoS and accidental wildcard behavior).
  const escaped = clamped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const threads = await Thread.find({
    $or: [
      { title: { $regex: escaped, $options: "i" } },
      { content: { $regex: escaped, $options: "i" } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(RESULT_LIMIT)
    .populate("author", "name")
    .populate("subreddit", "name");

  return threads;
};

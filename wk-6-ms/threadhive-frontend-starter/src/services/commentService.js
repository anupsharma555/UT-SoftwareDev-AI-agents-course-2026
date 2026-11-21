// services/commentService.js
import { comments } from "../../data/dummyData"; // Replace later with Axios

export async function fetchCommentsForThread(threadId) {
  // Dummy logic for now. Replace with actual API call later.
  return comments.filter((c) => c.thread === threadId);
}

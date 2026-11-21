import { fetchAPI } from "../api/apiClient";
import { COMMENT_API } from "../config/apiConfig";

export async function fetchCommentsForThread(threadId) {
  const res = await fetchAPI(COMMENT_API.GET_BY_THREAD(threadId), {
    method: "GET",
  });
  return res.data;
}

export async function postComment({ threadId, content }) {
  const res = await fetchAPI(COMMENT_API.CREATE, {
    method: "POST",
    body: JSON.stringify({
      thread: threadId,
      content,
    }),
  });
  return res.data;
}

export const upvoteComment = async (commentId) => {
  const res = await fetchAPI(COMMENT_API.UPVOTE(commentId), {
    method: "POST",
  });
  return res.data;
};

export const downvoteComment = async (commentId) => {
  const res = await fetchAPI(COMMENT_API.DOWNVOTE(commentId), {
    method: "POST",
  });
  return res.data;
};

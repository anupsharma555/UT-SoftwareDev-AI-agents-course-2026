import { fetchAPI } from "../api/apiClient";
import { SUBREDDIT_API } from '../config/apiConfig';

export const fetchSubreddits = async () => {
  const res = await fetchAPI(SUBREDDIT_API.GET_ALL, {
    method: 'GET',
  });
  return res.data;
};

export const createSubreddit = async ({ name, description = '' }) => {
  const res = await fetchAPI(SUBREDDIT_API.CREATE, {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
  return res.data;
};

export const fetchSubredditWithThreads = async (subredditId) => {
  const res = await fetchAPI(SUBREDDIT_API.GET_BY_ID(subredditId), {
    method: 'GET',
  });
  return res.data;
};

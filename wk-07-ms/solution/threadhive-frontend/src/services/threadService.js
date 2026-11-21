import { fetchAPI } from '../api/apiClient';
import { THREAD_API } from '../config/apiConfig';

export async function fetchRecentThreads() {
  const res = await fetchAPI(THREAD_API.GET_ALL, {
    method: 'GET',
  });
  return res.data;
}

export async function fetchThreadById(threadId) {
  const res = await fetchAPI(THREAD_API.GET_BY_ID(threadId), {
    method: 'GET',
  });
  return res.data;
}

export const createThread = async (data) => {
  const res = await fetchAPI(THREAD_API.CREATE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
};

export async function upvoteThread(threadId) {
  const res = await fetchAPI(THREAD_API.UPVOTE(threadId), {
    method: 'POST',
  });
  return res.data;
}

export async function downvoteThread(threadId) {
  const res = await fetchAPI(THREAD_API.DOWNVOTE(threadId), {
    method: 'POST',
  });
  return res.data;
};

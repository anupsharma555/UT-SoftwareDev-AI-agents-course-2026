import axiosInstance from "../api/axiosInstance.js";
import { BOOKMARK_API } from "../config/config.js";

const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getBookmarkIds = async (token) => {
  const res = await axiosInstance.get(BOOKMARK_API.GET_IDS, authHeaders(token));
  return res.data.data || [];
};

export const getBookmarkedQuestions = async (token) => {
  const res = await axiosInstance.get(BOOKMARK_API.GET_ALL, authHeaders(token));
  return res.data.data || [];
};

export const addBookmark = async (questionId, token) => {
  const res = await axiosInstance.post(
    BOOKMARK_API.ADD,
    { questionId },
    authHeaders(token),
  );
  return res.data.data;
};

export const removeBookmark = async (questionId, token) => {
  const res = await axiosInstance.delete(
    BOOKMARK_API.REMOVE(questionId),
    authHeaders(token),
  );
  return res.data.data;
};

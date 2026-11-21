import axiosInstance from "../api/axiosInstance.js";
import { BOOKMARK_API } from "../config/config.js";

export const getSavedIds = async (token) => {
  const res = await axiosInstance.get(BOOKMARK_API.IDS, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data || [];
};

export const getSavedQuestions = async (token) => {
  const res = await axiosInstance.get(BOOKMARK_API.LIST, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data || [];
};

export const saveQuestion = async (questionId, token) => {
  const res = await axiosInstance.post(
    BOOKMARK_API.SAVE,
    { questionId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data.data;
};

export const unsaveQuestion = async (questionId, token) => {
  const res = await axiosInstance.delete(BOOKMARK_API.UNSAVE(questionId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

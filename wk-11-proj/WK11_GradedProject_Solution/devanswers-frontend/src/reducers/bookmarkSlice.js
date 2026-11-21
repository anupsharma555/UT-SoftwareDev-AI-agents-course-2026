import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getSavedIds,
  getSavedQuestions,
  saveQuestion,
  unsaveQuestion,
} from "../services/bookmarkService.js";

const initialState = {
  savedIds: [], // string[] of saved questionIds — drives card/detail icon state
  savedQuestions: [], // full question objects for the profile section
  loadingIds: false,
  loadingList: false,
  error: null,
};

export const fetchSavedIds = createAsyncThunk(
  "bookmark/fetchSavedIds",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user.userInfo || {};
      return await getSavedIds(token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch saved questions",
      );
    }
  },
);

export const fetchSavedQuestions = createAsyncThunk(
  "bookmark/fetchSavedQuestions",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user.userInfo || {};
      return await getSavedQuestions(token);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch saved questions",
      );
    }
  },
);

export const toggleBookmark = createAsyncThunk(
  "bookmark/toggleBookmark",
  async ({ questionId }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user.userInfo || {};
      const isSaved = getState().bookmark.savedIds.includes(questionId);

      if (isSaved) {
        await unsaveQuestion(questionId, token);
        return { questionId, op: "unsave" };
      }

      const bookmark = await saveQuestion(questionId, token);
      return { questionId, op: "save", bookmark };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Bookmark failed",
      );
    }
  },
);

const bookmarkSlice = createSlice({
  name: "bookmark",
  initialState,
  reducers: {
    clearBookmarks: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchSavedIds
      .addCase(fetchSavedIds.pending, (state) => {
        state.loadingIds = true;
        state.error = null;
      })
      .addCase(fetchSavedIds.fulfilled, (state, action) => {
        state.loadingIds = false;
        state.savedIds = action.payload;
      })
      .addCase(fetchSavedIds.rejected, (state, action) => {
        state.loadingIds = false;
        state.error = action.payload || action.error.message;
      })

      // fetchSavedQuestions
      .addCase(fetchSavedQuestions.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchSavedQuestions.fulfilled, (state, action) => {
        state.loadingList = false;
        state.savedQuestions = action.payload;
      })
      .addCase(fetchSavedQuestions.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload || action.error.message;
      })

      // toggleBookmark
      .addCase(toggleBookmark.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const { questionId, op } = action.payload;
        if (op === "save") {
          if (!state.savedIds.includes(questionId)) {
            state.savedIds.push(questionId);
          }
        } else {
          state.savedIds = state.savedIds.filter((id) => id !== questionId);
          state.savedQuestions = state.savedQuestions.filter(
            (q) => q._id !== questionId,
          );
        }
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearBookmarks } = bookmarkSlice.actions;

export const selectIsSaved = (questionId) => (state) =>
  state.bookmark.savedIds.includes(questionId);

export default bookmarkSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getBookmarkIds,
  getBookmarkedQuestions,
  addBookmark,
  removeBookmark,
} from "../services/bookmarkService.js";
import { logout } from "./userSlice.js";

const initialState = {
  ids: [], // ids of the questions the logged-in user has saved, newest first
  questions: [], // saved question objects, loaded for the profile page
  pending: {}, // questionId -> desired saved state, for toggles still in flight
  error: null,
};

// Returned when a fetch finishes after the user logged out or switched accounts.
const STALE = "stale";

const errorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const currentToken = (getState) => getState().user.userInfo?.token;

// Runs a request for the current user and discards the result if the user changed meanwhile,
// so one user's bookmarks never land in another user's session.
const forCurrentUser = async (getState, rejectWithValue, request, fallback) => {
  const token = currentToken(getState);
  try {
    const result = await request(token);
    return currentToken(getState) === token ? result : rejectWithValue(STALE);
  } catch (error) {
    return rejectWithValue(errorMessage(error, fallback));
  }
};

export const fetchBookmarkIds = createAsyncThunk(
  "bookmark/fetchBookmarkIds",
  (_, { getState, rejectWithValue }) =>
    forCurrentUser(getState, rejectWithValue, getBookmarkIds, "Failed to load bookmarks"),
);

export const fetchBookmarkedQuestions = createAsyncThunk(
  "bookmark/fetchBookmarkedQuestions",
  (_, { getState, rejectWithValue }) =>
    forCurrentUser(getState, rejectWithValue, getBookmarkedQuestions, "Failed to load saved questions"),
);

// Save (shouldBookmark: true) or unsave (false) a question.
// The saved state is updated optimistically on pending and rolled back if the request is rejected.
// A toggle is ignored while another one for the same question is in flight.
export const toggleBookmark = createAsyncThunk(
  "bookmark/toggleBookmark",
  async ({ questionId, shouldBookmark }, { getState, rejectWithValue }) => {
    try {
      const token = currentToken(getState);
      return shouldBookmark
        ? await addBookmark(questionId, token)
        : await removeBookmark(questionId, token);
    } catch (error) {
      return rejectWithValue(errorMessage(error, "Failed to update bookmark"));
    }
  },
  {
    condition: ({ questionId }, { getState }) =>
      !(questionId in (getState().bookmark?.pending ?? {})),
  },
);

const setSaved = (state, questionId, saved) => {
  state.ids = state.ids.filter((id) => id !== questionId);
  if (saved) {
    state.ids.unshift(questionId);
  }
};

// Server data can arrive while a toggle is in flight; keep the toggle's intended state.
const applyPending = (state) => {
  Object.entries(state.pending).forEach(([questionId, saved]) =>
    setSaved(state, questionId, saved),
  );
};

const bookmarkSlice = createSlice({
  name: "bookmark",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarkIds.fulfilled, (state, action) => {
        state.ids = action.payload;
        applyPending(state);
      })
      .addCase(fetchBookmarkedQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
        // The saved list is the source of truth for which questions are saved.
        state.ids = action.payload.map((q) => q._id);
        applyPending(state);
        state.error = null;
      })
      .addCase(fetchBookmarkedQuestions.rejected, (state, action) => {
        if (action.payload !== STALE) {
          state.error = action.payload || action.error.message;
        }
      })
      .addCase(toggleBookmark.pending, (state, action) => {
        const { questionId, shouldBookmark } = action.meta.arg;
        state.error = null;
        state.pending[questionId] = shouldBookmark;
        setSaved(state, questionId, shouldBookmark);
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        delete state.pending[action.meta.arg.questionId];
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        // A toggle skipped by `condition` never started, so there is nothing to roll back.
        if (action.meta.condition) return;
        const { questionId, shouldBookmark } = action.meta.arg;
        delete state.pending[questionId];
        setSaved(state, questionId, !shouldBookmark);
        state.error = action.payload || action.error.message;
      })
      // Never leak one user's saved questions to the next user of this browser.
      .addCase(logout, () => initialState);
  },
});

export default bookmarkSlice.reducer;

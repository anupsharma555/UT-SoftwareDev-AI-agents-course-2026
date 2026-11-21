// src/reducers/bookmarkSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  saveBookmark,
  removeBookmark,
  fetchBookmarks,
} from '../services/bookmarkService';
import { handleApiError } from '../utils/handleApiError';

// Initial State
const initialState = {
  saved: [], // saved threads (populated)
  savedIds: [], // thread ids for quick feed lookups
  loading: false,
  error: null,
};

// Async Thunks
export const fetchBookmarksThunk = createAsyncThunk(
  'bookmarks/fetch',
  async (_, thunkAPI) => {
    try {
      return await fetchBookmarks();
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const saveBookmarkThunk = createAsyncThunk(
  'bookmarks/save',
  async (threadId, thunkAPI) => {
    try {
      await saveBookmark(threadId);
      return threadId;
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const removeBookmarkThunk = createAsyncThunk(
  'bookmarks/remove',
  async (threadId, thunkAPI) => {
    try {
      await removeBookmark(threadId);
      return threadId;
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

// Slice
const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchBookmarksThunk
      .addCase(fetchBookmarksThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarksThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.saved = action.payload;
        state.savedIds = action.payload.map((thread) => thread._id);
      })
      .addCase(fetchBookmarksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // saveBookmarkThunk
      .addCase(saveBookmarkThunk.fulfilled, (state, action) => {
        const threadId = action.payload;
        if (!state.savedIds.includes(threadId)) {
          state.savedIds.push(threadId);
        }
      })
      .addCase(saveBookmarkThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      // removeBookmarkThunk
      .addCase(removeBookmarkThunk.fulfilled, (state, action) => {
        const threadId = action.payload;
        state.savedIds = state.savedIds.filter((id) => id !== threadId);
        state.saved = state.saved.filter((thread) => thread._id !== threadId);
      })
      .addCase(removeBookmarkThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default bookmarkSlice.reducer;

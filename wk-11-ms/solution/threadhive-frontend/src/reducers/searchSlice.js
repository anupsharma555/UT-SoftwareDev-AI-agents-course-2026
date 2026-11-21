// src/reducers/searchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchThreads } from '../services/searchService';
import { handleApiError } from '../utils/handleApiError';

// Initial State
const initialState = {
  results: [],
  query: '',
  loading: false,
  error: null,
};

// Async Thunk
export const searchThreadsThunk = createAsyncThunk(
  'search/searchThreads',
  async (query, thunkAPI) => {
    try {
      return await searchThreads(query);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

// Slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchThreadsThunk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.query = action.meta.arg;
      })
      .addCase(searchThreadsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
        state.query = action.meta.arg;
      })
      .addCase(searchThreadsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default searchSlice.reducer;

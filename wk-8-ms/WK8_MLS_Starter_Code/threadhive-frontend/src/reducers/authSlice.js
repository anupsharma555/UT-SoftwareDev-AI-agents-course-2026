import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  login as loginRequest,
  register as registerRequest,
} from "../services/authService";

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Unable to parse the stored user profile.", error);
    localStorage.removeItem("user");
    return null;
  }
};

const initialState = {
  token: localStorage.getItem("token") || null,
  user: getStoredUser(),
  login: {
    status: "idle",
    error: null,
  },
  registration: {
    status: "idle",
    error: null,
  },
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginRequest(credentials);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed",
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, { rejectWithValue }) => {
    try {
      return await registerRequest(formData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.login = { status: "idle", error: null };
      state.registration = { status: "idle", error: null };
    },
    clearAuthState: (state) => {
      state.login = { status: "idle", error: null };
      state.registration = { status: "idle", error: null };
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.login.status = "pending";
        state.login.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.login.status = "fulfilled";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.status = "rejected";
        state.login.error = action.payload || action.error.message;
      })
      .addCase(registerUser.pending, (state) => {
        state.registration.status = "pending";
        state.registration.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.registration.status = "fulfilled";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registration.status = "rejected";
        state.registration.error = action.payload || action.error.message;
      });
  },
});

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  dispatch(authSlice.actions.logout());
};

export const saveUser = (userData) => (dispatch) => {
  localStorage.setItem("user", JSON.stringify(userData));
  dispatch(authSlice.actions.setUser(userData));
};

export const { clearAuthState, logout, setUser } = authSlice.actions;
export default authSlice.reducer;

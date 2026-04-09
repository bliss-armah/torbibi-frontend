import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, AuthTokens } from '@/lib/api/auth.api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
};

export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (payload: { phone: string; type?: 'login' | 'register' }, { rejectWithValue }) => {
    try {
      return await authApi.requestOtp(payload);
    } catch (error: unknown) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: { phone: string; code: string; type?: 'login' | 'register' }, { rejectWithValue }) => {
    try {
      const tokens = await authApi.verifyOtp(payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        // Persist user separately so providers can rehydrate after a page reload
        localStorage.setItem('user', JSON.stringify(tokens.user));
        // Set a cookie so Next.js middleware can gate /dashboard routes.
        // 7 days — matches JWT_EXPIRES_IN on the backend.
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
      return tokens;
    } catch (error: unknown) {
      return rejectWithValue((error as { message: string }).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthTokens>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Expire the middleware cookie immediately
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

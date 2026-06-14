import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { Page } from "@/lib/schema";

export type PublishStatus =
  | "idle"
  | "publishing"
  | "succeeded"
  | "failed";

export interface PublishResult {
  version: string;
  changes: string[];
  changelog: string;
  idempotent: boolean;
}

export interface PublishState {
  status: PublishStatus;
  lastResult: PublishResult | null;
  error: string | null;
}

const initialState: PublishState = {
  status: "idle",
  lastResult: null,
  error: null,
};

/**
 * POST the current draft to /api/publish. RBAC is enforced server-side;
 * a 403 here means the cookie role isn't `publisher`.
 */
export const publishDraft = createAsyncThunk<
  PublishResult,
  { slug: string; draft: Page },
  { rejectValue: string }
>("publish/publishDraft", async ({ slug, draft }, { rejectWithValue }) => {
  const res = await fetch("/api/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, draft }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return rejectWithValue(text || `Publish failed: ${res.status}`);
  }
  return (await res.json()) as PublishResult;
});

const publishSlice = createSlice({
  name: "publish",
  initialState,
  reducers: {
    clear(state) {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(publishDraft.pending, (state) => {
        state.status = "publishing";
        state.error = null;
      })
      .addCase(
        publishDraft.fulfilled,
        (state, action: PayloadAction<PublishResult>) => {
          state.status = "succeeded";
          state.lastResult = action.payload;
        }
      )
      .addCase(publishDraft.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Publish failed";
      });
  },
});

export const { clear } = publishSlice.actions;
export default publishSlice.reducer;

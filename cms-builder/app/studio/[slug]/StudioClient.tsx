"use client";

import * as React from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { init } from "@/store/slices/draftPageSlice";
import { setRole, dismissToast } from "@/store/slices/uiSlice";
import type { Page } from "@/lib/schema";
import type { Role } from "@/lib/auth/roles";

import { SectionList } from "./_components/SectionList";
import { PropEditor } from "./_components/PropEditor";
import { LivePreview } from "./_components/LivePreview";
import { PublishBar } from "./_components/PublishBar";

interface Props {
  initialPage: Page;
  role: Role | null;
}

export function StudioClient({ initialPage, role }: Props) {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.draftPage.page);
  const toasts = useAppSelector((s) => s.ui.toasts);

  // Initialise the draft if (a) nothing is persisted, or (b) the persisted
  // draft is for a different page than the one the URL refers to.
  React.useEffect(() => {
    if (!current || current.pageId !== initialPage.pageId) {
      dispatch(init(initialPage));
    }
  }, [dispatch, current, initialPage]);

  // Mirror the cookie role into Redux so client-side UI can toggle controls.
  React.useEffect(() => {
    dispatch(setRole(role));
  }, [dispatch, role]);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div
        className="grid flex-1 overflow-hidden"
        style={{ gridTemplateColumns: "minmax(240px, 280px) 1fr minmax(280px, 340px)" }}
      >
        <SectionList />
        <LivePreview />
        <PropEditor />
      </div>
      <PublishBar />

      {/* Toast region — single live region announces new messages. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-20 right-4 flex w-80 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.level === "error" ? "alert" : undefined}
            className={
              "pointer-events-auto rounded-md border p-3 text-sm shadow-md " +
              (t.level === "error"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : t.level === "success"
                  ? "border-green-500/40 bg-green-50 text-green-900"
                  : "border-muted bg-card")
            }
          >
            <div className="flex items-start justify-between gap-2">
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dispatch(dismissToast({ id: t.id }))}
                aria-label="Dismiss notification"
                className="text-xs underline-offset-2 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

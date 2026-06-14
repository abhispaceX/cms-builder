"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { markSaved } from "@/store/slices/draftPageSlice";
import { publishDraft, clear } from "@/store/slices/publishSlice";
import { pushToast } from "@/store/slices/uiSlice";
import { can } from "@/lib/auth/roles";

export function PublishBar() {
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.ui.role);
  const page = useAppSelector((s) => s.draftPage.page);
  const dirty = useAppSelector((s) => s.draftPage.dirty);
  const status = useAppSelector((s) => s.publish.status);
  const lastResult = useAppSelector((s) => s.publish.lastResult);
  const error = useAppSelector((s) => s.publish.error);

  if (!page) return null;

  const canPublish = can(role, "publish");
  const publishing = status === "publishing";

  const onPublish = async () => {
    if (!page) return;
    const result = await dispatch(publishDraft({ slug: page.slug, draft: page }));
    if (publishDraft.fulfilled.match(result)) {
      dispatch(markSaved());
      dispatch(
        pushToast({
          level: result.payload.idempotent ? "info" : "success",
          message: result.payload.idempotent
            ? `No changes — still at v${result.payload.version}.`
            : `Published v${result.payload.version}.`,
        })
      );
    } else {
      dispatch(
        pushToast({
          level: "error",
          message: (result.payload as string) ?? "Publish failed.",
        })
      );
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-t bg-card px-4 py-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span aria-live="polite">
          {dirty ? "Unsaved changes (auto-persisted locally)" : "All saved"}
        </span>
        {lastResult ? (
          <span className="font-mono text-xs">
            Last release: v{lastResult.version}
          </span>
        ) : null}
        {error ? (
          <span role="alert" className="text-destructive">
            {error}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {error ? (
          <Button variant="ghost" size="sm" onClick={() => dispatch(clear())}>
            Dismiss
          </Button>
        ) : null}
        <Button
          onClick={onPublish}
          disabled={!canPublish || publishing}
          aria-disabled={!canPublish || publishing}
          title={
            !canPublish
              ? "Only the publisher role can publish"
              : undefined
          }
        >
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Publishing…
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>
    </div>
  );
}

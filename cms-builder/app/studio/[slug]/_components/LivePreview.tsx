"use client";

import { SectionRenderer } from "@/components/SectionRenderer";
import { useAppSelector } from "@/store/hooks";
import { asEnvelopes } from "@/store/slices/draftPageSlice";

export function LivePreview() {
  const page = useAppSelector((s) => s.draftPage.page);

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-sm text-muted-foreground">
        No draft loaded.
      </div>
    );
  }

  const envelopes = asEnvelopes(page);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Live preview — <span className="font-mono normal-case">/{page.slug}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <h1 className="sr-only">{page.title}</h1>
        <SectionRenderer sections={envelopes} />
      </div>
    </div>
  );
}

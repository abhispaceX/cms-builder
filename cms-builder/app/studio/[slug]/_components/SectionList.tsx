"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addSection,
  moveSection,
  removeSection,
} from "@/store/slices/draftPageSlice";
import { selectSection } from "@/store/slices/uiSlice";
import {
  sectionRegistry,
  type RegisteredSectionType,
} from "@/lib/sectionRegistry";

const TYPES = Object.keys(sectionRegistry) as RegisteredSectionType[];

export function SectionList() {
  const dispatch = useAppDispatch();
  const sections = useAppSelector((s) => s.draftPage.page?.sections ?? []);
  const selectedId = useAppSelector((s) => s.ui.selectedSectionId);

  return (
    <aside
      aria-label="Section list"
      className="flex h-full w-full flex-col border-r bg-card text-card-foreground"
    >
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </h2>
      </div>

      <ol className="flex-1 overflow-y-auto p-2" aria-live="polite">
        {sections.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">
            No sections yet. Add one below.
          </li>
        ) : null}
        {sections.map((s, idx) => {
          const isSelected = selectedId === s.id;
          const label = sectionRegistry[s.type as RegisteredSectionType]?.label ?? s.type;
          return (
            <li key={s.id} className="mb-1">
              <div
                className={
                  "flex items-center gap-1 rounded-md border p-2 " +
                  (isSelected
                    ? "border-ring bg-accent"
                    : "border-transparent hover:bg-accent/50")
                }
              >
                <button
                  type="button"
                  onClick={() => dispatch(selectSection(s.id))}
                  className="flex-1 text-left text-sm"
                  aria-pressed={isSelected}
                >
                  <span className="block font-medium">{label}</span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {s.id}
                  </span>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move ${label} up`}
                  disabled={idx === 0}
                  onClick={() =>
                    dispatch(moveSection({ id: s.id, direction: "up" }))
                  }
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move ${label} down`}
                  disabled={idx === sections.length - 1}
                  onClick={() =>
                    dispatch(moveSection({ id: s.id, direction: "down" }))
                  }
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${label}`}
                  onClick={() => {
                    if (isSelected) dispatch(selectSection(null));
                    dispatch(removeSection({ id: s.id }));
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add section
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <Button
              key={t}
              size="sm"
              variant="outline"
              onClick={() => dispatch(addSection({ type: t }))}
            >
              <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
              {sectionRegistry[t].label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}

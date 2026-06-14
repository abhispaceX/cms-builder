"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updatePageMeta,
  updateProps,
} from "@/store/slices/draftPageSlice";
import { sectionRegistry, type RegisteredSectionType } from "@/lib/sectionRegistry";

/**
 * Limited prop editor per brief: Hero text, CTA label + URL.
 * Page title is also editable as it's the most common content-team request.
 * Other section types show a read-only notice; their props can still be
 * authored in Contentful and they render fine.
 */
export function PropEditor() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.ui.selectedSectionId);
  const page = useAppSelector((s) => s.draftPage.page);
  const section = page?.sections.find((s) => s.id === selectedId) ?? null;

  if (!page) return null;

  return (
    <section
      aria-label="Properties"
      className="flex h-full w-full flex-col bg-card text-card-foreground"
    >
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Properties
        </h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Page</legend>
          <div className="space-y-1">
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              value={page.title}
              onChange={(e) =>
                dispatch(updatePageMeta({ title: e.target.value }))
              }
            />
          </div>
        </fieldset>

        {section ? (
          <SectionEditor key={section.id} sectionId={section.id} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a section to edit its props.
          </p>
        )}
      </div>
    </section>
  );
}

function SectionEditor({ sectionId }: { sectionId: string }) {
  const dispatch = useAppDispatch();
  const section = useAppSelector((s) =>
    s.draftPage.page?.sections.find((sec) => sec.id === sectionId)
  );
  if (!section) return null;

  const entryLabel =
    sectionRegistry[section.type as RegisteredSectionType]?.label ??
    section.type;
  const props = section.props as Record<string, unknown>;

  const setProp = (key: string, value: unknown) =>
    dispatch(updateProps({ id: section.id, props: { [key]: value } }));

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{entryLabel}</legend>

      {section.type === "hero" ? (
        <>
          <Field
            id="hero-heading"
            label="Heading"
            value={(props.heading as string) ?? ""}
            onChange={(v) => setProp("heading", v)}
            required
          />
          <Field
            id="hero-subheading"
            label="Sub-heading"
            value={(props.subheading as string) ?? ""}
            onChange={(v) => setProp("subheading", v)}
            multiline
          />
          <Field
            id="hero-cta-label"
            label="CTA label"
            value={(props.ctaLabel as string) ?? ""}
            onChange={(v) => setProp("ctaLabel", v)}
          />
          <Field
            id="hero-cta-href"
            label="CTA URL"
            value={(props.ctaHref as string) ?? ""}
            onChange={(v) => setProp("ctaHref", v)}
            inputMode="url"
          />
        </>
      ) : null}

      {section.type === "cta" ? (
        <>
          <Field
            id="cta-label"
            label="Label"
            value={(props.label as string) ?? ""}
            onChange={(v) => setProp("label", v)}
            required
          />
          <Field
            id="cta-href"
            label="URL"
            value={(props.href as string) ?? ""}
            onChange={(v) => setProp("href", v)}
            inputMode="url"
            required
          />
        </>
      ) : null}

      {section.type === "featureGrid" ? (
        <Field
          id="feature-heading"
          label="Heading"
          value={(props.heading as string) ?? ""}
          onChange={(v) => setProp("heading", v)}
          required
        />
      ) : null}

      {section.type === "testimonial" ? (
        <>
          <Field
            id="testimonial-quote"
            label="Quote"
            value={(props.quote as string) ?? ""}
            onChange={(v) => setProp("quote", v)}
            multiline
            required
          />
          <Field
            id="testimonial-author"
            label="Author"
            value={(props.author as string) ?? ""}
            onChange={(v) => setProp("author", v)}
            required
          />
        </>
      ) : null}
    </fieldset>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  multiline,
  inputMode,
}: FieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-label="required"> *</span> : null}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          aria-required={required || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          inputMode={inputMode}
          aria-required={required || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

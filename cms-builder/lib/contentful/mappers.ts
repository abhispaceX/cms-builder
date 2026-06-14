import {
  UnknownSectionEnvelopeSchema,
  RawPageSchema,
  type RawPage,
} from "@/lib/schema";

/**
 * Map a raw Contentful Page entry to our domain `RawPage` (sections kept as
 * unknown envelopes so the SectionRenderer can decide per-section how to render).
 *
 * Note: per the build plan we alias the Contentful `slug` to `pageId` — there
 * is no separate `pageId` field on the Contentful Page content type.
 */
export function mapContentfulPage(entry: {
  sys: { id: string };
  fields: { slug: string; title: string; sections?: unknown };
}): RawPage {
  const sectionsRaw = Array.isArray(entry.fields.sections)
    ? entry.fields.sections
    : [];

  // Validate each section envelope individually so a malformed one doesn't
  // void the whole page. Bad envelopes are dropped with a warning.
  const sections = sectionsRaw.flatMap((s, idx) => {
    const parsed = UnknownSectionEnvelopeSchema.safeParse(s);
    if (!parsed.success) {
      console.warn(
        `[contentful] Dropping malformed section at index ${idx} of "${entry.fields.slug}":`,
        parsed.error.issues
      );
      return [];
    }
    return [parsed.data];
  });

  return RawPageSchema.parse({
    // Alias: slug doubles as pageId until a dedicated field is added in CMA.
    pageId: entry.fields.slug,
    slug: entry.fields.slug,
    title: entry.fields.title,
    sections,
  });
}

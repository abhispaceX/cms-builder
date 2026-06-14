import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";

import { getPage } from "@/lib/contentful/contentfulClient";
import { SectionRenderer } from "@/components/SectionRenderer";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

// The preview path is a live read against Contentful; never statically cache.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { isEnabled } = await draftMode();
    const page = await getPage(slug, { preview: isEnabled });
    if (!page) return { title: "Page not found" };
    return {
      title: page.title,
      description: `Preview of ${page.title}`,
    };
  } catch {
    return { title: "Preview" };
  }
}

export default async function PreviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { isEnabled: isDraft } = await draftMode();

  let page;
  try {
    page = await getPage(slug, { preview: isDraft });
  } catch (e) {
    return (
      <main
        id="main"
        className="mx-auto max-w-2xl px-6 py-24 text-center"
        role="alert"
      >
        <h1 className="text-2xl font-semibold">Could not load page</h1>
        <p className="mt-2 text-muted-foreground">
          {e instanceof Error ? e.message : "Unknown error."}
        </p>
      </main>
    );
  }

  if (!page) {
    notFound();
  }

  return (
    <main id="main" className="flex-1">
      {isDraft ? (
        <div
          role="status"
          className="bg-amber-100 px-6 py-2 text-center text-sm font-medium text-amber-900"
        >
          Preview (draft) mode — content may differ from published.
        </div>
      ) : null}
      <SectionErrorBoundary>
        <SectionRenderer sections={page.sections} />
      </SectionErrorBoundary>
    </main>
  );
}

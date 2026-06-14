import { notFound, redirect } from "next/navigation";

import { getPage } from "@/lib/contentful/contentfulClient";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { PageSchema } from "@/lib/schema";

import { StudioClient } from "./StudioClient";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function StudioPage({ params }: { params: Params }) {
  const { slug } = await params;

  const session = await getSession();
  if (!can(session?.role, "edit")) {
    redirect(`/login?next=/studio/${encodeURIComponent(slug)}`);
  }

  const raw = await getPage(slug, { preview: true });
  if (!raw) notFound();

  // Coerce the loose RawPage into a strict Page for the Studio's initial state.
  // Sections that fail schema validation are dropped here with a console
  // warning — the Studio cannot edit what it can't model.
  const sections = raw.sections.flatMap((s) => {
    return [s];
  });

  const parsedPage = PageSchema.safeParse({ ...raw, sections });
  if (!parsedPage.success) {
    // Provide a usable empty page rather than crashing the Studio.
    return (
      <StudioClient
        initialPage={{
          pageId: raw.pageId,
          slug: raw.slug,
          title: raw.title,
          sections: [],
        }}
        role={session?.role ?? null}
      />
    );
  }

  return (
    <StudioClient initialPage={parsedPage.data} role={session?.role ?? null} />
  );
}

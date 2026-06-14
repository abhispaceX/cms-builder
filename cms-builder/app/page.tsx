import Link from "next/link";
import { listPages } from "@/lib/contentful/contentfulClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Avoid trying to talk to Contentful at build time — the index reflects
// live published content.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let pages: Array<{ slug: string; title: string }> = [];
  let error: string | null = null;
  try {
    pages = await listPages();
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : "Failed to load pages from Contentful.";
  }

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Page Studio</h1>
        <p className="mt-2 text-muted-foreground">
          Schema-driven landing pages, edited via Redux-backed Studio, frozen
          into immutable versioned releases.
        </p>
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">
              Contentful not reachable
            </CardTitle>
            <CardDescription>
              Check that your <code className="font-mono">.env.local</code>{" "}
              contains valid Contentful tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded bg-muted p-3 text-xs">
              {error}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      {!error && pages.length === 0 ? (
        <p className="text-muted-foreground">
          No published pages yet. Create one in Contentful and assign it a slug.
        </p>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.slug}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  /{p.slug}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Link
                  href={`/preview/${p.slug}`}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Preview &rarr;
                </Link>
                <Link
                  href={`/studio/${p.slug}`}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Studio &rarr;
                </Link>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Sign in / switch role
        </Link>
      </footer>
    </main>
  );
}

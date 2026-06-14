import { NextResponse } from "next/server";

// Defense in depth: proxy.ts already gates this route to `publisher`,
// but we re-check the cookie here in case proxy was bypassed (e.g., dev
// flag) or the matcher is misconfigured.
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { publish } from "@/lib/publish";

export async function POST(req: Request) {
  const session = await getSession();
  if (!can(session?.role, "publish")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug =
    typeof body === "object" && body !== null
      ? (body as { slug?: unknown }).slug
      : undefined;
  const draft =
    typeof body === "object" && body !== null
      ? (body as { draft?: unknown }).draft
      : undefined;

  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const result = await publish(slug, draft);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

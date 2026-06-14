import "server-only";

import type { Page } from "@/lib/schema";
import { PageSchema } from "@/lib/schema";

import { diffPages, pagesEqual } from "./diff";
import { bumpVersion } from "./version";
import { formatChangelog } from "./changelog";
import {
  readLatestLocalSnapshot,
  writeLocalSnapshot,
  type SnapshotFile,
} from "./snapshot";
import {
  createReleaseEntry,
  getLatestRelease,
} from "@/lib/contentful/managementClient";

export interface PublishOutcome {
  version: string;
  changes: string[];
  changelog: string;
  /** True when the draft equalled the latest release → no new version cut. */
  idempotent: boolean;
}

/**
 * Resolve "what is the current latest release for this slug?" Prefers
 * Contentful (durable, multi-host) and falls back to local snapshots so
 * the dev loop works without a CMA round-trip.
 */
async function resolveLatest(
  slug: string
): Promise<{ version: string; snapshot: Page } | null> {
  try {
    const remote = await getLatestRelease(slug);
    if (remote) return remote;
  } catch (e) {
    // Don't fail publish if CMA list endpoint is unavailable; fall back to FS.
    console.warn("[publish] getLatestRelease failed; falling back to FS:", e);
  }
  const local = await readLatestLocalSnapshot(slug);
  if (!local) return null;
  return { version: local.version, snapshot: local.snapshot };
}

/**
 * Idempotent publish orchestrator.
 *
 * 1. Validate the draft (defense in depth — server actions are RBAC-gated but
 *    not type-gated).
 * 2. Find the latest existing release (Contentful, fallback to local FS).
 * 3. If the draft equals the latest release snapshot → return that version
 *    with `idempotent: true`. No new entry is written.
 * 4. Otherwise compute a deterministic diff, choose the SemVer bump, and:
 *    - Write `releases/<slug>/<version>.json` (immutable on disk)
 *    - Create a published `Release` entry in Contentful
 * 5. Return the new version + changelog.
 */
export async function publish(
  slug: string,
  draftInput: unknown
): Promise<PublishOutcome> {
  const draft = PageSchema.parse(draftInput);
  if (draft.slug !== slug) {
    throw new Error(
      `Draft slug "${draft.slug}" does not match request slug "${slug}"`
    );
  }

  const latest = await resolveLatest(slug);

  if (latest && pagesEqual(latest.snapshot, draft)) {
    return {
      version: latest.version,
      changes: [],
      changelog: formatChangelog(latest.version, []),
      idempotent: true,
    };
  }

  const { bump, changes } = diffPages(latest?.snapshot ?? null, draft);
  // First publish ever: bump === "none" but we still need to ship 1.0.0.
  const nextVersion = latest ? bumpVersion(latest.version, bump) : bumpVersion(null, bump);

  // bumpVersion(currentVersion, 'none') returns the same version — meaning
  // there are no observable diffs but the snapshot somehow differs (key
  // ordering, etc.). Re-equality-check defensively so we don't overwrite.
  if (latest && nextVersion === latest.version) {
    return {
      version: latest.version,
      changes: [],
      changelog: formatChangelog(latest.version, []),
      idempotent: true,
    };
  }

  const publishedAt = new Date().toISOString();
  const changelog = formatChangelog(nextVersion, changes);

  const snapshotFile: SnapshotFile = {
    version: nextVersion,
    publishedAt,
    snapshot: draft,
    changelog,
  };

  // Write FS first — it's local and fast; failure surfaces before we call CMA.
  await writeLocalSnapshot(slug, snapshotFile);

  // Then mirror to Contentful so the deployed app sees it.
  try {
    await createReleaseEntry({
      pageSlug: slug,
      version: nextVersion,
      snapshot: draft,
      changelog,
      publishedAt,
    });
  } catch (e) {
    // Local snapshot is already on disk; surface to caller but don't crash.
    console.error("[publish] createReleaseEntry failed:", e);
    throw new Error(
      `Snapshot written locally but Contentful Release entry creation failed: ${
        e instanceof Error ? e.message : "unknown"
      }`
    );
  }

  return {
    version: nextVersion,
    changes: changes.map((c) => c.message),
    changelog,
    idempotent: false,
  };
}

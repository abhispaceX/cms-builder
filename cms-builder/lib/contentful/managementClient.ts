import "server-only";
import { createClient, type PlainClientAPI } from "contentful-management";

import { env } from "@/lib/utils/env";
import type { Page } from "@/lib/schema";

const RELEASE_CONTENT_TYPE = "release";

let cached: PlainClientAPI | null = null;

function getClient(): PlainClientAPI {
  if (cached) return cached;
  cached = createClient(
    { accessToken: env.contentful.managementToken },
    { type: "plain" }
  );
  return cached;
}

function scope() {
  return {
    spaceId: env.contentful.spaceId,
    environmentId: env.contentful.environment,
  };
}

export interface CreateReleaseInput {
  pageSlug: string;
  version: string;
  snapshot: Page;
  changelog: string;
  publishedAt: string;
}

/**
 * Create an immutable Release entry in Contentful. Releases are versioned
 * snapshots; once created they are not mutated by the app. The Contentful
 * "Release" content type must have fields:
 *   - pageSlug   (Short text, required)
 *   - version    (Short text, required, e.g. "1.2.0")
 *   - snapshot   (JSON object, required) — the frozen Page
 *   - changelog  (Long text)
 *   - publishedAt (Date & time)
 */
export async function createReleaseEntry(
  input: CreateReleaseInput
): Promise<{ id: string }> {
  const client = getClient();
  const { spaceId, environmentId } = scope();

  const entry = await client.entry.create(
    { spaceId, environmentId, contentTypeId: RELEASE_CONTENT_TYPE },
    {
      fields: {
        pageSlug: { "en-US": input.pageSlug },
        version: { "en-US": input.version },
        snapshot: { "en-US": input.snapshot },
        changelog: { "en-US": input.changelog },
        publishedAt: { "en-US": input.publishedAt },
      },
    }
  );

  const published = await client.entry.publish(
    { spaceId, environmentId, entryId: entry.sys.id },
    entry
  );
  return { id: published.sys.id };
}

/**
 * Read the latest Release entry for a slug. Used to compute SemVer diffs
 * against the most recent published snapshot.
 */
export async function getLatestRelease(
  pageSlug: string
): Promise<{ version: string; snapshot: Page } | null> {
  const client = getClient();
  const { spaceId, environmentId } = scope();

  const res = await client.entry.getMany({
    spaceId,
    environmentId,
    query: {
      content_type: RELEASE_CONTENT_TYPE,
      "fields.pageSlug": pageSlug,
      order: "-fields.publishedAt",
      limit: 1,
    },
  });

  const entry = res.items[0];
  if (!entry) return null;

  const fields = entry.fields as {
    version?: { "en-US"?: string };
    snapshot?: { "en-US"?: Page };
  };
  const version = fields.version?.["en-US"];
  const snapshot = fields.snapshot?.["en-US"];
  if (!version || !snapshot) return null;

  return { version, snapshot };
}

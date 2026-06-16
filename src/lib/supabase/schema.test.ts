import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260609000000_initial_schema.sql",
);
const publicLandingMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260616001000_public_landing_preview.sql",
);
const securityHardeningMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260616002000_security_hardening.sql",
);

function readMigration() {
  return readFileSync(migrationPath, "utf8").toLowerCase();
}

describe("Supabase schema", () => {
  it("defines every database object used by the web MVP", () => {
    const migration = readMigration();

    for (const relation of [
      "profiles",
      "cars",
      "wash_logs",
      "wash_steps",
      "wash_images",
      "routine_recommendations",
      "reactions",
    ]) {
      expect(migration).toContain(`create table public.${relation}`);
      expect(migration).toContain(`alter table public.${relation} enable row level security`);
    }

    expect(migration).toContain("create view public.community_profiles");
    expect(migration).toContain("create trigger on_auth_user_created_profile");
    expect(migration).toContain("'wash-images'");
  });

  it("keeps community nickname lookups separate from private profiles", () => {
    for (const page of [
      "src/app/(app)/community/page.tsx",
      "src/app/(app)/community/[washLogId]/page.tsx",
      "src/app/(app)/bookmarks/page.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), page), "utf8");

      expect(source).toContain('.from("community_profiles")');
      expect(source).not.toContain('.from("profiles")');
    }
  });

  it("limits anonymous landing preview reads to public community data", () => {
    const migration = readFileSync(publicLandingMigrationPath, "utf8").toLowerCase();

    expect(migration).toContain("grant select on public.community_profiles to anon");
    expect(migration).toContain("public wash logs are readable by anonymous visitors");
    expect(migration).toContain("visibility = 'public'");
    expect(migration).toContain("public wash images are readable by anonymous visitors");
    expect(migration).toContain("public cars are readable by anonymous visitors");
  });

  it("hardens public profile, private wash image storage, and routine quota support", () => {
    const migration = readFileSync(securityHardeningMigrationPath, "utf8").toLowerCase();

    expect(migration).toContain("where exists");
    expect(migration).toContain("wash_logs.visibility = 'public'");
    expect(migration).toContain("where id = 'wash-images'");
    expect(migration).toContain("public = false");
    expect(migration).toContain("allowed_mime_types");
    expect(migration).toContain("image/webp");
    expect(migration).toContain("public wash image objects are readable by anonymous visitors");
    expect(migration).toContain("routine_recommendations_user_recent_idx");
  });
});

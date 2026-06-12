import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260609000000_initial_schema.sql",
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
});

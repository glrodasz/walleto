import fs from "fs";
import path from "path";

const PAGES_DIR = path.join(process.cwd(), "pages");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

describe("pages directory", () => {
  // Next.js treats every file under pages/ as a route, so a colocated
  // *.test.tsx gets built as a page and fails with "jest is not defined",
  // and a *.stories.tsx becomes a route too. Page-level tests belong in
  // __tests__/pages/; page bodies live in features/ so stories sit there.
  it("contains no test or story files", () => {
    const offenders = walk(PAGES_DIR)
      .filter((f) => /\.(test|spec|stories)\.[jt]sx?$/.test(f))
      .map((f) => path.relative(process.cwd(), f));

    expect(offenders).toEqual([]);
  });
});

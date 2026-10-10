import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "node_modules/tsx/dist/cli.mjs");
const run = (script: string, ...args: string[]) =>
  spawnSync(process.execPath, [cli, join(root, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 10000,
  });

it("validator CLI reports success, schema output, invalid packages and usage errors", () => {
  expect(
    run("validate-roadmap.ts", "examples/beginner-python.json").status
  ).toBe(0);
  const schema = run("validate-roadmap.ts", "--json-schema");
  expect(schema.status).toBe(0);
  expect(JSON.parse(schema.stdout)).toMatchObject({
    type: "object",
    additionalProperties: false,
  });
  expect(run("validate-roadmap.ts", "examples/invalid-cycle.json").status).toBe(
    1
  );
  expect(run("validate-roadmap.ts", "--unknown").status).toBe(2);
  expect(run("validate-roadmap.ts", "examples/missing.json").status).toBe(1);
});

it("migration CLI preserves original data and refuses to overwrite staging", () => {
  const directory = mkdtempSync(join(tmpdir(), "semassist-migration-"));
  const output = join(directory, "staged.json");
  try {
    expect(
      run(
        "prepare-legacy-migration.ts",
        "examples/legacy-progress.json",
        output
      ).status
    ).toBe(0);
    const before = readFileSync(output, "utf8");
    expect(JSON.parse(before).originalBackupJson).toBe(
      readFileSync(join(root, "examples/legacy-progress.json"), "utf8")
    );
    expect(
      run(
        "prepare-legacy-migration.ts",
        "examples/legacy-progress.json",
        output
      ).status
    ).toBe(1);
    expect(readFileSync(output, "utf8")).toBe(before);
    expect(
      run(
        "prepare-legacy-migration.ts",
        "examples/invalid-cycle.json",
        join(directory, "invalid.json")
      ).status
    ).toBe(1);
    expect(run("prepare-legacy-migration.ts").status).toBe(2);
  } finally {
    if (existsSync(output)) unlinkSync(output);
    rmdirSync(directory);
  }
});

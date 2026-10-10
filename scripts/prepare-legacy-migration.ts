import { readFile, stat, writeFile } from "node:fs/promises";
import {
  DEFAULT_MAX_BYTES,
  prepareLegacyMigration,
} from "../packages/roadmap-schema/src/index";

const args = process.argv.slice(2);
if (args.length !== 2 || args.some(arg => arg.startsWith("--"))) {
  console.error(
    "Usage: npm run roadmap:migrate -- <legacy-backup.json> <staging.json>"
  );
  process.exitCode = 2;
} else {
  try {
    if ((await stat(args[0])).size > DEFAULT_MAX_BYTES)
      throw new Error("Legacy backup exceeds 5 MiB");
    const staged = prepareLegacyMigration(await readFile(args[0], "utf8"));
    // Exclusive creation protects both the original backup and previous staging files.
    await writeFile(args[1], JSON.stringify(staged, null, 2), { flag: "wx" });
    console.log(
      `Staged ${staged.checkpointProgress.length} checkpoint records; original backup retained. No app data changed.`
    );
    staged.warnings.forEach(message => console.warn(message));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

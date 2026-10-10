import { readFile, stat } from "node:fs/promises";
import {
  DEFAULT_MAX_BYTES,
  packageJsonSchema,
  parsePackageJson,
} from "../packages/roadmap-schema/src/index";

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--json-schema") {
  console.log(JSON.stringify(packageJsonSchema(), null, 2));
} else if (args.length !== 1 || args[0].startsWith("--")) {
  console.error(
    "Usage: npm run roadmap:validate -- <package.json> | --json-schema"
  );
  process.exitCode = 2;
} else {
  try {
    if ((await stat(args[0])).size > DEFAULT_MAX_BYTES)
      throw new Error("Package exceeds 5 MiB");
    const result = parsePackageJson(await readFile(args[0], "utf8"));
    if (!result.success) {
      result.errors.forEach(issue =>
        console.error(`${issue.path || "$"}: ${issue.message}`)
      );
      process.exitCode = 1;
    } else {
      console.log(`Valid roadmap package: ${result.data.roadmap.title}`);
      result.warnings.forEach(issue =>
        console.warn(`${issue.path}: ${issue.message}`)
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { packageJsonSchema } from "../packages/roadmap-schema/src/index";
const root = "dist/skills/semassist";
for (const directory of [root, `${root}/scripts`, `${root}/references`, `${root}/examples`]) await mkdir(directory, { recursive: true });
await build({ entryPoints: ["scripts/validate-roadmap.ts"], outfile: `${root}/scripts/validate.mjs`, bundle: true, platform: "node", format: "esm", target: "node20" });
for (const [source, target] of [
  ["skills/semassist/SKILL.md", `${root}/SKILL.md`],
  ["skills/semassist/README.md", `${root}/README.md`],
  ["docs/ROADMAP_CONTRACT.md", `${root}/references/ROADMAP_CONTRACT.md`],
  ["docs/BACKUP_REPLAN.md", `${root}/references/BACKUP_REPLAN.md`],
  ["examples/beginner-python.json", `${root}/examples/beginner-python.json`],
  ["examples/replanned-python.json", `${root}/examples/replanned-python.json`],
  ["node_modules/zod/LICENSE", `${root}/references/ZOD-LICENSE`],
]) await copyFile(source, target);
await writeFile(`${root}/references/roadmap.schema.json`, JSON.stringify(packageJsonSchema(), null, 2));
console.log(`Independent skill ready: ${root}. Copy this folder into your agent's skills directory.`);

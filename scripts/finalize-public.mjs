import { copyFile } from "node:fs/promises";

// Serve the product directly at / even when the host resolves index.html before rewrites.
await copyFile("dist/public/study-dashboard.html", "dist/public/index.html");

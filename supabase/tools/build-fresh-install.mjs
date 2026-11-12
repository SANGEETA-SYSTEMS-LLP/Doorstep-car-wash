import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chunks = [
  "-- GENERATED FILE. New, empty Supabase projects only. Do not replay on a live database.\n",
  "-- Source of truth: setup/*.sql, then migrations/*.sql in filename order.\n",
];

for (const folder of ["setup", "migrations"]) {
  const files = (await readdir(path.join(root, folder))).filter((name) => name.endsWith(".sql")).sort();
  if (!files.length) throw new Error(`No SQL files found in supabase/${folder}.`);
  for (const name of files) {
    chunks.push(`\n\n-- ===== ${folder}/${name} =====\n`);
    chunks.push(await readFile(path.join(root, folder, name), "utf8"));
  }
}

await mkdir(root, { recursive: true });
await writeFile(path.join(root, "FRESH_INSTALL.sql"), chunks.join("\n"), "utf8");
console.log(`Wrote ${path.join(root, "FRESH_INSTALL.sql")}`);

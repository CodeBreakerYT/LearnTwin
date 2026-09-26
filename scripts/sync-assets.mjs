// Copies the VRM character models from ../assets into public/models so Next.js can serve them.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "..", "assets");
const dest = join(root, "public", "models");

if (!existsSync(src)) {
  console.warn(`[sync-assets] ${src} not found, characters will use the CSS fallback avatars.`);
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.toLowerCase().endsWith(".vrm"));
for (const f of files) cpSync(join(src, f), join(dest, f));
console.log(`[sync-assets] copied ${files.length} VRM model(s) to public/models`);

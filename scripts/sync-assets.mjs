// Copies VRM character models from ../assets into public/models when that folder exists (the original repo layout).
// When the models are already bundled in public/models (for example in a source zip), there is nothing to do.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "..", "assets");
const dest = join(root, "public", "models");
const bundled = existsSync(dest) && readdirSync(dest).some((f) => f.toLowerCase().endsWith(".vrm"));

if (!existsSync(src)) {
  if (!bundled) console.warn("[sync-assets] no character models found; the app will use simple fallback avatars.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.toLowerCase().endsWith(".vrm"));
for (const f of files) cpSync(join(src, f), join(dest, f));
console.log(`[sync-assets] copied ${files.length} VRM model(s) to public/models`);

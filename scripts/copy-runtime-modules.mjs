import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = "/app/node_modules";
const out = "/app/runtime-modules";
const seen = new Set();

function copyTree(name) {
  if (seen.has(name)) {
    return;
  }
  seen.add(name);
  const src = path.join(root, name);
  if (!existsSync(src)) {
    console.warn(`Missing runtime package: ${name}`);
    return;
  }
  const dest = path.join(out, name);
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true, dereference: true });
  const manifest = path.join(src, "package.json");
  if (!existsSync(manifest)) {
    return;
  }
  const pkg = JSON.parse(readFileSync(manifest, "utf8"));
  for (const dependency of Object.keys(pkg.dependencies ?? {})) {
    copyTree(dependency);
  }
}

copyTree(".prisma");
for (const name of ["@prisma/client", "@prisma/adapter-pg", "pg"]) {
  copyTree(name);
}

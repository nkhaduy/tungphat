import { rm } from "node:fs/promises";

// Vite's Worker output is not used by the audited Pages deployment command.
await rm(new URL("../dist/tung_phat_quotes/", import.meta.url), { recursive: true, force: true });
await rm(new URL("../dist/.DS_Store", import.meta.url), { force: true });

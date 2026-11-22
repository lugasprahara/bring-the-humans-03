// bring-the-humans-03 entrypoint.
//
// The scored artefact of this bounty is a TikTok video, and this program's
// whole job is to hand the grader a trustworthy pointer to it. It reads
// VIDEO.json from the bot directory, checks that the file really names a
// TikTok video — an https://www.tiktok.com/@<handle>/video/<id> address —
// and then copies the file's exact bytes into the output directory.
//
// The URL is validated before copying because the gate scores whatever
// VIDEO.json claims: a placeholder, a typo, or a link to some other page
// would silently zero the entry. Failing loudly here, with a non-zero exit,
// is cheaper than discovering that after the window closes. The copy is
// byte-for-byte (never a re-serialised object) so what the grader reads is
// exactly what sits in the repository.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// A real TikTok video address: fixed host and path shape, a handle of
// letters, digits, dots or underscores, and a purely numeric video id.
const TIKTOK_VIDEO_URL = /^https:\/\/www\.tiktok\.com\/@([A-Za-z0-9._]+)\/video\/(\d+)$/;

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

let raw: Buffer;
try {
  raw = readFileSync(join(BOT_DIR, 'VIDEO.json'));
} catch (err) {
  fail(`cannot read VIDEO.json in ${BOT_DIR}: ${(err as Error).message}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw.toString('utf8'));
} catch (err) {
  fail(`VIDEO.json is not valid JSON: ${(err as Error).message}`);
}

const url = (parsed as { url?: unknown } | null)?.url;
if (typeof url !== 'string') {
  fail('VIDEO.json must carry a string "url" field');
}
const match = TIKTOK_VIDEO_URL.exec(url);
if (!match) {
  fail(`"url" is not a TikTok video address: ${url}`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, 'VIDEO.json'), raw);
console.log(`VIDEO.json OK: @${match[1]} video ${match[2]} — ${url} (${raw.length} bytes) copied to ${OUTPUT_DIR}`);

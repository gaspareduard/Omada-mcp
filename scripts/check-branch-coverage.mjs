#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const summary = JSON.parse(readFileSync(new URL('../coverage/coverage-summary.json', import.meta.url), 'utf8'));
const percent = summary.total?.branches?.pct;
if (typeof percent !== 'number' || !Number.isFinite(percent) || percent < 70) {
    throw new Error(`Global branch coverage must be at least 70%; received ${percent}`);
}
console.log(`Global branch coverage: ${percent}% (minimum 70%).`);

'use strict';
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const directory of ['assets', 'api', 'server']) {
  for (const name of readdirSync(directory).sort()) {
    if (name.endsWith('.js')) run(['--check', join(directory, name)]);
  }
}
const tests = readdirSync('tests').filter(name => name.endsWith('.test.cjs')).sort();
if (!tests.length) throw new Error('No tests found; refusing deployment.');
run(['--test', ...tests.map(name => join('tests', name))]);

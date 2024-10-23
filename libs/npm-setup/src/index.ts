#!/usr/bin/env node

import * as fs from 'fs';

if (process.argv.length === 2) {
  console.error('Expected at least one argument!');
  process.exit(1);
}

if (process.argv[2]) {
  const token: string = process.argv[2];
  const content = ['@mapgrab-priv:registry=https://r.privjs.com', `//r.privjs.com/:_authToken=${token}`, ''].join('\n');

  fs.appendFileSync('.npmrc', content);

  console.log('🚀🎉🎉🎉 \x1b[32m npm configured successfully \x1b[0m 🎉🎉🎉🚀');
}

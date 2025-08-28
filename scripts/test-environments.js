#!/usr/bin/env node

import { spawn } from 'child_process';

const environment = process.argv[2];
const headed = process.argv.includes('--headed');

if (!environment || !['staging', 'production'].includes(environment)) {
  console.log('Usage: node scripts/test-environments.js <staging|production> [--headed]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/test-environments.js staging');
  console.log('  node scripts/test-environments.js staging --headed');
  console.log('  node scripts/test-environments.js production');
  console.log('  node scripts/test-environments.js production --headed');
  process.exit(1);
}

const configFile = `playwright-${environment}.config.ts`;
const args = ['playwright', 'test', '--config', configFile];

if (headed) {
  args.push('--headed');
}

console.log(`🧪 Running ${environment} tests ${headed ? '(headed)' : '(headless)'}`);
console.log(`Command: npx ${args.join(' ')}`);

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`\n${environment} tests completed with code ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error(`Error running ${environment} tests:`, error);
  process.exit(1);
});
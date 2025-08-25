#!/usr/bin/env node

// Simple test runner script
// Usage: node run-tests.js [test-pattern]

const { spawn } = require('child_process');

const testPattern = process.argv[2] || '';
const command = 'npx';
const args = ['vitest', 'run'];

if (testPattern) {
  args.push(testPattern);
}

console.log(`Running: ${command} ${args.join(' ')}`);

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`\nTest run completed with code ${code}`);
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed. Check output above for details.');
  }
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
#!/usr/bin/env node

import { spawn } from 'child_process';

const testType = process.argv[2];
const options = process.argv.slice(3);

const testConfigs = {
  'local': {
    config: 'playwright.config.ts',
    description: 'Local development tests'
  },
  'staging': {
    config: 'playwright-staging-comprehensive.config.ts',
    description: 'Staging comprehensive tests'
  },
  'production': {
    config: 'playwright-production-smoke.config.ts',
    description: 'Production smoke tests'
  },
  'production-smoke': {
    config: 'playwright-production-smoke.config.ts',
    description: 'Production smoke tests (alias)'
  },
  'staging-comprehensive': {
    config: 'playwright-staging-comprehensive.config.ts',
    description: 'Staging comprehensive tests (alias)'
  }
};

function showUsage() {
  console.log('Usage: npm run test:e2e <environment> [options]');
  console.log('');
  console.log('Environments:');
  Object.entries(testConfigs).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(20)} - ${config.description}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:e2e local');
  console.log('  npm run test:e2e production');
  console.log('  npm run test:e2e staging --headed');
  console.log('  npm run test:e2e production --project production-smoke-chrome');
  process.exit(1);
}

if (!testType || !testConfigs[testType]) {
  console.error(`❌ Unknown test environment: ${testType || 'none'}`);
  console.log('');
  showUsage();
}

const config = testConfigs[testType];
const args = ['playwright', 'test', '--config', config.config, ...options];

console.log(`🧪 Running ${config.description}`);
console.log(`📋 Config: ${config.config}`);
console.log(`🚀 Command: npx ${args.join(' ')}`);
console.log('');

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`\n✅ ${config.description} completed with code ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error(`❌ Error running ${config.description}:`, error);
  process.exit(1);
});
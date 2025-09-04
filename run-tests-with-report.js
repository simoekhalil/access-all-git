#!/usr/bin/env node

import { spawn } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run vitest
console.log('🧪 Running tests...');
const vitest = spawn('npx', ['vitest', 'run'], { 
  stdio: 'inherit',
  shell: true 
});

vitest.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Tests completed successfully!');
    
    // Open HTML report
    const reportPath = join(__dirname, 'test-results', 'index.html');
    const openCommand = platform() === 'win32' ? 'start' : 
                      platform() === 'darwin' ? 'open' : 'xdg-open';
    
    console.log('📊 Opening HTML report...');
    spawn(openCommand, [reportPath], { 
      shell: true,
      detached: true,
      stdio: 'ignore'
    });
  } else {
    console.log(`❌ Tests failed with exit code ${code}`);
  }
});
#!/usr/bin/env node

/**
 * NEW FILE: Development Server Cleanup Script
 * 
 * Purpose: Automatically cleans up stale Next.js dev server processes and lock files
 * This prevents the "Unable to acquire lock" error by ensuring a clean state before starting
 * 
 * Architecture: Uses Node.js child_process to find and kill processes, then removes lock files
 * This is self-healing - runs before every dev server start to prevent conflicts
 */

import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const lockFilePath = join(projectRoot, '.next', 'dev', 'lock');

/**
 * Kills all processes listening on port 3000
 * Uses lsof to find processes, then kill to terminate them
 */
function killPort3000() {
  try {
    // Find processes using port 3000
    const pids = execSync('lsof -ti:3000', { encoding: 'utf-8', stdio: 'pipe' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    if (pids.length > 0) {
      console.log(`🧹 Cleaning up ${pids.length} process(es) on port 3000...`);
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
        } catch (error) {
          // Process might already be dead, ignore
        }
      }
      console.log('✅ Port 3000 cleared');
    }
  } catch (error) {
    // No processes found on port 3000, which is fine
  }
}

/**
 * Kills all "next dev" processes system-wide
 * This catches any zombie Next.js processes that might be running
 */
function killNextDevProcesses() {
  try {
    execSync('pkill -f "next dev"', { stdio: 'pipe' });
    console.log('✅ All Next.js dev processes terminated');
  } catch (error) {
    // No processes found, which is fine
  }
}

/**
 * Removes the Next.js lock file if it exists
 * Lock files are created when dev server starts and sometimes aren't cleaned up properly
 */
function removeLockFile() {
  if (existsSync(lockFilePath)) {
    try {
      unlinkSync(lockFilePath);
      console.log('✅ Lock file removed');
    } catch (error) {
      console.warn(`⚠️  Could not remove lock file: ${error.message}`);
    }
  }
}

/**
 * Main cleanup function
 * Runs all cleanup steps in sequence
 */
function cleanup() {
  console.log('🧹 Cleaning up development environment...\n');
  
  killPort3000();
  killNextDevProcesses();
  removeLockFile();
  
  console.log('\n✨ Cleanup complete! Ready to start dev server.\n');
}

// Run cleanup
cleanup();




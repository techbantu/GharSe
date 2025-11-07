/**
 * GENIUS DATABASE EXECUTOR - Automatic SQL Execution to Supabase
 * 
 * Purpose: Automatically executes SQL commands to Supabase database
 * Uses DATABASE_URL from .env to connect and run migrations/schema changes
 * 
 * Architecture: Uses Prisma's $executeRawUnsafe for direct SQL execution
 * Pattern: Executes SQL, tracks changes, ensures schema consistency
 */

import prisma from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

interface DatabaseChange {
  id: string;
  type: 'CREATE' | 'ALTER' | 'DROP' | 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  sql: string;
  executedAt: Date;
  success: boolean;
  error?: string;
}

class DatabaseExecutor {
  private changes: DatabaseChange[] = [];

  /**
   * Execute SQL command(s) using Prisma
   */
  async execute(sql: string, description?: string): Promise<{ success: boolean; error?: string; rows?: any[] }> {
    try {
      // Use Prisma's $executeRawUnsafe for direct SQL execution
      const result = await prisma.$executeRawUnsafe(sql);
      
      const change: DatabaseChange = {
        id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: this.detectChangeType(sql),
        table: this.extractTableName(sql),
        sql: sql.substring(0, 200), // Truncate for storage
        executedAt: new Date(),
        success: true,
      };

      this.changes.push(change);

      console.log(`✅ SQL executed successfully${description ? `: ${description}` : ''}`);
      
      return {
        success: true,
        rows: [],
      };
    } catch (error: any) {
      const change: DatabaseChange = {
        id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: this.detectChangeType(sql),
        table: this.extractTableName(sql),
        sql: sql.substring(0, 200),
        executedAt: new Date(),
        success: false,
        error: error.message,
      };

      this.changes.push(change);

      console.error(`❌ SQL execution failed:`, error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute multiple SQL commands in a transaction
   */
  async executeBatch(sqlCommands: string[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      await prisma.$transaction(async (tx) => {
        for (const sql of sqlCommands) {
          try {
            await tx.$executeRawUnsafe(sql);
          } catch (error: any) {
            errors.push(error.message);
            throw error; // Rollback on any error
          }
        }
      });

      console.log(`✅ Batch executed: ${sqlCommands.length} commands`);
      
      return { success: true, errors: [] };
    } catch (error: any) {
      console.error(`❌ Batch execution failed:`, error.message);
      
      return {
        success: false,
        errors: errors.length > 0 ? errors : [error.message],
      };
    }
  }

  /**
   * Execute SQL from file
   */
  async executeFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const sql = readFileSync(fullPath, 'utf-8');
      
      // Split by semicolons and filter empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      return await this.executeBatch(statements);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Ensure table exists, create if not
   */
  async ensureTable(tableName: string, createSql: string): Promise<boolean> {
    try {
      // Check if table exists using Prisma
      const checkResult = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `) as any[];
      
      if (!checkResult[0]?.exists) {
        console.log(`📋 Creating table: ${tableName}`);
        const createResult = await this.execute(createSql, `Create table ${tableName}`);
        return createResult.success;
      }

      return true;
    } catch (error: any) {
      console.error(`Error checking table ${tableName}:`, error.message);
      return false;
    }
  }

  /**
   * Get execution history
   */
  getHistory(): DatabaseChange[] {
    return this.changes;
  }

  private detectChangeType(sql: string): DatabaseChange['type'] {
    const upperSql = sql.toUpperCase().trim();
    if (upperSql.startsWith('CREATE')) return 'CREATE';
    if (upperSql.startsWith('ALTER')) return 'ALTER';
    if (upperSql.startsWith('DROP')) return 'DROP';
    if (upperSql.startsWith('INSERT')) return 'INSERT';
    if (upperSql.startsWith('UPDATE')) return 'UPDATE';
    if (upperSql.startsWith('DELETE')) return 'DELETE';
    return 'CREATE';
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:FROM|INTO|UPDATE|TABLE|CREATE TABLE|ALTER TABLE)\s+["`]?(\w+)["`]?/i);
    return match ? match[1] : 'unknown';
  }
}

// Singleton instance
let executorInstance: DatabaseExecutor | null = null;

export function getDatabaseExecutor(): DatabaseExecutor {
  if (!executorInstance) {
    executorInstance = new DatabaseExecutor();
  }
  return executorInstance;
}

export default DatabaseExecutor;


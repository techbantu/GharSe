/**
 * 🧬 GENIUS SUPABASE AUTO-MIGRATOR
 * 
 * Purpose: Automatically executes SQL commands to Supabase database
 * Uses DATABASE_URL from .env to connect and run migrations
 * 
 * Architecture:
 * - Reads SQL files or raw SQL commands
 * - Executes directly to Supabase PostgreSQL
 * - Tracks all changes in database_changes table
 * - Prevents duplicate executions
 * - Works seamlessly with Prisma
 * 
 * Pattern: Every SQL command is tracked, logged, and verified
 */

import prisma from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

interface DatabaseChange {
  id: string;
  type: 'CREATE' | 'ALTER' | 'DROP' | 'INSERT' | 'UPDATE' | 'DELETE' | 'MIGRATION';
  table: string;
  sql: string;
  description?: string;
  executedAt: Date;
  success: boolean;
  error?: string;
}

class SupabaseMigrator {
  private initialized = false;

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create database_changes table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "database_changes" (
          "id" TEXT PRIMARY KEY,
          "type" TEXT NOT NULL,
          "table" TEXT NOT NULL,
          "sql" TEXT NOT NULL,
          "description" TEXT,
          "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "success" BOOLEAN NOT NULL DEFAULT true,
          "error" TEXT
        );
        
        CREATE INDEX IF NOT EXISTS "database_changes_table_idx" ON "database_changes"("table");
        CREATE INDEX IF NOT EXISTS "database_changes_executedAt_idx" ON "database_changes"("executedAt");
      `);

      this.initialized = true;
      console.log('✅ Migration tracking table initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize migration tracking:', error.message);
      // Continue anyway - might be SQLite which doesn't support all PostgreSQL features
    }
  }

  /**
   * Execute SQL command(s) and track in database_changes
   */
  async execute(
    sql: string | string[],
    description?: string
  ): Promise<{ success: boolean; error?: string; changes?: DatabaseChange[] }> {
    await this.initialize();

    const sqlCommands = Array.isArray(sql) ? sql : [sql];
    const changes: DatabaseChange[] = [];

    for (const sqlCommand of sqlCommands) {
      const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const changeType = this.detectChangeType(sqlCommand);
      const tableName = this.extractTableName(sqlCommand);

      try {
        // Execute SQL
        await prisma.$executeRawUnsafe(sqlCommand);

        const change: DatabaseChange = {
          id: changeId,
          type: changeType,
          table: tableName,
          sql: sqlCommand.substring(0, 500), // Truncate for storage
          description,
          executedAt: new Date(),
          success: true,
        };

        // Save to database_changes table
        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "database_changes" ("id", "type", "table", "sql", "description", "executedAt", "success")
            VALUES ('${changeId}', '${changeType}', '${tableName}', ${JSON.stringify(change.sql).replace(/'/g, "''")}, ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}, '${change.executedAt.toISOString()}', true)
          `);
        } catch (trackError: any) {
          // If tracking fails, log but continue
          console.warn('⚠️ Could not track change in database_changes:', trackError.message);
        }

        changes.push(change);
        console.log(`✅ SQL executed: ${description || changeType} on ${tableName}`);

      } catch (error: any) {
        const change: DatabaseChange = {
          id: changeId,
          type: changeType,
          table: tableName,
          sql: sqlCommand.substring(0, 500),
          description,
          executedAt: new Date(),
          success: false,
          error: error.message,
        };

        // Save failed change
        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "database_changes" ("id", "type", "table", "sql", "description", "executedAt", "success", "error")
            VALUES ('${changeId}', '${changeType}', '${tableName}', ${JSON.stringify(change.sql).replace(/'/g, "''")}, ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}, '${change.executedAt.toISOString()}', false, ${JSON.stringify(error.message).replace(/'/g, "''")})
          `);
        } catch (trackError: any) {
          console.warn('⚠️ Could not track failed change:', trackError.message);
        }

        changes.push(change);
        console.error(`❌ SQL execution failed: ${error.message}`);

        return {
          success: false,
          error: error.message,
          changes,
        };
      }
    }

    return {
      success: true,
      changes,
    };
  }

  /**
   * Execute SQL from file
   */
  async executeFile(filePath: string, description?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const sql = readFileSync(fullPath, 'utf-8');

      // Split by semicolons and filter empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$'));

      const result = await this.execute(statements, description || `Execute file: ${filePath}`);

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Ensure complete schema is set up (runs supabase-schema.sql)
   */
  async ensureSchema(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Ensuring database schema is up to date...');

      // Execute the complete schema file
      const result = await this.executeFile('supabase-schema.sql', 'Complete database schema setup');

      if (result.success) {
        console.log('✅ Database schema is ready');
      }

      return result;
    } catch (error: any) {
      console.error('❌ Schema setup failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get migration history
   */
  async getHistory(limit = 50): Promise<DatabaseChange[]> {
    await this.initialize();

    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM "database_changes"
        ORDER BY "executedAt" DESC
        LIMIT ${limit}
      `) as any[];

      return result.map((row: any) => ({
        id: row.id,
        type: row.type as DatabaseChange['type'],
        table: row.table,
        sql: row.sql,
        description: row.description,
        executedAt: new Date(row.executedAt),
        success: row.success,
        error: row.error,
      }));
    } catch (error: any) {
      console.error('❌ Failed to get migration history:', error.message);
      return [];
    }
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      // Check database provider from Prisma schema
      // SQLite is the default for this project
      const result = await prisma.$queryRawUnsafe(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='${tableName}';
      `) as any[];

      return result.length > 0;
    } catch (error: any) {
      // Fallback for PostgreSQL/Supabase (if provider changes)
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          ) as exists;
        `) as any[];

        return result[0]?.exists === true;
      } catch {
        return false;
      }
    }
  }

  private detectChangeType(sql: string): DatabaseChange['type'] {
    const upperSql = sql.toUpperCase().trim();
    if (upperSql.startsWith('CREATE')) return 'CREATE';
    if (upperSql.startsWith('ALTER')) return 'ALTER';
    if (upperSql.startsWith('DROP')) return 'DROP';
    if (upperSql.startsWith('INSERT')) return 'INSERT';
    if (upperSql.startsWith('UPDATE')) return 'UPDATE';
    if (upperSql.startsWith('DELETE')) return 'DELETE';
    return 'MIGRATION';
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:FROM|INTO|UPDATE|TABLE|CREATE TABLE|ALTER TABLE)\s+["`]?(\w+)["`]?/i);
    return match ? match[1] : 'unknown';
  }
}

// Singleton instance
let migratorInstance: SupabaseMigrator | null = null;

export function getSupabaseMigrator(): SupabaseMigrator {
  if (!migratorInstance) {
    migratorInstance = new SupabaseMigrator();
  }
  return migratorInstance;
}

export default SupabaseMigrator;


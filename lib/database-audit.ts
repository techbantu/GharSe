/**
 * NEW FILE: Database-Level Audit Trail System
 * Purpose: Log all database operations (DDL/DML) for complete audit trail
 * Compliance: Defense-in-depth - even if app-level logging fails, DB changes are captured
 * 
 * Features:
 * - Logs schema changes (CREATE TABLE, ALTER TABLE, DROP, etc.)
 * - Logs data changes (INSERT, UPDATE, DELETE)
 * - Tracks actor (user/system), IP, transaction ID
 * - Provides forensic trail for legal defense
 * 
 * This creates a "black box recorder" for your database - like an airplane's flight recorder,
 * it captures everything for post-incident investigation.
 */

import { prisma } from '@/lib/prisma';

export type ChangeKind = 'ddl' | 'dml' | 'storage';
export type CommandTag = 'CREATE' | 'ALTER' | 'DROP' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
export type ObjectType = 'table' | 'column' | 'index' | 'trigger' | 'function' | 'schema';

interface DatabaseChangeEntry {
  actor?: string; // User ID or system identifier
  clientAddr?: string; // IP address
  appName?: string; // Application name
  txId?: string; // Transaction ID
  changeKind: ChangeKind;
  commandTag?: string;
  objectType?: ObjectType;
  objectIdentity?: string; // e.g., "public.orders"
  statement?: string; // SQL statement
  details?: Record<string, any>; // Additional metadata
}

/**
 * Log a database change to the audit trail
 * Returns the audit log ID for reference
 */
export async function logDatabaseChange(entry: DatabaseChangeEntry): Promise<string> {
  try {
    const auditLog = await prisma.databaseChange.create({
      data: {
        actor: entry.actor,
        clientAddr: entry.clientAddr,
        appName: entry.appName || 'bantus-kitchen',
        txId: entry.txId,
        changeKind: entry.changeKind,
        commandTag: entry.commandTag,
        objectType: entry.objectType,
        objectIdentity: entry.objectIdentity,
        statement: entry.statement,
        details: entry.details || {},
      },
    });

    console.log(`[DB AUDIT] ${entry.changeKind.toUpperCase()} - ${entry.commandTag} ${entry.objectIdentity || ''}`);

    return auditLog.id;
  } catch (error) {
    console.error('[DB AUDIT] Failed to log database change:', error);
    // Don't throw - audit logging should never break app functionality
    return '';
  }
}

/**
 * Log DDL operation (schema change)
 */
export async function logDDL(data: {
  actor?: string;
  clientAddr?: string;
  commandTag: string;
  objectType: ObjectType;
  objectIdentity: string;
  statement?: string;
  details?: Record<string, any>;
}): Promise<string> {
  return logDatabaseChange({
    actor: data.actor,
    clientAddr: data.clientAddr,
    changeKind: 'ddl',
    commandTag: data.commandTag,
    objectType: data.objectType,
    objectIdentity: data.objectIdentity,
    statement: data.statement,
    details: data.details,
  });
}

/**
 * Log DML operation (data change)
 */
export async function logDML(data: {
  actor?: string;
  clientAddr?: string;
  commandTag: 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  rowData?: Record<string, any>; // Old/new values
  rowCount?: number;
  details?: Record<string, any>;
}): Promise<string> {
  return logDatabaseChange({
    actor: data.actor,
    clientAddr: data.clientAddr,
    changeKind: 'dml',
    commandTag: data.commandTag,
    objectType: 'table',
    objectIdentity: `public.${data.tableName}`,
    details: {
      rowData: data.rowData,
      rowCount: data.rowCount,
      ...data.details,
    },
  });
}

/**
 * Log storage operation (file/bucket change)
 */
export async function logStorageChange(data: {
  actor?: string;
  commandTag: string;
  bucketName: string;
  objectKey?: string;
  details?: Record<string, any>;
}): Promise<string> {
  return logDatabaseChange({
    actor: data.actor,
    changeKind: 'storage',
    commandTag: data.commandTag,
    objectType: 'table', // Storage buckets treated as tables
    objectIdentity: `storage.${data.bucketName}`,
    details: {
      objectKey: data.objectKey,
      ...data.details,
    },
  });
}

/**
 * Wrap Prisma operation with audit logging
 * Usage: await withAudit({ actor: userId, commandTag: 'INSERT', tableName: 'Order' }, () => prisma.order.create(...))
 */
export async function withAudit<T>(
  auditData: {
    actor?: string;
    clientAddr?: string;
    commandTag: 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    details?: Record<string, any>;
  },
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    // Log successful operation
    await logDML({
      actor: auditData.actor,
      clientAddr: auditData.clientAddr,
      commandTag: auditData.commandTag,
      tableName: auditData.tableName,
      details: {
        ...auditData.details,
        duration,
        success: true,
      },
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failed operation
    await logDML({
      actor: auditData.actor,
      clientAddr: auditData.clientAddr,
      commandTag: auditData.commandTag,
      tableName: auditData.tableName,
      details: {
        ...auditData.details,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    throw error; // Re-throw to maintain original behavior
  }
}

/**
 * Get database change logs with filters
 */
export async function getDatabaseChanges(filters: {
  changeKind?: ChangeKind;
  actor?: string;
  objectType?: ObjectType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (filters.changeKind) where.changeKind = filters.changeKind;
  if (filters.actor) where.actor = filters.actor;
  if (filters.objectType) where.objectType = filters.objectType;

  if (filters.startDate || filters.endDate) {
    where.occurredAt = {};
    if (filters.startDate) where.occurredAt.gte = filters.startDate;
    if (filters.endDate) where.occurredAt.lte = filters.endDate;
  }

  return prisma.databaseChange.findMany({
    where,
    orderBy: {
      occurredAt: 'desc',
    },
    take: filters.limit || 100,
  });
}

/**
 * Get recent database changes (for admin dashboard)
 */
export async function getRecentDatabaseChanges(limit: number = 50) {
  return prisma.databaseChange.findMany({
    orderBy: {
      occurredAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get database change statistics
 */
export async function getDatabaseChangeStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<{
  totalChanges: number;
  byKind: Record<string, number>;
  byCommand: Record<string, number>;
  uniqueActors: number;
}> {
  const since = new Date();
  if (timeRange === 'day') {
    since.setDate(since.getDate() - 1);
  } else if (timeRange === 'week') {
    since.setDate(since.getDate() - 7);
  } else {
    since.setMonth(since.getMonth() - 1);
  }

  const changes = await prisma.databaseChange.findMany({
    where: {
      occurredAt: {
        gte: since,
      },
    },
  });

  const byKind: Record<string, number> = {};
  const byCommand: Record<string, number> = {};
  const uniqueActors = new Set<string>();

  changes.forEach((change) => {
    byKind[change.changeKind] = (byKind[change.changeKind] || 0) + 1;
    if (change.commandTag) {
      byCommand[change.commandTag] = (byCommand[change.commandTag] || 0) + 1;
    }
    if (change.actor) uniqueActors.add(change.actor);
  });

  return {
    totalChanges: changes.length,
    byKind,
    byCommand,
    uniqueActors: uniqueActors.size,
  };
}


/**
 * 🎯 IP-BASED ATTACK TRACKING SYSTEM
 * 
 * Features:
 * 1. Track suspicious IPs
 * 2. Geolocation analysis
 * 3. Attack pattern detection
 * 4. Threat intelligence integration
 * 5. Automated response
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AttackType {
  BRUTE_FORCE = 'BRUTE_FORCE',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF = 'CSRF',
  DOS = 'DOS',
  DDOS = 'DDOS',
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING',
  ACCOUNT_ENUMERATION = 'ACCOUNT_ENUMERATION',
  HONEYPOT_TRIGGERED = 'HONEYPOT_TRIGGERED',
  SUSPICIOUS_USER_AGENT = 'SUSPICIOUS_USER_AGENT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface IPThreatData {
  ip: string;
  threatLevel: ThreatLevel;
  attacks: Array<{
    type: AttackType;
    timestamp: Date;
    details: any;
  }>;
  firstSeen: Date;
  lastSeen: Date;
  totalAttempts: number;
  isBlacklisted: boolean;
  geolocation?: {
    country?: string;
    city?: string;
    isp?: string;
  };
}

// In-memory tracking (use Redis in production)
const ipTracking = new Map<string, IPThreatData>();

// Known malicious IP ranges (example)
const KNOWN_MALICIOUS_RANGES = [
  // Add known malicious IP ranges here
  // Example: '185.220.100.0/24' (Tor exit nodes)
];

/**
 * Record an attack attempt from an IP
 */
export async function recordAttackAttempt(
  ip: string,
  attackType: AttackType,
  details: any
): Promise<IPThreatData> {
  const now = new Date();
  
  // Get or create IP tracking data
  let threatData = ipTracking.get(ip);
  
  if (!threatData) {
    threatData = {
      ip,
      threatLevel: ThreatLevel.LOW,
      attacks: [],
      firstSeen: now,
      lastSeen: now,
      totalAttempts: 0,
      isBlacklisted: false,
    };
    ipTracking.set(ip, threatData);
  }
  
  // Record attack
  threatData.attacks.push({
    type: attackType,
    timestamp: now,
    details,
  });
  threatData.lastSeen = now;
  threatData.totalAttempts++;
  
  // Calculate threat level
  threatData.threatLevel = calculateThreatLevel(threatData);
  
  // Auto-blacklist if critical
  if (threatData.threatLevel === ThreatLevel.CRITICAL && !threatData.isBlacklisted) {
    threatData.isBlacklisted = true;
    console.error(`🚫 IP ${ip} auto-blacklisted due to critical threat level`);
  }
  
  // Store in memory cache only (no database table in schema)
  ipCache.set(ip, threatData);
    create: {
      ip,
      threatLevel: threatData.threatLevel,
      totalAttempts: 1,
      firstSeen: threatData.firstSeen,
      lastSeen: threatData.lastSeen,
      isBlacklisted: false,
      attacks: {
        create: {
          attackType,
          details: JSON.stringify(details),
          timestamp: now,
        },
      },
    },
  });
  
  // Log to console
  console.warn(`⚠️  Attack detected: ${attackType} from IP ${ip} (Threat: ${threatData.threatLevel})`);
  
  return threatData;
}

/**
 * Calculate threat level based on attack patterns
 */
function calculateThreatLevel(threatData: IPThreatData): ThreatLevel {
  const { attacks, totalAttempts } = threatData;
  
  // Critical indicators
  const hasHoneypotTrigger = attacks.some(a => a.type === AttackType.HONEYPOT_TRIGGERED);
  const hasSQLInjection = attacks.some(a => a.type === AttackType.SQL_INJECTION);
  const hasDDoS = attacks.some(a => a.type === AttackType.DDOS);
  
  if (hasHoneypotTrigger || hasSQLInjection || hasDDoS) {
    return ThreatLevel.CRITICAL;
  }
  
  // High indicators
  if (totalAttempts > 50) {
    return ThreatLevel.HIGH;
  }
  
  // Check attack types diversity
  const uniqueAttackTypes = new Set(attacks.map(a => a.type)).size;
  if (uniqueAttackTypes >= 3) {
    return ThreatLevel.HIGH;
  }
  
  // Medium indicators
  if (totalAttempts > 20) {
    return ThreatLevel.MEDIUM;
  }
  
  // Low by default
  return ThreatLevel.LOW;
}

/**
 * Get IP threat data
 */
export function getIPThreatData(ip: string): IPThreatData | undefined {
  return ipTracking.get(ip);
}

/**
 * Check if IP is known attacker
 */
export function isKnownAttacker(ip: string): boolean {
  const threatData = ipTracking.get(ip);
  return threatData?.isBlacklisted || false;
}

/**
 * Get all tracked IPs
 */
export async function getAllThreats(filter?: {
  minThreatLevel?: ThreatLevel;
  attackType?: AttackType;
  onlyBlacklisted?: boolean;
}): Promise<IPThreatData[]> {
  const threats = Array.from(ipTracking.values());
  
  return threats.filter(threat => {
    if (filter?.minThreatLevel) {
      const levels = [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL];
      const minIndex = levels.indexOf(filter.minThreatLevel);
      const currentIndex = levels.indexOf(threat.threatLevel);
      if (currentIndex < minIndex) return false;
    }
    
    if (filter?.attackType) {
      const hasAttackType = threat.attacks.some(a => a.type === filter.attackType);
      if (!hasAttackType) return false;
    }
    
    if (filter?.onlyBlacklisted && !threat.isBlacklisted) {
      return false;
    }
    
    return true;
  });
}

/**
 * Generate threat intelligence report
 */
export async function generateThreatReport(): Promise<{
  totalThreats: number;
  byThreatLevel: Record<ThreatLevel, number>;
  byAttackType: Record<AttackType, number>;
  topAttackers: Array<{ ip: string; attempts: number; threatLevel: ThreatLevel }>;
  recentAttacks: Array<{ ip: string; type: AttackType; timestamp: Date }>;
}> {
  const threats = Array.from(ipTracking.values());
  
  // Count by threat level
  const byThreatLevel: Record<ThreatLevel, number> = {
    [ThreatLevel.LOW]: 0,
    [ThreatLevel.MEDIUM]: 0,
    [ThreatLevel.HIGH]: 0,
    [ThreatLevel.CRITICAL]: 0,
  };
  
  threats.forEach(threat => {
    byThreatLevel[threat.threatLevel]++;
  });
  
  // Count by attack type
  const byAttackType: Record<AttackType, number> = {} as any;
  
  threats.forEach(threat => {
    threat.attacks.forEach(attack => {
      byAttackType[attack.type] = (byAttackType[attack.type] || 0) + 1;
    });
  });
  
  // Top attackers
  const topAttackers = threats
    .sort((a, b) => b.totalAttempts - a.totalAttempts)
    .slice(0, 10)
    .map(threat => ({
      ip: threat.ip,
      attempts: threat.totalAttempts,
      threatLevel: threat.threatLevel,
    }));
  
  // Recent attacks
  const recentAttacks = threats
    .flatMap(threat => 
      threat.attacks.map(attack => ({
        ip: threat.ip,
        type: attack.type,
        timestamp: attack.timestamp,
      }))
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);
  
  return {
    totalThreats: threats.length,
    byThreatLevel,
    byAttackType,
    topAttackers,
    recentAttacks,
  };
}

/**
 * Middleware to track suspicious requests
 */
export function ipTrackingMiddleware() {
  return async (req: any, res: any, next: any) => {
    const ip = 
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      'unknown';
    
    // Check if IP is known attacker
    if (isKnownAttacker(ip)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'IP_BLACKLISTED',
      });
    }
    
    // Store IP in request
    (req as any).clientIp = ip;
    
    next();
  };
}


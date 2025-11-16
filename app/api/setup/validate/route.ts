/**
 * SETUP VALIDATION API
 * 
 * GET /api/setup/validate - Check all configurations
 * GET /api/setup/validate?service=database - Test specific service
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSetup, testService } from '@/lib/setup-validator';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    // Test specific service
    if (service) {
      const result = await testService(service);
      const duration = Date.now() - startTime;

      return NextResponse.json({
        ...result,
        service,
        duration,
      });
    }

    // Full validation
    const status = await validateSetup();
    const duration = Date.now() - startTime;

    logger.info('Setup validation requested', {
      overallStatus: status.overallStatus,
      score: status.score,
      duration,
    });

    return NextResponse.json({
      success: true,
      ...status,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Setup validation failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate setup',
      },
      { status: 500 }
    );
  }
}



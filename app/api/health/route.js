/**
 * Health check endpoint
 * GET /api/health
 */
import { NextResponse } from 'next/server';
import { corsHeaders } from '../lib/auth';
import { APP_VERSION } from '../../../lib/config/version';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: APP_VERSION
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

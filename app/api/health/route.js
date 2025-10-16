/**
 * Health check endpoint
 * GET /api/health
 */
import { NextResponse } from 'next/server';
import { corsHeaders } from '../lib/auth';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.2'
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

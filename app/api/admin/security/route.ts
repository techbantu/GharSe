import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // In a real app, this would update the password/2FA
    console.log('Updating admin security:', body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}

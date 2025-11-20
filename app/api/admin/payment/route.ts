import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // In a real app, this would update bank details
    console.log('Updating admin payment settings:', body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}

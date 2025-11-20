import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // In a real app, this would update the database
    console.log('Updating admin profile:', body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

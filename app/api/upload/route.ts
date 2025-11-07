/**
 * GENIUS IMAGE UPLOAD API
 * 
 * Automatically:
 * - Uploads images to local storage
 * - Generates unique filenames with timestamps
 * - Links images to menu items by ID
 * - Returns image URL for database storage
 * 
 * NO MANUAL WORK REQUIRED!
 */

import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const itemId = formData.get('itemId') as string; // Menu item ID

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename with item ID and timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const safeItemId = itemId ? itemId.replace(/[^a-zA-Z0-9-_]/g, '') : 'item';
    const filename = `${safeItemId}-${timestamp}.${fileExtension}`;
    
    // Full file path
    const filepath = path.join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/uploads/${filename}`;

    console.log('✅ Image uploaded successfully:', {
      filename,
      itemId: safeItemId,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      url: publicUrl,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      itemId: safeItemId,
      size: file.size,
      message: 'Image uploaded successfully!',
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove images
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'No filename provided' },
        { status: 400 }
      );
    }

    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Delete file if it exists
    if (existsSync(filepath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filepath);
      
      console.log('✅ Image deleted:', filename);
      
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'File not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}


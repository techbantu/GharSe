/**
 * PRODUCTION CLOUDINARY IMAGE UPLOAD API
 * 
 * Features:
 * - Uploads images to Cloudinary (CDN-backed cloud storage)
 * - Automatic optimization (WebP, quality adjustment)
 * - Generates multiple thumbnail sizes (200x200, 400x400, 800x800)
 * - Secure deletion via publicId
 * - Links images to menu items by ID
 * 
 * Fallback: Local file storage if Cloudinary not configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  enabled: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
};

// Lazy load Cloudinary (only if configured)
let cloudinary: any = null;
const getCloudinary = async () => {
  if (!CLOUDINARY_CONFIG.enabled) {
    logger.warn(
      '⚠️ Cloudinary not configured - falling back to local storage.\n' +
      'Required environment variables:\n' +
      '- CLOUDINARY_CLOUD_NAME\n' +
      '- CLOUDINARY_API_KEY\n' +
      '- CLOUDINARY_API_SECRET\n\n' +
      'Sign up: https://cloudinary.com (free tier available)\n' +
      'Get credentials from: Dashboard > Settings > Access Keys'
    );
    return null;
  }

  if (!cloudinary) {
    try {
      const cloudinaryModule = await import('cloudinary');
      cloudinary = cloudinaryModule.v2;
      
      cloudinary.config({
        cloud_name: CLOUDINARY_CONFIG.cloudName,
        api_key: CLOUDINARY_CONFIG.apiKey,
        api_secret: CLOUDINARY_CONFIG.apiSecret,
      });
      
      logger.info('Cloudinary initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cloudinary', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        '❌ Cloudinary initialization failed. Make sure cloudinary package is installed: npm install cloudinary'
      );
    }
  }
  return cloudinary;
};

/**
 * Upload to Cloudinary with optimization
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  itemId: string
): Promise<{ url: string; publicId: string; thumbnails: Record<string, string> }> {
  const cloudinary = await getCloudinary();
  
  if (!cloudinary) {
    throw new Error('Cloudinary not initialized');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'bantus-kitchen/menu-items',
        public_id: `${itemId}-${Date.now()}`,
        resource_type: 'image',
        // Optimization settings
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' }, // Auto quality and format (WebP when supported)
        ],
        // Generate thumbnails
        eager: [
          { width: 200, height: 200, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }, // Thumbnail
          { width: 400, height: 400, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }, // Medium
          { width: 800, height: 800, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }, // Large
        ],
        eager_async: false, // Wait for transformations
      },
      (error: any, result: any) => {
        if (error) {
          logger.error('Cloudinary upload failed', {
            error: error.message,
            itemId,
          });
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error('No result from Cloudinary'));
          return;
        }

        logger.info('Image uploaded to Cloudinary', {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });

        // Extract thumbnail URLs from eager transformations
        const thumbnails: Record<string, string> = {
          original: result.secure_url,
        };

        if (result.eager) {
          thumbnails.small = result.eager[0]?.secure_url || result.secure_url;
          thumbnails.medium = result.eager[1]?.secure_url || result.secure_url;
          thumbnails.large = result.eager[2]?.secure_url || result.secure_url;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          thumbnails,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload to local file system (fallback)
 */
async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  itemId: string
): Promise<{ url: string; publicId: string; thumbnails: Record<string, string> }> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const fileExtension = filename.split('.').pop();
  const safeItemId = itemId.replace(/[^a-zA-Z0-9-_]/g, '');
  const finalFilename = `${safeItemId}-${timestamp}.${fileExtension}`;

  // Full file path
  const filepath = path.join(uploadsDir, finalFilename);

  // Save file
  await writeFile(filepath, buffer);

  const publicUrl = `/uploads/${finalFilename}`;

  logger.info('Image uploaded to local storage', {
    filename: finalFilename,
    itemId,
    url: publicUrl,
  });

  return {
    url: publicUrl,
    publicId: finalFilename,
    thumbnails: {
      original: publicUrl,
      small: publicUrl,
      medium: publicUrl,
      large: publicUrl,
    },
  };
}

/**
 * Delete from Cloudinary
 */
async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cloudinary = await getCloudinary();
  
  if (!cloudinary) {
    throw new Error('Cloudinary not initialized');
  }

  await cloudinary.uploader.destroy(publicId);
  
  logger.info('Image deleted from Cloudinary', { publicId });
}

/**
 * Delete from local file system
 */
async function deleteFromLocal(publicId: string): Promise<void> {
  const filepath = path.join(process.cwd(), 'public', 'uploads', publicId);

  if (existsSync(filepath)) {
    await unlink(filepath);
    logger.info('Image deleted from local storage', { publicId });
  } else {
    logger.warn('Image file not found', { publicId });
  }
}

/**
 * POST /api/upload - Upload image
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const itemId = (formData.get('itemId') as string) || 'item';

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary or local storage
    let result;
    
    if (CLOUDINARY_CONFIG.enabled) {
      try {
        result = await uploadToCloudinary(buffer, file.name, itemId);
      } catch (cloudinaryError) {
        logger.error('Cloudinary upload failed, falling back to local', {
          error: cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError),
        });
        result = await uploadToLocal(buffer, file.name, itemId);
      }
    } else {
      result = await uploadToLocal(buffer, file.name, itemId);
    }

    // Update menu item if itemId provided and exists
    if (itemId && itemId !== 'item') {
      try {
        const menuItem = await (prisma.menuItem.findUnique as any)({
          where: { id: itemId },
        });

        if (menuItem) {
          // Delete old image if exists
          if (menuItem.imagePublicId) {
            try {
              if (CLOUDINARY_CONFIG.enabled) {
                await deleteFromCloudinary(menuItem.imagePublicId);
              } else {
                await deleteFromLocal(menuItem.imagePublicId);
              }
            } catch (deleteError) {
              logger.warn('Failed to delete old image', {
                publicId: menuItem.imagePublicId,
                error: deleteError instanceof Error ? deleteError.message : String(deleteError),
              });
            }
          }

          // Update menu item with new image
          await (prisma.menuItem.update as any)({
            where: { id: itemId },
            data: {
              image: result.url,
              imagePublicId: result.publicId,
            },
          });

          logger.info('Menu item image updated', {
            itemId,
            url: result.url,
          });
        }
      } catch (dbError) {
        logger.error('Failed to update menu item', {
          itemId,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
        // Don't fail the upload if DB update fails
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      thumbnails: result.thumbnails,
      itemId,
      size: file.size,
      provider: CLOUDINARY_CONFIG.enabled ? 'cloudinary' : 'local',
      duration,
      message: 'Image uploaded successfully!',
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Image upload failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload - Delete image
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const itemId = searchParams.get('itemId');

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'No publicId provided' },
        { status: 400 }
      );
    }

    // Delete from storage
    if (CLOUDINARY_CONFIG.enabled && publicId.includes('/')) {
      // Cloudinary public IDs contain folder paths
      await deleteFromCloudinary(publicId);
    } else {
      await deleteFromLocal(publicId);
    }

    // Update menu item if itemId provided
    if (itemId) {
      try {
        await (prisma.menuItem.update as any)({
          where: { id: itemId },
          data: {
            image: null,
            imagePublicId: null,
          },
        });

        logger.info('Menu item image cleared', { itemId });
      } catch (dbError) {
        logger.warn('Failed to clear menu item image', {
          itemId,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Image deletion failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete image',
      },
      { status: 500 }
    );
  }
}

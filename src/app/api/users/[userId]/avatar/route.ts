import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        customImage: true,
        image: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Priority: custom image > OAuth image
    const imageData = user.customImage || user.image;

    if (!imageData) {
      return new NextResponse('No avatar available', { status: 404 });
    }

    // If it's a URL (OAuth image), redirect to it
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return NextResponse.redirect(imageData);
    }

    // If it's base64, serve it as an image
    if (imageData.startsWith('data:image/')) {
      const [metadata, base64Data] = imageData.split(',');
      const mimeMatch = metadata.match(/data:(image\/\w+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return new NextResponse('Invalid image format', { status: 400 });
  } catch (error) {
    console.error('Error serving avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

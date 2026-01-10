"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

/**
 * Get current user's profile data including custom image
 * This is separate from session to avoid JWT token size issues with base64 images
 */
export async function getUserProfile() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      customImage: true,
      weight: true
    }
  })

  return user
}

export async function updateProfile(data: { name: string; weight: number; skills?: string[] }, teamId?: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      weight: data.weight,
    },
  })

  // Update ALL paddler records for this user (Name & Weight only)
  await prisma.paddler.updateMany({
    where: { userId: session.user.id },
    data: {
      name: data.name,
      weight: data.weight,
      // Skills are NOT synchronized globally
    },
  })

  // If provided, update skills for the specific team
  if (teamId && data.skills) {
    // Find the paddler for this user and team
    const currentPaddler = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId
      }
    })

    if (currentPaddler) {
      // Preserve special roles that users cannot edit themselves
      // These roles are usually assigned by captains and aren't visible in the user profile form
      const SPECIAL_ROLES = ['stroke', 'steer_preferred'];
      const existingSpecialRoles = (currentPaddler.skills || []).filter(s => SPECIAL_ROLES.includes(s));
      
      // Filter out special roles from the incoming data just in case (though UI shouldn't send them)
      // Then re-add the existing special roles
      const newSkills = [
        ...(data.skills || []).filter(s => !SPECIAL_ROLES.includes(s)), 
        ...existingSpecialRoles
      ];

      // Remove duplicates
      const uniqueSkills = Array.from(new Set(newSkills));

      await prisma.paddler.update({
        where: { id: currentPaddler.id },
        data: {
          skills: uniqueSkills
        }
      })
    }
  }
}

/**
 * Upload a custom profile picture
 * @param base64Image - Base64 encoded image data (with data:image/xxx;base64, prefix)
 * @returns Success status
 * 
 * Security: This function validates file signatures (magic bytes) and re-processes
 * images server-side using Sharp to ensure they are valid images and prevent
 * malicious payloads (polyglot files, etc.)
 */
export async function uploadProfileImage(base64Image: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Validate base64 image format
  if (!base64Image.startsWith('data:image/')) {
    throw new Error("Invalid image format")
  }

  // Check file size (limit to 2MB base64 which is ~1.5MB actual)
  const sizeInBytes = Math.ceil((base64Image.length * 3) / 4)
  const maxSizeInBytes = 2 * 1024 * 1024 // 2MB
  
  if (sizeInBytes > maxSizeInBytes) {
    throw new Error("Image size must be less than 2MB")
  }

  // Security: Decode base64 and validate magic bytes (file signature)
  // Never trust client-provided MIME type strings
  const base64Data = base64Image.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Import file-type dynamically (ESM module)
  const { fileTypeFromBuffer } = await import('file-type')
  const detectedType = await fileTypeFromBuffer(buffer)
  
  // Validate detected file type matches allowed formats
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!detectedType || !allowedExtensions.includes(detectedType.ext)) {
    throw new Error("Invalid file signature detected. Only JPEG, PNG, WebP, and GIF images are allowed")
  }

  // Security: Re-process image server-side using Sharp to sanitize
  // This ensures the file is actually a valid image and strips any malicious data
  const sharp = (await import('sharp')).default
  
  try {
    // Process image: resize, convert to WebP for efficiency, strip metadata
    const processedBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer()
    
    // Convert processed image back to base64 for storage
    // TODO: Replace with S3/R2 upload here for production scalability
    const processedBase64 = `data:image/webp;base64,${processedBuffer.toString('base64')}`
    
    // Update user's custom image with sanitized, processed version
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        customImage: processedBase64,
      },
    })

    return { success: true }
  } catch {
    // Sharp will throw if the file is not a valid image
    throw new Error("Failed to process image. Please ensure the file is a valid image")
  }
}

/**
 * Delete custom profile picture
 * @returns Success status
 */
export async function deleteProfileImage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Remove custom image
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      customImage: null,
    },
  })

  return { success: true }
}

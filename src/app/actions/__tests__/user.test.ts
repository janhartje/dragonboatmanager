import { uploadProfileImage, deleteProfileImage, getUserProfile } from '../user'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'

// Mock modules
jest.mock('@/auth')
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

// Mock Sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image-data')),
  }))
})

// file-type is automatically mocked from __mocks__/file-type.ts
jest.mock('file-type')

describe('uploadProfileImage', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
      ; (auth as jest.Mock).mockResolvedValue(mockSession)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('throws error when user is not authenticated', async () => {
    ; (auth as jest.Mock).mockResolvedValue(null)

    await expect(uploadProfileImage('data:image/png;base64,ABC')).rejects.toThrow(
      'Not authenticated'
    )
  })

  it('throws error for invalid image format (not base64)', async () => {
    await expect(uploadProfileImage('not-a-base64-image')).rejects.toThrow(
      'Invalid image format'
    )
  })

  it('throws error when image size exceeds 2MB limit', async () => {
    // Create a base64 string larger than 2MB
    const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(3 * 1024 * 1024)

    await expect(uploadProfileImage(largeBase64)).rejects.toThrow(
      'Image size must be less than 2MB'
    )
  })

  it('validates file signature using magic bytes (rejects invalid)', async () => {
    // Mock invalid file type detection
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue(undefined)

    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    await expect(uploadProfileImage(validBase64)).rejects.toThrow(
      'Invalid file signature detected'
    )
  })

  it('validates file signature using magic bytes (rejects disallowed types)', async () => {
    // Mock PDF file type detection (not allowed)
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
      ext: 'pdf',
      mime: 'application/pdf',
    })

    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    await expect(uploadProfileImage(validBase64)).rejects.toThrow(
      'Invalid file signature detected'
    )
  })

  it('processes valid PNG image with Sharp', async () => {
    // Mock valid PNG file type
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
      ext: 'png',
      mime: 'image/png',
    })

      // Mock Prisma update
      ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    const result = await uploadProfileImage(validBase64)

    expect(result).toEqual({ success: true })
    expect(sharp).toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        customImage: expect.stringContaining('data:image/webp;base64,'),
      },
    })
  })

  it('processes valid JPEG image', async () => {
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
      ext: 'jpg',
      mime: 'image/jpeg',
    })

      ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AAAB/9k='

    const result = await uploadProfileImage(validBase64)

    expect(result).toEqual({ success: true })
    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('processes valid WebP image', async () => {
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
      ext: 'webp',
      mime: 'image/webp',
    })

      ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const validBase64 = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='

    const result = await uploadProfileImage(validBase64)

    expect(result).toEqual({ success: true })
  })

  it('calls Sharp with correct parameters (resize to 400x400, WebP quality 85)', async () => {
    const { fileTypeFromBuffer } = await import('file-type')
      ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      })

      ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    await uploadProfileImage(validBase64)

    const sharpInstance = (sharp as unknown as jest.Mock).mock.results[0].value
    expect(sharpInstance.resize).toHaveBeenCalledWith(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    expect(sharpInstance.webp).toHaveBeenCalledWith({ quality: 85 })
  })

  it('throws error when Sharp processing fails', async () => {
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
      ext: 'png',
      mime: 'image/png',
    })

    // Mock Sharp to throw error (corrupted image)
    const mockSharpInstance = {
      resize: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockRejectedValue(new Error('Invalid image data')),
    }
      ; (sharp as unknown as jest.Mock).mockReturnValueOnce(mockSharpInstance)

    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    await expect(uploadProfileImage(validBase64)).rejects.toThrow(
      'Failed to process image'
    )
  })

  it('stores processed image as WebP base64 in database', async () => {
    ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({
      ext: 'png',
      mime: 'image/png',
    })

      ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

    await uploadProfileImage(validBase64)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        customImage: 'data:image/webp;base64,cHJvY2Vzc2VkLWltYWdlLWRhdGE=',
      },
    })
  })
})

describe('deleteProfileImage', () => {
  const mockSession = {
    user: { id: 'user-456', email: 'test@example.com', name: 'Test User' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
      ; (auth as jest.Mock).mockResolvedValue(mockSession)
  })

  it('throws error when user is not authenticated', async () => {
    ; (auth as jest.Mock).mockResolvedValue(null)

    await expect(deleteProfileImage()).rejects.toThrow('Not authenticated')
  })

  it('sets customImage to null in database', async () => {
    ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const result = await deleteProfileImage()

    expect(result).toEqual({ success: true })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-456' },
      data: {
        customImage: null,
      },
    })
  })

  it('returns success even if user has no custom image', async () => {
    ; (prisma.user.update as jest.Mock).mockResolvedValue({})

    const result = await deleteProfileImage()

    expect(result).toEqual({ success: true })
  })
})

describe('getUserProfile', () => {
  const mockSession = {
    user: { id: 'user-789', email: 'test@example.com', name: 'Test User' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
      ; (auth as jest.Mock).mockResolvedValue(mockSession)
  })

  it('returns null when user is not authenticated', async () => {
    ; (auth as jest.Mock).mockResolvedValue(null)

    const result = await getUserProfile()

    expect(result).toBeNull()
  })

  it('returns user profile with custom image', async () => {
    const mockUser = {
      id: 'user-789',
      customImage: 'data:image/webp;base64,ABC123',
      image: 'https://oauth.example.com/avatar.jpg',
    }

      ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const result = await getUserProfile()

    expect(result).toEqual({
      customImage: 'data:image/webp;base64,ABC123',
      id: 'user-789',
      image: 'https://oauth.example.com/avatar.jpg',
    })
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-789' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        customImage: true,
        weight: true,
      },
    })
  })

  it('returns user profile with OAuth image only', async () => {
    const mockUser = {
      id: 'user-789',
      customImage: null,
      image: 'https://oauth.example.com/avatar.jpg',
    }

      ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const result = await getUserProfile()

    expect(result).toEqual({
      customImage: null,
      id: 'user-789',
      image: 'https://oauth.example.com/avatar.jpg',
    })
  })

  it('returns null when user is not found in database', async () => {
    ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await getUserProfile()

    expect(result).toBeNull()
  })

  it('returns profile with no images', async () => {
    const mockUser = {
      id: 'user-789',
      customImage: null,
      image: null,
    }

      ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const result = await getUserProfile()

    expect(result).toEqual({
      customImage: null,
      id: 'user-789',
      image: null,
    })
  })
})

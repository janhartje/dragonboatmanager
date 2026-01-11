# Custom Profile Pictures

The application supports custom profile picture uploads through Next.js Server Actions (not REST endpoints):

## Upload Profile Image
- **Action**: `uploadProfileImage(base64Image: string)`
- **Description**: Upload a custom profile picture stored as base64 in the database
- **Authentication**: Required (JWT session)
- **Validation**: 
  - Max file size: 2MB
  - Allowed formats: JPEG, PNG, WebP, GIF
  - Server-side validation: Magic bytes check using file-type library
  - Server-side processing: Re-processed with Sharp (400x400, WebP, metadata stripped)
- **Priority**: Custom images take priority over OAuth provider images

## Delete Profile Image
- **Action**: `deleteProfileImage()`
- **Description**: Remove custom profile picture (falls back to OAuth provider image)
- **Authentication**: Required (JWT session)

## Avatar Image Endpoint
The `/api/users/[userId]/avatar` endpoint serves profile images efficiently:

- **Endpoint**: `GET /api/users/{userId}/avatar`
- **Description**: Dedicated endpoint for serving user avatars (custom or OAuth)
- **Priority**: Returns custom image if available, otherwise OAuth image
- **Response**: Binary image data or redirect to OAuth provider URL
- **Caching**: Includes cache headers for optimal performance
- **Note**: This endpoint reduces payload size in list APIs by serving images separately

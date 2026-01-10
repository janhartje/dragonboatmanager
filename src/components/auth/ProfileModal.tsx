
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { updateProfile, uploadProfileImage, deleteProfileImage, getUserProfile } from "@/app/actions/user"
import { Save, X, Info, Upload, Trash2, Camera } from "lucide-react"
import { useTranslations } from 'next-intl';
import { useDrachenboot } from "@/context/DrachenbootContext"
import { useTeam } from '@/context/TeamContext';
import { FormInput } from "@/components/ui/FormInput"
import { WeightInput } from "@/components/ui/WeightInput"
import { SkillSelector, SkillsState } from "@/components/ui/SkillSelector"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ConfirmModal, AlertModal } from "@/components/ui/Modals"
import { triggerProfileRefresh } from "@/hooks/useUserProfile"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: session } = useSession()
  const t = useTranslations()
  const { currentTeam } = useTeam();
  const { paddlers, refetchPaddlers } = useDrachenboot()
  const [name, setName] = useState("")
  const [weight, setWeight] = useState("")
  const [skills, setSkills] = useState<SkillsState>({ left: false, right: false, drum: false, steer: false })
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load current user's data from their paddler record
  useEffect(() => {
    if (session?.user?.id && paddlers.length > 0) {
      const myPaddler = paddlers.find(p => p.userId === session.user.id)
      if (myPaddler) {
        if (myPaddler.weight) setWeight(myPaddler.weight.toString())
        const sObj: SkillsState = { left: false, right: false, drum: false, steer: false }
        if (myPaddler.skills) myPaddler.skills.forEach((s) => {
          if (s in sObj) sObj[s as keyof typeof sObj] = true
        })
        setSkills(sObj)
      }
    }
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session?.user?.id, session?.user?.name, paddlers, isOpen])

  // Separate effect for image preview - fetch from server
  useEffect(() => {
    const loadImage = async () => {
      if (session?.user?.id && isOpen) {
        try {
          const userProfile = await getUserProfile()
          if (userProfile) {
            const currentImage = userProfile.customImage || userProfile.image || null
            setImagePreview(currentImage)
          }
        } catch {
          // Silently fall back to session image if fetch fails
          setImagePreview(null)
        }
      }
    }
    loadImage()
  }, [session?.user?.id, isOpen])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [success, onClose])

  const handleSkillChange = (skill: keyof SkillsState) => {
    setSkills(prev => ({ ...prev, [skill]: !prev[skill] }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t('invalidFileType') || 'Please select an image file')
      setShowErrorAlert(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(t('fileTooLarge') || 'Image must be less than 2MB')
      setShowErrorAlert(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploadingImage(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      
      reader.onerror = () => {
        setErrorMessage(t('imageUploadFailed') || 'Failed to upload image')
        setShowErrorAlert(true)
        setIsUploadingImage(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
      
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        // Create a temporary image to resize
        const img = new Image()
        
        img.onerror = () => {
          setErrorMessage(t('imageUploadFailed') || 'Failed to upload image')
          setShowErrorAlert(true)
          setIsUploadingImage(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
        
        img.onload = async () => {
          try {
            // Resize to max 400x400
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const maxSize = 400

            if (width > height) {
              if (width > maxSize) {
                height *= maxSize / width
                width = maxSize
              }
            } else {
              if (height > maxSize) {
                width *= maxSize / height
                height = maxSize
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              setErrorMessage(t('imageUploadFailed') || 'Failed to upload image')
              setShowErrorAlert(true)
              setIsUploadingImage(false)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              return
            }
            
            ctx.drawImage(img, 0, 0, width, height)

            // Convert to base64
            const resizedBase64 = canvas.toDataURL(file.type, 0.9)
            
            // Upload to server
            await uploadProfileImage(resizedBase64)
            
            // Reload profile to get updated image
            const userProfile = await getUserProfile()
            if (userProfile) {
              setImagePreview(userProfile.customImage || userProfile.image || null)
            }
            
            // Trigger refresh in all useUserProfile hooks (e.g., UserMenu)
            triggerProfileRefresh()
            
            setIsUploadingImage(false)
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          } catch (uploadError) {
            setErrorMessage(t('imageUploadFailed') || 'Failed to upload image')
            setShowErrorAlert(true)
            setIsUploadingImage(false)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }
        }
        img.src = base64String
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setErrorMessage(t('imageUploadFailed') || 'Failed to upload image')
      setShowErrorAlert(true)
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async () => {
    setShowDeleteConfirm(false)
    setIsUploadingImage(true)
    try {
      await deleteProfileImage()
      
      // Reload profile to get updated image (should be null or OAuth image)
      const userProfile = await getUserProfile()
      if (userProfile) {
        // After delete, show OAuth image or null (which will show fallback)
        setImagePreview(userProfile.image || null)
      } else {
        // If no profile, clear the image preview
        setImagePreview(null)
      }
      
      // Trigger refresh in all useUserProfile hooks (e.g., UserMenu)
      triggerProfileRefresh()
    } catch (_error) {
      setErrorMessage(t('imageDeleteFailed') || 'Failed to delete image')
      setShowErrorAlert(true)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !weight.trim()) return

    setIsSaving(true)
    setSuccess(false)

    try {
      const skillsArray = (Object.keys(skills) as Array<keyof typeof skills>).filter(k => skills[k])
      await updateProfile({ name, weight: parseFloat(weight), skills: skillsArray }, currentTeam?.id)
      await refetchPaddlers() // Refresh paddler data
      setSuccess(true)
    } catch (error) {
      console.error("Failed to update profile", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !session) return null

  const isFormValid = name.trim() !== '' && weight.trim() !== ''
  // Show delete button if there's a custom image in preview that's different from OAuth image
  const hasCustomImage = imagePreview !== null && imagePreview !== session?.user?.image && imagePreview?.startsWith('data:image/')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('profile') || 'Profile'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-slate-300 dark:border-slate-700">
                {imagePreview && <AvatarImage src={imagePreview} alt={name} />}
                <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-2xl text-slate-500 dark:text-slate-400">
                  {name ? name.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
              >
                <Camera size={16} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Upload size={12} />
                {isUploadingImage ? t('uploading') || 'Uploading...' : t('uploadImage') || 'Upload'}
              </button>
              {hasCustomImage && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUploadingImage}
                  className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {t('delete') || 'Delete'}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {t('profileImageHint') || 'Max 2MB, JPEG/PNG/WebP/GIF'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  {t('name')}
                </label>
              </div>
              <FormInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name')}
              />
            </div>
            <div className="w-full md:w-32">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                {t('weight')}
              </label>
              <WeightInput
                value={weight}
                onChange={setWeight}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg -mt-2 mb-4">
            <Info size={14} className="shrink-0" />
            <span>{t('profileGlobalHint')}</span>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">
              {t('skills')}
            </label>
            <SkillSelector
              skills={skills}
              onChange={handleSkillChange}
            />
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg mt-3">
              <Info size={14} className="shrink-0" />
              <span>{t('profileLocalHint')}</span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !isFormValid}
              className={`w-full sm:w-auto h-9 px-6 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all
                ${success
                  ? 'bg-green-500 text-white'
                  : isFormValid
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
                }`}
            >
              <Save size={16} />
              {isSaving ? t('saving') : success ? t('saved') : t('save')}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteImage}
        title={t('confirmDeleteImage') || 'Delete Profile Picture'}
        message={t('confirmDeleteImageMessage') || 'Are you sure you want to delete your profile picture? This action cannot be undone.'}
        isDestructive
        isLoading={isUploadingImage}
      />

      <AlertModal
        isOpen={showErrorAlert}
        onClose={() => setShowErrorAlert(false)}
        title={t('error') || 'Error'}
        message={errorMessage}
        type="error"
      />
    </div>
  )
}

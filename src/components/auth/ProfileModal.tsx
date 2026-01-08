
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateProfile } from "@/app/actions/user"
import { Save, X, Info } from "lucide-react"
import { useTranslations } from 'next-intl';
import { useDrachenboot } from "@/context/DrachenbootContext"
import { useTeam } from '@/context/TeamContext';
import { FormInput } from "@/components/ui/FormInput"
import { WeightInput } from "@/components/ui/WeightInput"
import { SkillSelector, SkillsState } from "@/components/ui/SkillSelector"

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
    </div>
  )
}

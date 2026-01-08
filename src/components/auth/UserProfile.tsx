"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateProfile } from "@/app/actions/user"
import { Save, Check } from "lucide-react"
import { useTranslations } from 'next-intl';
import { useDrachenboot } from "@/context/DrachenbootContext"

import { FormInput } from "@/components/ui/FormInput"

export function UserProfile() {
  const { data: session, update } = useSession()
  const t = useTranslations();
  const { paddlers, refetchPaddlers } = useDrachenboot()
  const [name, setName] = useState(session?.user?.name || "")
  const [weight, setWeight] = useState<string | number>("")
  const [skills, setSkills] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Load current user's data from their paddler record
  useEffect(() => {
    if (session?.user?.id && paddlers.length > 0) {
      const myPaddler = paddlers.find(p => p.userId === session.user.id)
      if (myPaddler) {
        if (myPaddler.skills) setSkills(myPaddler.skills)
        if (myPaddler.weight) setWeight(myPaddler.weight)
      }
    }
  }, [session?.user?.id, paddlers])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    
    try {
      await updateProfile({ name, weight: parseFloat(weight.toString()), skills })
      await update() // Update session
      await refetchPaddlers() // Refresh paddler data
      setSuccess(true)
    } catch (error) {
      console.error("Failed to update profile", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) return null

  const skillOptions = [
    { id: 'left', label: t('left') || 'Left', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' },
    { id: 'right', label: t('right') || 'Right', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' },
    { id: 'drum', label: t('drummer') || 'Drummer', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700' },
    { id: 'steer', label: t('steer') || 'Steer', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('name') || 'Name'}
        </label>
        <FormInput 
          id="name" 
          value={name} 
          onChange={(e) => {
            setName(e.target.value);
            setSuccess(false);
          }}
          className="focus:ring-amber-500"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('weightKg') || 'Weight (kg)'}
        </label>
        <FormInput 
          id="weight" 
          type="number" 
          value={weight} 
          onChange={(e) => {
            setWeight(e.target.value);
            setSuccess(false);
          }}
          className="focus:ring-amber-500"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('weightDisclaimer')}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('skills') || 'Skills'}
        </label>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map(skill => (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggleSkill(skill.id)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                skills.includes(skill.id)
                  ? skill.color
                  : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 opacity-60 hover:opacity-100'
              }`}
            >
              {skill.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('skillsDisclaimer') || 'Select your paddling skills'}
        </p>
      </div>
      
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving || success}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${success 
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' 
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
            }
          `}
        >
          {success ? (
            <>
              <Check size={18} />
              {t('saved') || 'Saved'}
            </>
          ) : (
            <>
              <Save size={18} />
              {isSaving ? t('saving') : (t('saveProfile') || 'Save Profile')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

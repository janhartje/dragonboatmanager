"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateProfile } from "@/app/actions/user"
import { Save, Check } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"

import { FormInput } from "@/components/ui/FormInput"

export function UserProfile() {
  const { data: session, update } = useSession()
  const { t } = useLanguage()
  const [name, setName] = useState(session?.user?.name || "")
  const [weight, setWeight] = useState(session?.user?.weight || "")
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    
    try {
      await updateProfile({ name, weight: parseFloat(weight.toString()) })
      await update() // Update session
      setSuccess(true)
    } catch (error) {
      console.error("Failed to update profile", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

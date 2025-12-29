"use client"

import { useState } from "react"

import { FormInput } from "@/components/ui/FormInput"
import { Label } from "@/components/ui/label"
import { inviteMember } from "@/app/actions/team"
import { useLanguage } from "@/context/LanguageContext"
import { Loader2, Check, Mail } from "lucide-react"

interface InviteMemberFormProps {
  teamId: string
  onSuccess?: () => void
}

export function InviteMemberForm({ teamId, onSuccess }: InviteMemberFormProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    try {
      await inviteMember(teamId, email)
      setStatus("success")
      setEmail("")
      // Call onSuccess callback to refresh the member list
      onSuccess?.()
    } catch (error) {
      setStatus("error")
      if (error instanceof Error) {
        if (error.message === "USER_NOT_FOUND") {
          setErrorMessage(t('errorUserNotFound'))
        } else if (error.message === "USER_ALREADY_MEMBER") {
          setErrorMessage(t('errorUserAlreadyMember'))
        } else {
          setErrorMessage(error.message)
        }
      } else {
        setErrorMessage(t('invitationFailed'))
      }
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('emailAddress')}</Label>
          <div className="flex gap-2">
            <FormInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder') || 'paddler@example.com'}
              className="flex-1 focus:ring-amber-500"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${status === 'success'
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                }
              `}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('inviting')}
                </>
              ) : status === 'success' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('invitationSuccess') || 'Sent!'}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t('invite')}
                </>
              )}
            </button>
          </div>
        </div>
        {status === "success" && (
          <p className="text-sm text-green-600">{t('invitationSuccess')}</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    </div>
  )
}

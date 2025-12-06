"use client"

import { useState, useRef, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, DoorOpen, HelpCircle } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import { useDrachenboot } from "@/context/DrachenbootContext"
import { ConfirmModal } from "@/components/ui/Modals"
import { ProfileModal } from "./ProfileModal"

export function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { currentTeam, userRole, deletePaddler, paddlers } = useDrachenboot()
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLeaveTeam = async () => {
    if (!currentTeam || !session?.user?.id) return
    
    // Find my paddler ID
    const myPaddler = paddlers.find(p => p.userId === session.user.id)
    if (myPaddler) {
      await deletePaddler(myPaddler.id)
      setShowLeaveConfirm(false)
      // Force reload to update team list/context
      window.location.reload()
    }
  }

  if (!session?.user) {
    return (
      <button 
        onClick={() => router.push("/login")}
        className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        {t('login')}
      </button>
    )
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Avatar className="h-full w-full">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
            <AvatarFallback>{session.user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 mb-1">
                <p className="text-slate-900 dark:text-slate-100 leading-none">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {session.user.email}
                </p>
              </div>
              
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
              
              <button
                onClick={() => {
                  setShowProfileModal(true)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User size={16} />
                <span>{t('profile') || 'Profile'}</span>
              </button>

              <button
                onClick={() => {
                  router.push('/help')
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <HelpCircle size={16} />
                <span>{t('helpCenterTitle') || 'Help Center'}</span>
              </button>

              {/* Leave Team Option - Only for Paddlers (not Captains) and when inside a team */}
              {currentTeam && userRole !== 'CAPTAIN' && (
                <button
                  onClick={() => {
                    setShowLeaveConfirm(true)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  <DoorOpen size={16} />
                  <span>{t('leaveTeam')}</span>
                </button>
              )}
              
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

              <button
                onClick={() => signOut()}
                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                <span>{t('logout') || 'Log out'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      <ConfirmModal
        isOpen={showLeaveConfirm}
        onCancel={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveTeam}
        title={t('confirmLeaveTeamTitle')}
        message={t('confirmLeaveTeamBody')}
        confirmLabel={t('confirmLeaveTeamButton')}
        isDestructive
      />
    </>
  )
}

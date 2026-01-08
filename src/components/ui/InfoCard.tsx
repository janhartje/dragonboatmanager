'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { dismissInfoCard, getDismissedCards } from '@/app/actions/infocards';
import { useTranslations } from 'next-intl';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useSession } from 'next-auth/react';

interface InfoCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  allowedRoles?: ('CAPTAIN' | 'PADDLER')[];
  allowedSkills?: string[];
}

export function InfoCard({ id, children, className = '', allowedRoles, allowedSkills }: InfoCardProps) {
  const [isVisible, setIsVisible] = useState(false); // Default hidden to prevent flash of dismissed content
  const [hasChecked, setHasChecked] = useState(false);
  const t = useTranslations();
  const { userRole, currentPaddler } = useDrachenboot();
  const { status } = useSession();

  // Role and Skill Check
  const isAllowed = React.useMemo(() => {
    // If not authenticated yet, wait (or hide). Return false to be safe until loaded.
    if (status === 'loading') return false; 
    
    // Role Check
    if (allowedRoles && userRole) {
      if (!allowedRoles.includes(userRole)) return false;
    }
    
    // Skill Check
    if (allowedSkills && currentPaddler) {
      const hasSkill = currentPaddler.skills.some(skill => allowedSkills.includes(skill));
      if (!hasSkill) return false;
    } else if (allowedSkills && !currentPaddler) {
        // If skills required but no paddler profile (e.g. admin or new user), maybe hide?
        return false;
    }

    return true;
  }, [allowedRoles, allowedSkills, userRole, currentPaddler, status]);

  useEffect(() => {
    let mounted = true;
    
    async function checkStatus() {
      try {
        const dismissed = await getDismissedCards([id]);
        if (mounted) {
          if (!dismissed.includes(id)) {
            setIsVisible(true);
          }
          setHasChecked(true);
        }
      } catch (error) {
        console.error('InfoCard check error:', error);
        // On error, show card? Or hide? Let's show it to be safe (so user doesn't miss info).
        if (mounted) {
            setIsVisible(true);
            setHasChecked(true);
        }
      }
    }

    checkStatus();

    return () => { mounted = false; };
  }, [id]);

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false); // Optimistic update
    try {
      await dismissInfoCard(id);
    } catch (error) {
      console.error('InfoCard dismiss error:', error);
      // Revert if failed? Nah, just log it. UX is more important.
    }
  };

  if (!hasChecked) return null; // Avoid layout shift? Or render placeholder? 
  // Returning null avoids flash of content that might be dismissed.
  
  if (!hasChecked) return null; // Avoid layout shift? Or render placeholder? 
  // Returning null avoids flash of content that might be dismissed.
  
  if (!isVisible || !isAllowed) return null;

  return (
    <div className={`relative group ${className}`}>
      <button 
         onClick={handleDismiss}
         className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 z-10"
         title={t('dismiss') || "Dismiss"}
      >
          <X size={16} />
      </button>
      {children}
    </div>
  );
}

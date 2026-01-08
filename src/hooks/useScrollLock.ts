import { useEffect, useId } from 'react';

// Global Set to track active locks
const lockedIds = new Set<string>();

export const useScrollLock = (isOpen: boolean) => {
  const id = useId();

  useEffect(() => {
    if (isOpen) {
      lockedIds.add(id);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      lockedIds.delete(id);
      if (lockedIds.size === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, id]);
};

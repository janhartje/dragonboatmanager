import React, { useState } from 'react';
import { ImprintModal, ChangelogModal } from './Modals';

const Footer = () => {
  const [showImprint, setShowImprint] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 pb-8">
        <div className="flex justify-center gap-4 mb-2">
          <button onClick={() => setShowImprint(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Impressum</button>
          <span>•</span>
          <button onClick={() => setShowChangelog(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Changelog</button>
        </div>
        <p>&copy; {new Date().getFullYear()} Drachenboot Manager. Made with ❤️ in Hannover.</p>
      </footer>

      {showImprint && <ImprintModal onClose={() => setShowImprint(false)} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
};

export default Footer;

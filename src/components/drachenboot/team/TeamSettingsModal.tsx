import React, { useState, useEffect } from 'react';
import { Team } from '@/types';
import { X, Save, Globe, Instagram, Facebook, Twitter, Mail, Image as ImageIcon } from 'lucide-react';

interface TeamSettingsModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Team>) => Promise<void>;
  t: (key: string) => string;
}

const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({ team, isOpen, onClose, onSave, t }) => {
  const [formData, setFormData] = useState<Partial<Team>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && team) {
      setFormData({
        name: team.name,
        website: team.website || '',
        icon: team.icon || '',
        instagram: team.instagram || '',
        facebook: team.facebook || '',
        twitter: team.twitter || '',
        email: team.email || '',
      });
    }
  }, [isOpen, team]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save team settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof Team, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {t('teamSettings') || 'Team Einstellungen'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('teamName') || 'Team Name'}
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Globe size={16} /> Website
            </label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Icon URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <ImageIcon size={16} /> Icon URL
            </label>
            <input
              type="url"
              value={formData.icon || ''}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Social Media Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
              Social Media
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Instagram size={18} className="text-pink-600" />
                <input
                  type="text"
                  value={formData.instagram || ''}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="Instagram Username/URL"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Facebook size={18} className="text-blue-600" />
                <input
                  type="text"
                  value={formData.facebook || ''}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  placeholder="Facebook URL"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Twitter size={18} className="text-sky-500" />
                <input
                  type="text"
                  value={formData.twitter || ''}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  placeholder="Twitter/X Handle"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-600 dark:text-slate-400" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Contact Email"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {t('cancel') || 'Abbrechen'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isLoading ? 'Saving...' : (t('save') || 'Speichern')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamSettingsModal;

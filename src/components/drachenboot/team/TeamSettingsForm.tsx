import React, { useState, useEffect } from 'react';
import { Team } from '@/types';
import { Save, Globe, Instagram, Facebook, Twitter, Mail, Image as ImageIcon, Check } from 'lucide-react';

interface TeamSettingsFormProps {
  initialData: Partial<Team>;
  onSave: (data: Partial<Team>) => Promise<void>;
  onCancel?: () => void;
  t: (key: string) => string;
  className?: string;
}

const TeamSettingsForm: React.FC<TeamSettingsFormProps> = ({ initialData, onSave, onCancel, t, className = '' }) => {
  const [formData, setFormData] = useState<Partial<Team>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);
    try {
      await onSave(formData);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to save team settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof Team, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
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

      {/* Icon Upload */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <ImageIcon size={16} /> Icon
        </label>
        
        <div className="flex items-center gap-4">
          {formData.icon && (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <img 
                src={formData.icon} 
                alt="Team Icon" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleChange('icon', '')}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
              >
                <span className="text-xs">Remove</span>
              </button>
            </div>
          )}
          
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    alert(t('imageTooLarge') || 'Image too large (max 5MB)');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    handleChange('icon', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full text-sm text-slate-500 dark:text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/30 dark:file:text-blue-400
              "
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Max. 5MB. Formats: JPG, PNG, GIF, WebP.
            </p>
          </div>
        </div>
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
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {t('cancel') || 'Abbrechen'}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || success}
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
              {t('saved') || 'Gespeichert'}
            </>
          ) : (
            <>
              <Save size={18} />
              {isLoading ? 'Saving...' : (t('save') || 'Speichern')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TeamSettingsForm;

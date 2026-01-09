import React, { useState, useEffect } from 'react';
import { Team } from '@/types';
import { Save, Globe, Instagram, Facebook, Twitter, Mail, Image as ImageIcon, Check, Palette, Sparkles, Calendar, RefreshCw } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';
import { SyncHistoryList } from './SyncHistoryList';

import { FormInput } from '@/components/ui/FormInput';
import { Toggle } from '@/components/ui/core/Toggle';
import { SettingsItem } from '@/components/ui/core/SettingsItem';

interface TeamSettingsFormProps {
  initialData: Partial<Team>;
  onSave: (data: Partial<Team>) => Promise<void>;
  onCancel?: () => void;
  t: (key: string) => string;
  className?: string;
}

const TeamSettingsForm: React.FC<TeamSettingsFormProps> = ({ initialData, onSave, onCancel, t, className = '' }) => {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState<Partial<Team>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

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

  const handleSync = async () => {
    if (!formData.id) return;
    setIsSyncing(true);
    try {
        const res = await fetch(`/api/teams/${formData.id}/import/ical`, { method: 'POST' });
        if (!res.ok) throw new Error('Sync failed');
        const data = await res.json();
        
        let successMsg = t('icalSyncResult') || `Success: ${data.created} created, ${data.updated} updated, ${data.deleted} deleted.`;
        successMsg = successMsg
            .replace('{created}', data.created.toString())
            .replace('{updated}', data.updated.toString())
            .replace('{deleted}', (data.deleted || 0).toString());

        showAlert(successMsg, 'success');
        setRefreshHistory(prev => prev + 1);
    } catch (error) {
        console.error(error);
        showAlert(t('icalSyncError') || 'Sync failed', 'error');
        setRefreshHistory(prev => prev + 1);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleChange = (field: keyof Team, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const THEMES = [
    { id: 'amber', name: t('pro.themes.amber') || 'Amber', class: 'bg-amber-500' },
    { id: 'blue', name: t('pro.themes.blue') || 'Ocean', class: 'bg-blue-500' },
    { id: 'rose', name: t('pro.themes.rose') || 'Rose', class: 'bg-rose-500' },
    { id: 'emerald', name: t('pro.themes.emerald') || 'Emerald', class: 'bg-emerald-500' },
    { id: 'teal', name: t('pro.themes.teal') || 'Teal', class: 'bg-teal-500' },
    { id: 'indigo', name: t('pro.themes.indigo') || 'Indigo', class: 'bg-indigo-600' },
    { id: 'violet', name: t('pro.themes.violet') || 'Violet', class: 'bg-violet-500' },
    { id: 'orange', name: t('pro.themes.orange') || 'Orange', class: 'bg-orange-500' },
    { id: 'slate', name: t('pro.themes.slate') || 'Slate', class: 'bg-slate-700' },
    { id: 'zinc', name: t('pro.themes.zinc') || 'Zinc', class: 'bg-zinc-600' },
  ];

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Team Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('teamName') || 'Team Name'}
        </label>
        <FormInput
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          className="focus:ring-amber-500"
          required
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Globe size={16} /> {t('pro.website') || 'Website'}
        </label>
        <FormInput
          type="url"
          value={formData.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://example.com"
          className="focus:ring-amber-500"
        />
      </div>

      {/* Icon Upload */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <ImageIcon size={16} /> {t('pro.icon') || 'Icon'}
        </label>
        
        <div className="flex items-center gap-4">
          {formData.icon && (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
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
                <span className="text-xs">{t('pro.remove') || 'Remove'}</span>
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
                    showAlert(t('imageTooLarge') || 'Image too large (max 5MB)', 'error');
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
              {t('pro.imageFormats') || 'Max. 5MB. Formats: JPG, PNG, GIF, WebP.'}
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          {t('pro.socialMedia') || 'Social Media'}
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Instagram size={18} className="text-pink-600" />
            <FormInput
              type="text"
              value={formData.instagram || ''}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder={t('pro.instagramPlaceholder') || 'Instagram Username/URL'}
              className="flex-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Facebook size={18} className="text-blue-600" />
            <FormInput
              type="text"
              value={formData.facebook || ''}
              onChange={(e) => handleChange('facebook', e.target.value)}
              placeholder={t('pro.facebookPlaceholder') || 'Facebook URL'}
              className="flex-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Twitter size={18} className="text-sky-500" />
            <FormInput
              type="text"
              value={formData.twitter || ''}
              onChange={(e) => handleChange('twitter', e.target.value)}
              placeholder={t('pro.twitterPlaceholder') || 'Twitter/X Handle'}
              className="flex-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Mail size={18} className="text-slate-600 dark:text-slate-400" />
            <FormInput
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('pro.contactEmail') || 'Contact Email'}
              className="flex-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* PRO Customization - ONLY IF PRO */}
      {initialData.plan === 'PRO' && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} /> {t('pro.proCustomization') || 'PRO Customization'}
          </h3>
          
          <div className="space-y-4">
            {/* Color Theme */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Palette size={16} /> {t('pro.accentColor') || 'Accent Color'}
              </label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleChange('primaryColor', theme.id)}
                    className={`w-10 h-10 rounded-full ${theme.class} border-2 transition-all transform sm:hover:scale-110 active:scale-95 flex items-center justify-center
                      ${formData.primaryColor === theme.id || (!formData.primaryColor && theme.id === 'amber')
                        ? 'border-slate-800 dark:border-slate-500 ring-2 ring-slate-200 dark:ring-slate-800/60' 
                        : 'border-transparent'
                      }
                    `}
                    title={theme.name}
                  >
                    {(formData.primaryColor === theme.id || (!formData.primaryColor && theme.id === 'amber')) && (
                      <Check size={16} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Ring Toggle */}
            <SettingsItem
              label={t('pro.showPremiumRing') || 'Show Premium Logo Ring'}
              description={t('pro.showPremiumRingDesc') || 'Show a shimmering golden ring around your team logo.'}
            >
              <Toggle 
                enabled={formData.showProRing !== false} 
                onChange={(enabled) => handleChange('showProRing', enabled)}
                activeColor="bg-amber-500"
                focusColor="focus:ring-amber-500"
              />
            </SettingsItem>

            {/* Show PRO Badge Toggle */}
            <SettingsItem
              label={t('pro.showProBadge') || 'Show PRO Badge'}
              description={t('pro.showProBadgeDesc') || 'Displays the PRO badge in the header and team switcher.'}
            >
              <Toggle 
                enabled={formData.showProBadge !== false} 
                onChange={(enabled) => handleChange('showProBadge', enabled)}
                activeColor="bg-amber-500"
                focusColor="focus:ring-amber-500"
              />
            </SettingsItem>

            {/* Show Watermark Toggle */}
            <SettingsItem
              label={t('pro.showWatermark') || 'Show branding on exports'}
              description={t('pro.showWatermarkDesc') || 'Shows "Created with Drachenboot Manager" on image exports.'}
            >
              <Toggle 
                enabled={formData.showWatermark !== false} 
                onChange={(enabled) => handleChange('showWatermark', enabled)}
                activeColor="bg-amber-500"
                focusColor="focus:ring-amber-500"
              />
            </SettingsItem>
          </div>
        </div>
      )}

      {/* Public Visibility */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          {t('pro.publicVisibility') || 'Public Visibility'}
        </h3>
        
        <SettingsItem
          label={t('pro.showOnWebsite') || 'Show on Website'}
          description={t('pro.showOnWebsiteDesc') || 'Display your team logo and name on the public landing page as a reference for other teams.'}
        >
          <Toggle 
            enabled={formData.showOnWebsite === true} 
            onChange={(enabled) => handleChange('showOnWebsite', enabled)}
            activeColor="bg-blue-500"
            focusColor="focus:ring-blue-500"
          />
        </SettingsItem>
      </div>

      {/* iCal Integration */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} /> iCal Integration
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('icalDescription') || 'Synchronize training sessions automatically from an external calendar (e.g. Kadermanager).'}
        </p>

        <div className="flex gap-2">
            <div className="flex-1">
                <FormInput
                    type="url"
                    value={formData.icalUrl || ''}
                    onChange={(e) => handleChange('icalUrl', e.target.value)}
                    placeholder="https://.../calendar.ics"
                    className="focus:ring-amber-500"
                />
            </div>
            {formData.icalUrl && formData.icalUrl === initialData.icalUrl && (
                 <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? (t('icalSyncing') || 'Syncing...') : (t('icalSyncButton') || 'Sync Now')}
                 </button>
            )}
        </div>
        {formData.icalUrl !== initialData.icalUrl && formData.icalUrl && (
            <p className="text-xs text-amber-600 mt-1">
                {t('icalSaveToSync') || 'Please save changes before syncing.'}
            </p>
        )}
        
        {formData.id && (
            <SyncHistoryList 
                teamId={formData.id} 
                refreshTrigger={refreshHistory} 
                t={t} 
            />
        )}
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

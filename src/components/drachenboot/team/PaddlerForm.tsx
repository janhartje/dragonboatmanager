import React, { useState, useEffect } from 'react';
import { User, Pencil, Save, Plus, Link as LinkIcon, Mail, Loader2, Check } from 'lucide-react';
import { Paddler } from '@/types';
import { FormInput } from '@/components/ui/FormInput';
import { WeightInput } from '@/components/ui/WeightInput';
import { SkillSelector, SkillsState } from '@/components/ui/SkillSelector';
import { linkPaddlerToAccount } from '@/app/actions/team';
import { useDrachenboot } from '@/context/DrachenbootContext';

interface PaddlerFormProps {
  paddlerToEdit: Paddler | null;
  onSave: (paddler: any) => void;
  onCancel: () => void;
  t: (key: string) => string;
  teamMembers?: any[];
  isModal?: boolean;
  isGuest?: boolean;
}

const PaddlerForm: React.FC<PaddlerFormProps> = ({ paddlerToEdit, onSave, onCancel, t, teamMembers = [], isModal = false, isGuest = false }) => {
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [skills, setSkills] = useState<SkillsState>({ left: false, right: false, drum: false, steer: false });
  const [userId, setUserId] = useState<string>('');
  const [linkEmail, setLinkEmail] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [touched, setTouched] = useState(false);
  const { refetchPaddlers } = useDrachenboot();

  useEffect(() => {
    if (paddlerToEdit) {
      setName(paddlerToEdit.name);
      setWeight(paddlerToEdit.weight.toString());
      const sObj = { left: false, right: false, drum: false, steer: false };
      if (paddlerToEdit.skills) paddlerToEdit.skills.forEach((s) => {
        if (s in sObj) sObj[s as keyof typeof sObj] = true;
      });
      setSkills(sObj);
      setUserId(paddlerToEdit.userId || '');
      setLinkEmail('');
      setLinkError(null);
      setLinkSuccess(false);
    } else {
      resetForm();
    }
  }, [paddlerToEdit]);

  const resetForm = () => {
    setName('');
    setWeight('');
    setSkills({ left: false, right: false, drum: false, steer: false });
    setUserId('');
    setLinkEmail('');
    setLinkError(null);
    setLinkSuccess(false);
    setTouched(false);
  };

  const handleSkillChange = (skill: keyof SkillsState) => {
    setSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));
  };

  const isFormValid = name.trim() !== '' && weight.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!isFormValid) return;

    const skillsArray = (Object.keys(skills) as Array<keyof typeof skills>).filter((k) => skills[k]);
    
    onSave({ 
      name, 
      weight: parseFloat(weight), 
      skills: skillsArray,
      userId: userId || null
    });
    if (!paddlerToEdit) resetForm();
  };

  const handleLinkAccount = async () => {
    if (!linkEmail.trim() || !paddlerToEdit) return;
    
    setIsLinking(true);
    setLinkError(null);
    
    try {
      const result = await linkPaddlerToAccount(paddlerToEdit.id as string, linkEmail.trim());
      setLinkSuccess(true);
      await refetchPaddlers();
      
      // Close the form after a delay
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (e: any) {
      if (e.message === 'USER_ALREADY_MEMBER') {
        setLinkError(t('userAlreadyMember') || 'User is already a team member');
      } else if (e.message === 'PADDLER_ALREADY_LINKED') {
        setLinkError(t('paddlerAlreadyLinked') || 'Paddler is already linked to an account');
      } else {
        setLinkError(e.message || t('linkError') || 'Failed to link account');
      }
    } finally {
      setIsLinking(false);
    }
  };

  const containerClasses = isModal 
    ? "p-6" 
    : `p-6 rounded-xl shadow-sm border transition-all h-full ${paddlerToEdit ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 ring-1 ring-orange-200 dark:ring-orange-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`;

  return (
    <div id="tour-paddler-form" className={containerClasses}>
      {!isModal && (
        <h3 className={`font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide ${paddlerToEdit ? 'text-orange-800 dark:text-orange-200' : 'text-slate-700 dark:text-slate-200'}`}>
          {paddlerToEdit ? <Pencil size={16} /> : <User size={16} />} {paddlerToEdit ? t('editPaddler') : t('newMember')}
        </h3>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('name')}</label>
            <FormInput
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('name')}
              error={touched && !name.trim()}
            />
          </div>
          <div className="w-full md:w-32">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('weight')}</label>
            <WeightInput
              value={weight} 
              onChange={setWeight} 
            />
          </div>
        </div>
        
        {/* Account Linking Section */}
        {!isGuest && paddlerToEdit && (
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1">
            <LinkIcon size={12} /> {t('linkedAccount') || 'Linked Account'}
          </label>
          
          {userId ? (
            // Already linked - show read-only email
            <div className="w-full p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check size={14} />
              {teamMembers.find(m => m.userId === userId)?.email || paddlerToEdit.user?.email || t('accountLinked') || 'Account Linked'}
            </div>
          ) : linkSuccess ? (
            // Just linked successfully
            <div className="w-full p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check size={14} />
              {t('accountLinkedSuccess') || 'Account linked successfully!'}
            </div>
          ) : (
            // Not linked - show input to link
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormInput
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder={t('emailToLink') || 'Enter email to link'}
                    disabled={isLinking}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLinkAccount}
                  disabled={!linkEmail.trim() || isLinking}
                  className={`h-10 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    linkEmail.trim() && !isLinking
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLinking ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  {t('link') || 'Link'}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('linkAccountHint') || 'If the email has an account, the paddler will be linked. Otherwise, an invitation will be sent.'}
              </p>
              {linkError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                  {linkError}
                </div>
              )}
            </>
          )}
        </div>
        )}

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">{t('skills')}</label>
          <SkillSelector 
            skills={skills} 
            onChange={handleSkillChange} 
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 justify-end">
          {(!isModal && paddlerToEdit) && <button type="button" onClick={onCancel} className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm">{t('cancel')}</button>}
          {isModal && <button type="button" onClick={onCancel} className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm">{t('cancel')}</button>}
          <button 
            type="submit" 
            className={`w-full sm:w-auto h-9 px-6 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all
              ${isFormValid 
                ? (paddlerToEdit ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white') 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
              }`}
          >
            {paddlerToEdit ? <Save size={16} /> : <Plus size={16} />} {paddlerToEdit ? t('save') : t('add')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaddlerForm;

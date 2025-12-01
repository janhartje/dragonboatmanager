import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

const AddGuestModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [skills, setSkills] = useState({ left: false, right: false, drum: false, steer: false });

  const toggleSkill = (s) => setSkills((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !weight) return;
    const skillsArr = Object.keys(skills).filter((k) => skills[k]);
    if (skillsArr.length === 0) {
      alert('Bitte mind. eine Rolle wählen');
      return;
    }
    onAdd({ name, weight: parseFloat(weight), skills: skillsArr });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} /> Gast hinzufügen
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Name</label>
            <input autoFocus className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={name} onChange={(e) => setName(e.target.value)} placeholder="Gast Name" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Gewicht (kg)</label>
            <input type="number" className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2 block">Fähigkeiten</label>
            <div className="flex gap-2 flex-wrap">
              {['left', 'right', 'drum', 'steer'].map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded border text-sm capitalize ${skills[skill] ? 'bg-blue-500 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  {skill === 'steer' ? 'Steuer' : skill === 'drum' ? 'Trommel' : skill}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Abbrechen</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Hinzufügen</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGuestModal;

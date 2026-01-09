import React from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { Card } from '@/components/ui/core/Card';
import { useTranslations } from 'next-intl';

interface TeamToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterSkills: string[];
  onFilterChange: (skills: string[]) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
}

const AVAILABLE_SKILLS = ['left', 'right', 'drum', 'steer'];

const TeamToolbar: React.FC<TeamToolbarProps> = ({
  searchTerm,
  onSearchChange,
  filterSkills,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const t = useTranslations();
  const [showFilters, setShowFilters] = React.useState(false);

  const toggleSkillFilter = (skill: string) => {
    if (filterSkills.includes(skill)) {
      onFilterChange(filterSkills.filter(s => s !== skill));
    } else {
      onFilterChange([...filterSkills, skill]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onFilterChange([]);
  };

  const hasActiveFilters = searchTerm.length > 0 || filterSkills.length > 0;

  return (
    <Card className="p-4 mb-4 border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Search and Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              filterSkills.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter size={16} />
            {t('filter')}
            {filterSkills.length > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {filterSkills.length}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                onSortChange(field, order as 'asc' | 'desc');
              }}
              className="appearance-none pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm cursor-pointer"
            >
              <option value="name-asc">{t('sortNameAsc')}</option>
              <option value="name-desc">{t('sortNameDesc')}</option>
              <option value="weight-asc">{t('sortWeightAsc')}</option>
              <option value="weight-desc">{t('sortWeightDesc')}</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-slate-400" />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              title={t('clearFilters')}
            >
              <X size={16} />
              <span className="hidden sm:inline">{t('clear')}</span>
            </button>
          )}
        </div>

        {/* Skill Filters (Collapsible) */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-2">
              {t('filterBySkills')}:
            </span>
            {AVAILABLE_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkillFilter(skill)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterSkills.includes(skill)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {t(skill)}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamToolbar;

import { Paddler } from '@/types';

/**
 * Filters and sorts paddlers based on search term, skill filters, and sort criteria
 */
export function filterAndSortPaddlers(
  paddlers: Paddler[],
  searchTerm: string,
  filterSkills: string[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Paddler[] {
  let filtered = [...paddlers].filter((p) => !p.isCanister && !p.isGuest);

  // Apply search filter
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter((p) => 
      p.name.toLowerCase().includes(search)
    );
  }

  // Apply skill filter (OR logic - paddler must have at least one of the selected skills)
  if (filterSkills.length > 0) {
    filtered = filtered.filter((p) =>
      filterSkills.some((skill) => p.skills.includes(skill))
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'weight') {
      comparison = a.weight - b.weight;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

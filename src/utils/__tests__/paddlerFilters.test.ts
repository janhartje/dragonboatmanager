import { Paddler } from '@/types';
import { filterAndSortPaddlers } from '../paddlerFilters';

describe('filterAndSortPaddlers', () => {
  const mockPaddlers: Paddler[] = [
    {
      id: 1,
      name: 'Alice',
      weight: 70,
      skills: ['left', 'drum'],
      isGuest: false,
      isCanister: false,
    },
    {
      id: 2,
      name: 'Bob',
      weight: 80,
      skills: ['right', 'steer'],
      isGuest: false,
      isCanister: false,
    },
    {
      id: 3,
      name: 'Charlie',
      weight: 60,
      skills: ['left'],
      isGuest: false,
      isCanister: false,
    },
    {
      id: 4,
      name: 'David',
      weight: 90,
      skills: ['drum'],
      isGuest: true, // Should be filtered out
      isCanister: false,
    },
    {
      id: 5,
      name: 'Eve',
      weight: 75,
      skills: ['right'],
      isGuest: false,
      isCanister: true, // Should be filtered out
    },
  ];

  it('filters out guests and canisters', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', [], 'name', 'asc');
    expect(result.length).toBe(3);
    expect(result.find(p => p.name === 'David')).toBeUndefined();
    expect(result.find(p => p.name === 'Eve')).toBeUndefined();
  });

  it('filters by search term (case-insensitive)', () => {
    const result = filterAndSortPaddlers(mockPaddlers, 'ali', [], 'name', 'asc');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Alice');
  });

  it('filters by search term that matches multiple paddlers', () => {
    const result = filterAndSortPaddlers(mockPaddlers, 'c', [], 'name', 'asc');
    expect(result.length).toBe(2);
    expect(result.map(p => p.name).sort()).toEqual(['Alice', 'Charlie']);
  });

  it('filters by single skill (OR logic)', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', ['left'], 'name', 'asc');
    expect(result.length).toBe(2);
    expect(result.map(p => p.name).sort()).toEqual(['Alice', 'Charlie']);
  });

  it('filters by multiple skills (OR logic)', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', ['drum', 'steer'], 'name', 'asc');
    expect(result.length).toBe(2);
    expect(result.map(p => p.name).sort()).toEqual(['Alice', 'Bob']);
  });

  it('combines search and skill filter', () => {
    const result = filterAndSortPaddlers(mockPaddlers, 'a', ['left'], 'name', 'asc');
    expect(result.length).toBe(2);
    expect(result.map(p => p.name).sort()).toEqual(['Alice', 'Charlie']);
  });

  it('sorts by name ascending', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', [], 'name', 'asc');
    expect(result.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('sorts by name descending', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', [], 'name', 'desc');
    expect(result.map(p => p.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts by weight ascending', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', [], 'weight', 'asc');
    expect(result.map(p => p.weight)).toEqual([60, 70, 80]);
    expect(result.map(p => p.name)).toEqual(['Charlie', 'Alice', 'Bob']);
  });

  it('sorts by weight descending', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', [], 'weight', 'desc');
    expect(result.map(p => p.weight)).toEqual([80, 70, 60]);
    expect(result.map(p => p.name)).toEqual(['Bob', 'Alice', 'Charlie']);
  });

  it('returns empty array when no paddlers match filters', () => {
    const result = filterAndSortPaddlers(mockPaddlers, 'xyz', [], 'name', 'asc');
    expect(result).toEqual([]);
  });

  it('returns empty array when no paddlers have selected skills', () => {
    const result = filterAndSortPaddlers(mockPaddlers, '', ['fake-skill'], 'name', 'asc');
    expect(result).toEqual([]);
  });
});

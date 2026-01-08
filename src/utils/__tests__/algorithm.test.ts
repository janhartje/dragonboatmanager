import { runAutoFillAlgorithm } from '../algorithm';
import { Paddler, Assignments } from '../../types';

describe('runAutoFillAlgorithm', () => {
  const mockPaddlers: Paddler[] = [
    { id: 'p1', name: 'P1', weight: 80, skills: ['left'] },
    { id: 'p2', name: 'P2', weight: 85, skills: ['right'] },
    { id: 'p3', name: 'P3', weight: 70, skills: ['left'] },
    { id: 'p4', name: 'P4', weight: 75, skills: ['right'] },
    { id: 's1', name: 'S1', weight: 60, skills: ['steer'] },
    { id: 'd1', name: 'D1', weight: 55, skills: ['drum'] },
  ];

  it('should return null if pool is empty', () => {
    const result = runAutoFillAlgorithm([], {}, [], 0);
    expect(result).toBeNull();
  });

  it('should assign a steer if available', () => {
    const result = runAutoFillAlgorithm(mockPaddlers, {}, [], 0);
    expect(result).not.toBeNull();
    expect(result?.['steer']).toBe('s1');
  });

  it('should assign a drummer if available', () => {
    const result = runAutoFillAlgorithm(mockPaddlers, {}, [], 0);
    expect(result).not.toBeNull();
    expect(result?.['drummer']).toBe('d1');
  });

  it('should respect locked seats', () => {
    const lockedAssignments: Assignments = { 'row-1-left': 'p1' };
    const result = runAutoFillAlgorithm(mockPaddlers, lockedAssignments, ['row-1-left'], 0);
    expect(result).not.toBeNull();
    expect(result?.['row-1-left']).toBe('p1');
  });
});

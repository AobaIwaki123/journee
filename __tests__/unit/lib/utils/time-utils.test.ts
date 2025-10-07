import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  sortSpotsByTime,
  adjustTimeAfterReorder,
  shouldReorderByTime,
} from '@/lib/utils/time-utils';
import type { TouristSpot } from '@/types/itinerary';

describe('timeToMinutes', () => {
  it('should convert HH:mm to minutes', () => {
    expect(timeToMinutes('10:30')).toBe(630); // 10*60 + 30
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('should handle single digit hours and minutes', () => {
    expect(timeToMinutes('9:05')).toBe(545);
    expect(timeToMinutes('1:1')).toBe(61);
  });

  it('should return 0 for empty string', () => {
    expect(timeToMinutes('')).toBe(0);
  });
});

describe('minutesToTime', () => {
  it('should convert minutes to HH:mm format', () => {
    expect(minutesToTime(630)).toBe('10:30');
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('should pad single digits with zeros', () => {
    expect(minutesToTime(65)).toBe('01:05');
    expect(minutesToTime(545)).toBe('09:05');
  });

  it('should handle edge cases', () => {
    expect(minutesToTime(60)).toBe('01:00');
    expect(minutesToTime(1440)).toBe('24:00'); // 24時間
  });
});

describe('sortSpotsByTime', () => {
  const createSpot = (id: string, time?: string): TouristSpot => ({
    id,
    name: `Spot ${id}`,
    description: '',
    category: 'sightseeing',
    scheduledTime: time,
  });

  it('should sort spots by scheduled time', () => {
    const spots = [
      createSpot('3', '14:00'),
      createSpot('1', '09:00'),
      createSpot('2', '12:00'),
    ];
    
    const sorted = sortSpotsByTime(spots);
    
    expect(sorted[0].id).toBe('1');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('3');
  });

  it('should place spots without time at the end', () => {
    const spots = [
      createSpot('2', undefined),
      createSpot('1', '10:00'),
      createSpot('3', undefined),
    ];
    
    const sorted = sortSpotsByTime(spots);
    
    expect(sorted[0].id).toBe('1');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('3');
  });

  it('should not mutate original array', () => {
    const spots = [
      createSpot('2', '12:00'),
      createSpot('1', '09:00'),
    ];
    const original = [...spots];
    
    sortSpotsByTime(spots);
    
    expect(spots).toEqual(original);
  });

  it('should handle empty array', () => {
    const sorted = sortSpotsByTime([]);
    expect(sorted).toEqual([]);
  });
});

describe('adjustTimeAfterReorder', () => {
  const createSpot = (id: string, time?: string, duration?: number): TouristSpot => ({
    id,
    name: `Spot ${id}`,
    description: '',
    category: 'sightseeing',
    scheduledTime: time,
    duration,
  });

  it('should set time between previous and next spot', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', '14:00'), // moved here
      createSpot('3', '16:00'),
    ];
    
    const adjusted = adjustTimeAfterReorder(spots, 1);
    
    const adjustedTime = timeToMinutes(adjusted[1].scheduledTime!);
    // Average of 10:00 (600 minutes) and 16:00 (960 minutes) = 780 minutes (13:00)
    expect(adjustedTime).toBe(780);
  });

  it('should set time after previous spot when no next spot time', () => {
    const spots = [
      createSpot('1', '10:00', 90),
      createSpot('2', undefined), // moved here
    ];
    
    const adjusted = adjustTimeAfterReorder(spots, 1);
    
    expect(adjusted[1].scheduledTime).toBe('11:30'); // 10:00 + 90 minutes
  });

  it('should set time before next spot when no previous spot time', () => {
    const spots = [
      createSpot('1', undefined),
      createSpot('2', '14:00', 60), // moved here
    ];
    
    const adjusted = adjustTimeAfterReorder(spots, 0);
    
    expect(adjusted[0].scheduledTime).toBe('13:00'); // 14:00 - 60 minutes
  });

  it('should not change time when no surrounding times', () => {
    const spots = [
      createSpot('1', '10:00'),
    ];
    
    const adjusted = adjustTimeAfterReorder(spots, 0);
    
    expect(adjusted[0].scheduledTime).toBe('10:00');
  });

  it('should not mutate original array', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', '14:00'),
    ];
    const original = JSON.stringify(spots);
    
    adjustTimeAfterReorder(spots, 1);
    
    expect(JSON.stringify(spots)).toBe(original);
  });
});

describe('shouldReorderByTime', () => {
  const createSpot = (id: string, time?: string): TouristSpot => ({
    id,
    name: `Spot ${id}`,
    description: '',
    category: 'sightseeing',
    scheduledTime: time,
  });

  it('should detect when spot should move earlier', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', '09:00'), // changed to earlier time
      createSpot('3', '12:00'),
    ];
    
    const result = shouldReorderByTime(spots, '2');
    
    expect(result.shouldReorder).toBe(true);
    expect(result.newIndex).toBe(0);
  });

  it('should detect when spot should move later', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', '15:00'), // changed to later time
      createSpot('3', '12:00'),
    ];
    
    const result = shouldReorderByTime(spots, '2');
    
    expect(result.shouldReorder).toBe(true);
    expect(result.newIndex).toBeDefined();
  });

  it('should return false when time is in correct order', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', '11:00'),
      createSpot('3', '12:00'),
    ];
    
    const result = shouldReorderByTime(spots, '2');
    
    expect(result.shouldReorder).toBe(false);
  });

  it('should return false when spot has no time', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', undefined),
      createSpot('3', '12:00'),
    ];
    
    const result = shouldReorderByTime(spots, '2');
    
    expect(result.shouldReorder).toBe(false);
  });

  it('should return false when spot ID not found', () => {
    const spots = [
      createSpot('1', '10:00'),
      createSpot('2', '11:00'),
    ];
    
    const result = shouldReorderByTime(spots, 'nonexistent');
    
    expect(result.shouldReorder).toBe(false);
  });
});
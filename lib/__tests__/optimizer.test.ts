import { detectFreeSlots, buildSuggestions } from '../optimizer';
import type { TimelineEvent } from '@/types';

function ev(cat: TimelineEvent['cat'], start: number, end: number): TimelineEvent {
  return { cat, title: cat, start, end };
}

describe('detectFreeSlots', () => {
  it('finds gaps between events and the tail of the day', () => {
    const events = [ev('sommeil', 0, 7), ev('travail', 8, 12)];
    const slots = detectFreeSlots(events);
    expect(slots).toEqual([
      { start: 7, end: 8, duration: 1 },
      { start: 12, end: 24, duration: 12 },
    ]);
  });

  it('returns no slot when the day is fully booked', () => {
    expect(detectFreeSlots([ev('sommeil', 0, 12), ev('travail', 12, 24)])).toHaveLength(0);
  });

  it('ignores gaps shorter than 15 minutes', () => {
    // 10-minute gap between events
    const events = [ev('sommeil', 0, 12), ev('travail', 12.167, 24)];
    expect(detectFreeSlots(events)).toHaveLength(0);
  });

  it('handles overlapping events without producing negative gaps', () => {
    const events = [ev('travail', 0, 14), ev('repas', 12, 13), ev('sommeil', 14, 24)];
    expect(detectFreeSlots(events)).toHaveLength(0);
  });

  it('treats an empty day as one full free slot', () => {
    expect(detectFreeSlots([])).toEqual([{ start: 0, end: 24, duration: 24 }]);
  });
});

describe('buildSuggestions', () => {
  const typicalDay = [
    ev('sommeil', 0, 7),
    ev('travail', 9, 18),
    ev('repas', 19, 20),
    ev('sommeil', 22, 24),
  ];

  it('returns at most 3 suggestions', () => {
    const suggestions = buildSuggestions({ events: typicalDay });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('returns unique titles', () => {
    const suggestions = buildSuggestions({ events: typicalDay });
    const titles = suggestions.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('anchors each suggestion to a real free slot', () => {
    const slots = detectFreeSlots(typicalDay);
    const suggestions = buildSuggestions({ events: typicalDay });
    for (const s of suggestions) {
      expect(slots.some((slot) => slot.start === s.startHour)).toBe(true);
    }
  });

  it('only proposes activities that fit the available slot', () => {
    const slots = detectFreeSlots(typicalDay);
    const suggestions = buildSuggestions({ events: typicalDay });
    for (const s of suggestions) {
      const slot = slots.find((sl) => sl.start === s.startHour)!;
      expect(s.durationMinutes / 60).toBeLessThanOrEqual(slot.duration);
    }
  });

  it('returns nothing when there is no free slot', () => {
    const packed = [ev('sommeil', 0, 12), ev('travail', 12, 24)];
    expect(buildSuggestions({ events: packed })).toHaveLength(0);
  });
});

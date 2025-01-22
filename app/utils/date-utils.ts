import { addDays, setHours, setMinutes, startOfDay, endOfDay, parse } from 'date-fns';

export interface TimeRange {
  start: Date;
  end: Date;
}

export function parseRelativeDate(dateStr: string | undefined): Date {
  const today = new Date();
  
  if (!dateStr) return today;
  
  switch (dateStr.toLowerCase()) {
    case 'today':
      return today;
    case 'tomorrow':
      return addDays(today, 1);
    case 'next week':
      return addDays(today, 7);
    default:
      // Try to parse day names
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = days.indexOf(dateStr.toLowerCase());
      if (dayIndex !== -1) {
        const currentDay = today.getDay();
        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        return addDays(today, daysToAdd);
      }
      
      // If we can't parse it, return today
      return today;
  }
}

export function parseTimeString(timeStr: string | undefined): number[] {
  // Default to 9 AM
  if (!timeStr) return [9, 0];

  const timeMap: { [key: string]: number[] } = {
    'morning': [9, 0],
    'afternoon': [14, 0],
    'evening': [19, 0],
    'night': [20, 0],
  };

  const lowerTimeStr = timeStr.toLowerCase();
  if (timeMap[lowerTimeStr]) {
    return timeMap[lowerTimeStr];
  }

  // Try to parse time formats like "3pm", "15:00", "3:30pm"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = timeStr.match(timeRegex);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const meridian = match[3]?.toLowerCase();

    // Convert to 24-hour format
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    return [hours, minutes];
  }

  return [9, 0]; // Default fallback
}

export function createTimeRange(dateStr: string | undefined, timeStr?: string, durationHours: number = 1): TimeRange {
  const baseDate = parseRelativeDate(dateStr);
  const [hours, minutes] = parseTimeString(timeStr);

  const start = setMinutes(setHours(baseDate, hours), minutes);
  const end = addDays(start, 0);
  end.setHours(start.getHours() + durationHours);

  return { start, end };
}

export function getFullDayRange(dateStr: string | undefined): TimeRange {
  const date = parseRelativeDate(dateStr);
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  };
}

export function formatForGoogle(date: Date): string {
  return date.toISOString();
} 
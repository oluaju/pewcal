import { addDays, setHours, setMinutes, startOfDay, endOfDay, parse, addMonths } from 'date-fns';

export interface TimeRange {
  start: Date;
  end: Date;
}

export function parseRelativeDate(dateStr: string | undefined): Date {
  const today = new Date();
  
  if (!dateStr) return today;
  
  const lowerDateStr = dateStr.toLowerCase();

  // Handle month names with dates (e.g., "February 21", "Feb 21")
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const shortMonthNames = monthNames.map(m => m.substring(0, 3));
  
  for (let i = 0; i < monthNames.length; i++) {
    const monthRegex = new RegExp(`(${monthNames[i]}|${shortMonthNames[i]})\\s+(\\d{1,2})`, 'i');
    const match = lowerDateStr.match(monthRegex);
    if (match) {
      const day = parseInt(match[2]);
      const result = new Date(today.getFullYear(), i, day);
      // If the date is in the past, assume next year
      if (result < today) {
        result.setFullYear(today.getFullYear() + 1);
      }
      return result;
    }
  }
  
  switch (lowerDateStr) {
    case 'today':
      return today;
    case 'tomorrow':
      return addDays(today, 1);
    case 'next week':
      return addDays(today, 7);
    default:
      // Try to parse day names
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = days.indexOf(lowerDateStr);
      if (dayIndex !== -1) {
        const currentDay = today.getDay();
        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        return addDays(today, daysToAdd);
      }
      
      // Try to parse just the day number (e.g., "21")
      const dayMatch = lowerDateStr.match(/^(\d{1,2})(?:st|nd|rd|th)?$/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        let result = new Date(today.getFullYear(), today.getMonth(), day);
        // If the date has passed, assume next month
        if (result < today) {
          result = addMonths(result, 1);
        }
        return result;
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
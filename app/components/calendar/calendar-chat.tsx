"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './calendar-chat.module.css';
import { Send, X } from 'lucide-react';
import { format, parse, addDays, startOfDay, nextDay, setHours, setMinutes } from 'date-fns';
import type { Day } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CalendarChatProps {
  onEventUpdate: () => void;
  churchId: string;
  onClose?: () => void;
  isVisible?: boolean;
}

interface ParsedEvent {
  title: string;
  date: string;
  time?: string;
  duration?: string;
}

export default function CalendarChat({ 
  onEventUpdate, 
  churchId, 
  onClose,
  isVisible = true 
}: CalendarChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help you manage your calendar. Try asking me to add events, check schedules, or make changes.'
    }
  ]);

  // Save messages to session storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`chat-messages-${churchId}`, JSON.stringify(messages));
    }
  }, [messages, churchId]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  // Initial scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node) && isVisible) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Try to create an event if the message looks like an event creation request
      if (userMessage.toLowerCase().includes('add') || 
          userMessage.toLowerCase().includes('create') ||
          userMessage.toLowerCase().includes('schedule')) {
        try {
          const response = await createEventFromText(userMessage);
          const data = await response.json();
          
          if (response.ok) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Created event "${data.summary}" for ${format(new Date(data.start.dateTime), 'EEEE, MMMM d, yyyy h:mm a')}`
            }]);
            if (onEventUpdate) onEventUpdate();
          } else {
            throw new Error(data.error || 'Failed to create event');
          }
        } catch (error) {
          if (error instanceof Error) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: error.message
            }]);
          }
        }
      } else {
        // Handle other types of messages (existing code)
        const response = await fetch('/api/calendar/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            churchId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        
        if (data.calendarUpdated && onEventUpdate) {
          onEventUpdate();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseNaturalDate = (text: string): Date | null => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const days: Day[] = [0, 1, 2, 3, 4, 5, 6];
    
    // Convert text to lowercase for easier matching
    const lowerText = text.toLowerCase();
    
    // Handle "this [day]" or "next [day]"
    for (let i = 0; i < dayNames.length; i++) {
      const dayName = dayNames[i];
      if (lowerText.includes(`this ${dayName}`)) {
        // Get the next occurrence of this day, but if it's today or already passed this week,
        // get next week's occurrence
        const targetDay = nextDay(startOfDay(today), days[i]);
        if (targetDay.getTime() <= today.getTime()) {
          return addDays(targetDay, 7);
        }
        return targetDay;
      }
      if (lowerText.includes(`next ${dayName}`)) {
        // For "next [day]", always get next week's occurrence
        const targetDay = nextDay(startOfDay(today), days[i]);
        return addDays(targetDay, 7);
      }
    }

    // Handle "tomorrow"
    if (lowerText.includes('tomorrow')) {
      return addDays(startOfDay(today), 1);
    }

    // Handle specific dates (e.g., "January 23" or "1/23")
    try {
      // Try MM/DD format
      if (/\d{1,2}\/\d{1,2}/.test(text)) {
        const date = parse(text, 'M/d', new Date());
        // If the date has passed this year, assume next year
        if (date < today) {
          date.setFullYear(today.getFullYear() + 1);
        }
        return date;
      }
      
      // Try Month DD format
      if (/[A-Za-z]+ \d{1,2}/.test(text)) {
        const date = parse(text, 'MMMM d', new Date());
        if (date < today) {
          date.setFullYear(today.getFullYear() + 1);
        }
        return date;
      }
    } catch (e) {
      console.error('Error parsing specific date:', e);
    }

    return null;
  };

  const parseTimeFromText = (text: string): { hours: number, minutes: number } | null => {
    // Match patterns like "3pm", "3:30pm", "15:00", "3:00", etc.
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
    const match = text.match(timeRegex);

    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3]?.toLowerCase();

      // Convert to 24-hour format
      if (meridiem === 'pm' && hours < 12) {
        hours += 12;
      } else if (meridiem === 'am' && hours === 12) {
        hours = 0;
      }

      // Validate hours and minutes
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return { hours, minutes };
      }
    }

    return null;
  };

  const createEventFromText = async (text: string): Promise<Response> => {
    // First, use OpenAI to parse the natural language into structured data
    const parseResponse = await fetch('/api/calendar/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        currentTime: new Date().toISOString()
      }),
    });

    if (!parseResponse.ok) {
      throw new Error('Failed to parse event details');
    }

    const parsedEvent: ParsedEvent = await parseResponse.json();
    
    // Convert the parsed date and time into a proper Date object
    const startDate = new Date(parsedEvent.date);
    if (parsedEvent.time) {
      const [hours, minutes] = parsedEvent.time.split(':').map(Number);
      startDate.setHours(hours, minutes);
    } else {
      startDate.setHours(12, 0); // Default to noon
    }

    // Calculate end time based on duration or default to 1 hour
    let endDate: Date;
    if (parsedEvent.duration) {
      const durationInMinutes = parseDuration(parsedEvent.duration);
      endDate = new Date(startDate.getTime() + durationInMinutes * 60 * 1000);
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
    }

    // Create the event
    return fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: parsedEvent.title,
        start: {
          dateTime: startDate.toISOString(),
        },
        end: {
          dateTime: endDate.toISOString(),
        },
      }),
    });
  };

  // Helper function to parse duration strings like "1 hour", "30 minutes", etc.
  const parseDuration = (duration: string): number => {
    const hours = duration.match(/(\d+)\s*(?:hour|hr)/i);
    const minutes = duration.match(/(\d+)\s*(?:minute|min)/i);
    
    let totalMinutes = 0;
    if (hours) totalMinutes += parseInt(hours[1]) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1]);
    
    return totalMinutes || 60; // Default to 60 minutes if parsing fails
  };

  return (
    <div ref={chatRef} className={`${styles.chatContainer} ${!isVisible ? styles.hidden : ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>Calendar Assistant</div>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <div className={styles.messages}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.role === 'user' ? styles.user : styles.assistant
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.loadingDots}>
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className={styles.input}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className={styles.sendButton}
        >
          {isLoading ? (
            <div className={styles.buttonLoader} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
} 
"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './calendar-chat.module.css';
import { Send, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CalendarChatProps {
  onEventUpdate: () => void;
  churchId: string;
  onClose?: () => void;
}

export default function CalendarChat({ onEventUpdate, churchId, onClose }: CalendarChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to load messages from session storage on initial render
    if (typeof window !== 'undefined') {
      const savedMessages = sessionStorage.getItem(`chat-messages-${churchId}`);
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    }
    // Default initial message if no saved messages
    return [{
      role: 'assistant',
      content: "Hi! I can help you manage your calendar. Try asking me to add events, check schedules, or make changes."
    }];
  });

  // Save messages to session storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`chat-messages-${churchId}`, JSON.stringify(messages));
    }
  }, [messages, churchId]);

  const [inputValue, setInputValue] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);
    setIsLoading(true);

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`/api/calendar/${churchId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsAuth) {
          window.location.href = data.authUrl;
          return;
        }
        throw new Error(data.message || 'Failed to send message');
      }

      // Add assistant's response
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      // If calendar was updated, trigger the update callback
      if (data.calendarUpdated) {
        onEventUpdate();
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
      // Remove the user's message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <button 
        onClick={onClose}
        className={styles.closeButton}
        aria-label="Close chat"
      >
        <X size={20} />
      </button>
      <div className={styles.messages}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${styles[message.role]}`}
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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className={styles.input}
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()} 
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
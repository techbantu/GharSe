/**
 * NEW FILE: Chat Context - Intelligent Conversation State Management
 * 
 * Purpose: Manages chat state, conversation history, and AI interactions
 * with smart caching, persistence, and real-time updates
 * 
 * Features:
 * - Conversation memory with local storage persistence
 * - Smart message queueing and retry logic
 * - Real-time typing indicators
 * - Automatic context detection (phone, email, location)
 * - Message history with timestamp grouping
 * - Optimistic UI updates
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionsCalled?: string[];
  isError?: boolean;
}

interface UserContext {
  phone?: string;
  email?: string;
  location?: string;
  name?: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  userContext: UserContext;
  conversationId: string;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  setUserContext: (context: Partial<UserContext>) => void;
  retryLastMessage: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [userContext, setUserContextState] = useState<UserContext>({});
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const lastUserMessageRef = useRef<string>('');
  const router = useRouter();

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('bantu_chat_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          setMessages(parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })));
        }

        const storedContext = localStorage.getItem('bantu_chat_context');
        if (storedContext) {
          setUserContextState(JSON.parse(storedContext));
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadHistory();

    // Add welcome message if no history
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hey! I\'m your AI food buddy at Bantu\'s Kitchen. I can find dishes, track orders, answer questions - you know, the usual. What are you craving? Spicy? Creamy? Something that\'ll make your taste buds jealous?',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('bantu_chat_history', JSON.stringify(messages.slice(-20))); // Keep last 20 messages
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages]);

  // Save user context
  useEffect(() => {
    try {
      localStorage.setItem('bantu_chat_context', JSON.stringify(userContext));
    } catch (error) {
      console.error('Failed to save user context:', error);
    }
  }, [userContext]);

  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    lastUserMessageRef.current = content;

    // Detect and extract context from message
    detectContext(content);

    // Add user message immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare messages for API
      const apiMessages = messages.slice(-9).concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message || data.fallbackMessage || 'I apologize, but I encountered an issue. Please try again.',
        timestamp: new Date(),
        functionsCalled: data.functionsCalled,
        isError: !data.success,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsConnected(true);

    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment, or you can:\n\n• Call us at +91 90104 60964\n• Email orders@bantuskitchen.com\n• Visit our restaurant directly',
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);

    } finally {
      setIsTyping(false);
    }
  }, [messages, conversationId, userContext]);

  /**
   * Retry the last message
   */
  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! Welcome to Bantu\'s Kitchen! 🍛 How can I help you today?',
      timestamp: new Date(),
    }]);
    localStorage.removeItem('bantu_chat_history');
  }, []);

  /**
   * Update user context
   */
  const setUserContext = useCallback((context: Partial<UserContext>) => {
    setUserContextState(prev => ({ ...prev, ...context }));
  }, []);

  /**
   * Smart context detection from user messages
   */
  const detectContext = (message: string) => {
    // Phone number detection
    const phoneRegex = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
    const phoneMatch = message.match(phoneRegex);
    if (phoneMatch && !userContext.phone) {
      setUserContextState(prev => ({ ...prev, phone: phoneMatch[0] }));
    }

    // Email detection
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = message.match(emailRegex);
    if (emailMatch && !userContext.email) {
      setUserContextState(prev => ({ ...prev, email: emailMatch[0] }));
    }

    // ZIP code detection
    const zipRegex = /\b\d{5}(-\d{4})?\b/;
    const zipMatch = message.match(zipRegex);
    if (zipMatch && !userContext.location) {
      setUserContextState(prev => ({ ...prev, location: zipMatch[0] }));
    }

    // Name detection (after "my name is" or "I'm")
    const nameRegex = /(?:my name is|i'm|im|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
    const nameMatch = message.match(nameRegex);
    if (nameMatch && !userContext.name) {
      setUserContextState(prev => ({ ...prev, name: nameMatch[1] }));
    }
  };

  const value: ChatContextType = {
    messages,
    isTyping,
    isConnected,
    userContext,
    conversationId,
    sendMessage,
    clearHistory,
    setUserContext,
    retryLastMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat context
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

/**
 * Quick action helpers
 */
export const useChatActions = () => {
  const { sendMessage } = useChat();

  return {
    askOrderStatus: () => sendMessage('I want to track my order'),
    askMenuHelp: () => sendMessage('What do you recommend from the menu?'),
    askDeliveryInfo: () => sendMessage('How long does delivery take?'),
    askVegetarian: () => sendMessage('Show me vegetarian options'),
    askPopular: () => sendMessage('What are your most popular dishes?'),
    askGlutenFree: () => sendMessage('Do you have gluten-free options?'),
  };
};


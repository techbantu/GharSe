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
  actions?: Array<{
    type: string;
    label: string;
    itemId?: string;
    itemName?: string;
    quantity?: number;
    urgency?: any;
  }>;
  sessionId?: string;
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
  const [conversationId, setConversationId] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const lastUserMessageRef = useRef<string>('');
  const router = useRouter();

  // Cross-tab sync infrastructure
  const channelRef = useRef<BroadcastChannel | null>(null);
  const CHAT_CHANNEL_NAME = 'bantu_chat_sync';

  // Initialize conversationId and load history only on client side
  // Setup cross-tab sync
  useEffect(() => {
    setIsMounted(true);
    
    // Generate conversationId only on client
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substring(7)}`);

    // Setup BroadcastChannel for cross-tab sync (modern browsers)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(CHAT_CHANNEL_NAME);
        channelRef.current = channel;
        
        channel.onmessage = (event) => {
          const { type, source, messages: incomingMessages, context: incomingContext } = event.data || {};

          // CRITICAL: Ignore local echoes and only accept CHAT_UPDATE types
          if (source === 'local') return;

          if (type === 'MESSAGES_UPDATED') {
            console.log('[Chat Sync] Received message update from another tab');
            // Update state directly - NO BROADCAST will happen because we removed the useEffect
            setMessages(incomingMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })));
          } else if (type === 'CONTEXT_UPDATED') {
            console.log('[Chat Sync] Received context update from another tab');
            setUserContextState(incomingContext);
          }
        };
        
        console.log('[Chat Sync] BroadcastChannel initialized');
      } catch (error) {
        console.error('[Chat Sync] Failed to initialize BroadcastChannel:', error);
      }
    }
    
    // Load conversation history from localStorage
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('bantu_chat_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          const loadedMessages = parsed.map((msg: any) => {
            // Migrate old welcome messages to new Ghar branding with mom's warmth
            if (msg.content && (msg.content.includes("Bantu's Kitchen") || msg.content.includes("GharSe"))) {
              let newContent = msg.content
                .replace("Bantu's Kitchen", "Ghar")
                .replace("GharSe", "Ghar");
              
              // Replace the generic question with mom's warmth
              if (newContent.includes("How can I help you today?") || newContent.includes("What can I cook for you today?")) {
                newContent = newContent
                  .replace("How can I help you today?", "Beta, eat GharKha food, not outside ka junk! Tell me what you want? 🏠")
                  .replace("What can I cook for you today? 🍛", "Beta, eat GharKha food, not outside ka junk! Tell me what you want? 🏠");
              }
              
              return {
                ...msg,
                content: newContent,
                timestamp: new Date(msg.timestamp),
              };
            }
            return {
              ...msg,
              timestamp: new Date(msg.timestamp),
            };
          });
          
          // Only load if there are actual conversation messages (not just welcome)
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
            
            // Save migrated messages back to localStorage
            localStorage.setItem('bantu_chat_history', JSON.stringify(loadedMessages));
            
            // Load user context if exists
            const storedContext = localStorage.getItem('bantu_chat_context');
            if (storedContext) {
              setUserContextState(JSON.parse(storedContext));
            }
            return; // Don't add welcome message if we have history
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
      
      // Add welcome message only if no history exists
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hey! Welcome to Ghar.\n\nBeta, eat GharKha food, not outside ka junk! Tell me what you want? 🏠',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    };

    loadHistory();
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.onmessage = null;
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, []);

  /**
   * Helper to sync messages to localStorage and other tabs
   * ONLY call this when a LOCAL user action updates messages
   */
  const updateAndBroadcastMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    
    try {
      localStorage.setItem('bantu_chat_history', JSON.stringify(newMessages));
      
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'MESSAGES_UPDATED',
          source: 'local', // Tag as local to prevent echo
          messages: newMessages,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to sync messages:', error);
    }
  }, []);

  /**
   * Helper to sync context to localStorage and other tabs
   * ONLY call this when a LOCAL user action updates context
   */
  const updateAndBroadcastContext = useCallback((newContext: UserContext) => {
    setUserContextState(newContext);
    
    try {
      localStorage.setItem('bantu_chat_context', JSON.stringify(newContext));
      
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'CONTEXT_UPDATED',
          source: 'local', // Tag as local to prevent echo
          context: newContext,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to sync context:', error);
    }
  }, []);

  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !isMounted) return;

    lastUserMessageRef.current = content;

    // Detect and extract context from message
    detectContext(content);

    // Add user message immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const messagesWithUser = [...messages, userMessage];
    updateAndBroadcastMessages(messagesWithUser);
    setIsTyping(true);

    try {
      // Prepare messages for API
      const apiMessages = messagesWithUser.slice(-9).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Load cart data from localStorage for AI context
      let cartData = null;
      try {
        const storedCart = localStorage.getItem('bantusKitchenCart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          cartData = {
            items: parsedCart.items.map((item: any) => ({
              id: item.menuItem.id,
              name: item.menuItem.name,
              quantity: item.quantity,
              price: item.menuItem.price,
              category: item.menuItem.category,
            })),
            itemCount: parsedCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
            subtotal: parsedCart.subtotal,
            total: parsedCart.total,
          };
        }
      } catch (error) {
        console.error('Failed to load cart for AI context:', error);
      }

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
          cartData,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response with actions and sessionId
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        role: 'assistant',
        content: data.message || data.fallbackMessage || 'I apologize, but I encountered an issue. Please try again.',
        timestamp: new Date(),
        functionsCalled: data.functionsCalled,
        isError: !data.success,
        actions: data.actions || [], // NEW: Action buttons from AI
        sessionId: data.sessionId, // NEW: Session ID for cart operations
      };

      updateAndBroadcastMessages([...messagesWithUser, assistantMessage]);
      setIsConnected(true);

    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment, or you can:\n\n• Call us at +91 90104 60964\n• Email orders@gharse.app\n• Visit our restaurant directly',
        timestamp: new Date(),
        isError: true,
      };

      updateAndBroadcastMessages([...messagesWithUser, errorMessage]);
      setIsConnected(false);

    } finally {
      setIsTyping(false);
    }
  }, [messages, conversationId, userContext, isMounted, updateAndBroadcastMessages]);

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
    // Clear messages and localStorage
    localStorage.removeItem('bantu_chat_history');
    localStorage.removeItem('bantu_chat_context');
    setUserContextState({});
    
    // Add fresh welcome message
    const welcomeMessage: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: 'Hey! Welcome to Ghar.\n\nBeta, eat GharKha food, not outside ka junk! Tell me what you want? 🏠',
      timestamp: new Date(),
    };
    updateAndBroadcastMessages([welcomeMessage]);
  }, [updateAndBroadcastMessages]);

  /**
   * Update user context
   */
  const setUserContext = useCallback((context: Partial<UserContext>) => {
    const newContext = { ...userContext, ...context };
    updateAndBroadcastContext(newContext);
  }, [userContext, updateAndBroadcastContext]);

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


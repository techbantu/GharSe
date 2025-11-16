/**
 * UPDATED FILE: AI-Powered Live Chat - Ultra-Intelligent Customer Support
 * 
 * Purpose: Real-time AI assistant with GPT-4 integration, function calling,
 * context awareness, and natural language understanding
 * 
 * Features:
 * - Real-time AI responses with OpenAI GPT-4
 * - Smart context detection (phone, email, order numbers)
 * - Function calling for live data (order status, menu, delivery times)
 * - Conversation memory and persistence
 * - Typing indicators and optimistic updates
 * - Quick action buttons for common queries
 * - Beautiful, spacious UI with smooth animations
 * - Automatic context extraction from messages
 * - Error handling with graceful fallbacks
 * - Interactive action buttons from AI responses (NEW!)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Minimize2, Phone, Mail, RefreshCw, Trash2, Sparkles, ThumbsUp, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useChat, useChatActions } from '@/context/ChatContext';
import { useCart } from '@/context/CartContext';
import { ActionButton } from '@/components/chat/ActionButton';
import { ItemHighlight } from '@/components/chat/ItemHighlight';
import { format } from 'date-fns';

interface LiveChatProps {
  minimized?: boolean;
  onMinimize?: () => void;
  onRestore?: () => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ minimized = false, onMinimize, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // Track minimized state
  const [showEndChatDialog, setShowEndChatDialog] = useState(false); // NEW: Track end chat confirmation
  const [input, setInput] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({}); // Track quantities per item ID
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({}); // Track adding state per item
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use chat context and cart context
  const { messages, isTyping, isConnected, sendMessage, clearHistory, retryLastMessage } = useChat();
  const { addItem, cart, removeItem, updateQuantity } = useCart(); // GENIUS FIX: Get cart state and methods for real-time sync
  const chatActions = useChatActions();
  
  // Sync internal state with external minimized prop
  useEffect(() => {
    if (minimized) {
      setIsOpen(false);
    }
  }, [minimized]);
  
  /**
   * GENIUS CART FUNCTIONS - Make the AI a world-class salesperson
   */
  
  // GENIUS FIX: Get quantity from cart state (real-time sync)
  const getItemQuantity = (itemId: string) => {
    // First check if item is in cart
    const cartItem = cart.items.find(item => item.menuItem.id === itemId);
    if (cartItem) {
      return cartItem.quantity; // Return actual cart quantity
    }
    
    // If not in cart, check local state (for pre-add quantity selection)
    const localQuantity = itemQuantities[itemId];
    return localQuantity || 0; // GENIUS FIX: Default to 0, not 1!
  };
  
  // GENIUS FIX: Check if item is in cart
  const isItemInCart = (itemId: string) => {
    return cart.items.some(item => item.menuItem.id === itemId);
  };
  
  // Update quantity for an item (before adding to cart)
  const updateItemQuantity = (itemId: string, delta: number) => {
    setItemQuantities(prev => {
      const current = prev[itemId] || 0; // GENIUS FIX: Start from 0
      const newQuantity = Math.max(0, Math.min(99, current + delta)); // Min 0, Max 99
      if (newQuantity === 0) {
        // Remove from local state if 0
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };
  
  // Add item to cart with animation
  const handleAddToCart = async (item: any) => {
    const itemId = item.id;
    const quantity = getItemQuantity(itemId);
    
    // Set adding state
    setAddingToCart(prev => ({ ...prev, [itemId]: true }));
    
    try {
      // Convert AI item to MenuItem format
      const menuItem = {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        originalPrice: item.originalPrice || undefined,
        category: item.category || 'Main Course',
        image: item.image || '/images/placeholder.jpg',
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        isGlutenFree: item.isGlutenFree || false,
        spicyLevel: item.spicyLevel || 0,
        preparationTime: item.preparationTime || 20,
        isAvailable: true,
        isPopular: item.isPopular || false,
      };
      
      // GENIUS FIX: Use quantity from local state, or default to 1 if adding for first time
      const quantityToAdd = quantity > 0 ? quantity : 1;
      
      // Add to cart
      addItem(menuItem, quantityToAdd);
      
      // Success animation delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // GENIUS FIX: Don't send ANY message - visual confirmation (button turning green) is enough!
      // The AI will naturally see the cart update in the next user message's context
      // This prevents the AI from "talking to itself" with fake user messages
      
      // Clear local quantity state - cart state is now the source of truth
      setItemQuantities(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      // Don't send error as user message either - visual error state is enough
    } finally {
      setAddingToCart(prev => ({ ...prev, [itemId]: false }));
    }
  };
  
  /**
   * GENIUS FUNCTION: Highlight Item Names in AI Messages
   * Parses message text and wraps dish names with ItemHighlight component
   */
  const renderMessageWithHighlights = (message: any) => {
    const { content, actions, role } = message;
    
    // Only highlight for assistant messages
    if (role !== 'assistant' || !actions || actions.length === 0) {
      return content;
    }
    
    // Extract item names from actions
    const itemNames = new Set<string>();
    actions.forEach((action: any) => {
      if (action.itemName) {
        itemNames.add(action.itemName);
      }
      // Also check items array for bulk actions
      if (action.items && Array.isArray(action.items)) {
        action.items.forEach((item: any) => {
          if (item.name) {
            itemNames.add(item.name);
          }
        });
      }
    });
    
    if (itemNames.size === 0) {
      return content;
    }
    
    // Build regex pattern to find item names (case-insensitive, word boundaries)
    const itemNamesArray = Array.from(itemNames);
    const pattern = new RegExp(
      `\\b(${itemNamesArray.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
      'gi'
    );
    
    // Split text and wrap matches with ItemHighlight
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    
    while ((match = pattern.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add highlighted item name
      const matchedName = match[0];
      const action = actions.find((a: any) => 
        a.itemName?.toLowerCase() === matchedName.toLowerCase() ||
        a.items?.some((item: any) => item.name?.toLowerCase() === matchedName.toLowerCase())
      );
      
      parts.push(
        <ItemHighlight
          key={`highlight-${key++}`}
          name={matchedName}
          category={action?.category}
          price={action?.price}
        />
      );
      
      lastIndex = pattern.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = async (action: () => void) => {
    await action();
  };

  // GENIUS FUNCTION: Handle End Chat - Clear history and close
  const handleEndChat = () => {
    clearHistory();
    setShowEndChatDialog(false);
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Handle close button - Show confirmation dialog
  const handleCloseClick = () => {
    if (messages.length > 0) {
      // If there are messages, show confirmation
      setShowEndChatDialog(true);
    } else {
      // If no messages, just close
      setIsOpen(false);
    }
  };

  // Minimized bubble (when chat is minimized but not closed)
  if (isMinimized) {
    return (
      <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 9998 }}>
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsOpen(true);
          }}
          style={{
            width: '68px',
            height: '68px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white',
            borderRadius: '9999px',
            boxShadow: '0 10px 40px rgba(255, 107, 53, 0.5), 0 0 60px rgba(255, 107, 53, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
          className="hover:shadow-orange-500/60 hover:scale-110"
          aria-label="Expand AI chat"
        >
          <MessageSquare size={30} strokeWidth={2.5} />
          {/* AI Badge */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              borderRadius: '9999px',
              padding: '4px 8px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.5)',
            }}
          >
            <Sparkles size={10} />
            GPT-4
          </div>
          {/* Unread messages indicator */}
          {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '16px',
                height: '16px',
                background: '#ef4444',
                borderRadius: '50%',
                border: '2px solid white',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          )}
        </button>
      </div>
    );
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 9998 }}>
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
          setShowEndChatDialog(false); // Reset dialog state
          if (onRestore) onRestore(); // Notify parent that chat is restored
        }}
        style={{ 
            width: '68px',
            height: '68px',
            background: 'linear-gradient(135deg, #f97316, #ea580c, #ef4444)',
          color: 'white',
          borderRadius: '9999px',
          boxShadow: '0 10px 40px rgba(255, 107, 53, 0.5), 0 0 60px rgba(255, 107, 53, 0.3), 0 0 100px rgba(255, 107, 53, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
            cursor: 'pointer',
            position: 'relative',
        }}
          className="hover:shadow-orange-500/60 hover:scale-110"
          aria-label="Open AI chat"
      >
          <MessageSquare size={30} strokeWidth={2.5} />
          {/* AI Badge */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            borderRadius: '9999px',
            padding: '4px 8px',
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.5)',
          }}>
            <Sparkles size={10} />
            AI
          </div>
          {/* Unread messages indicator (optional) */}
          {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              width: '16px',
              height: '16px',
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }} />
          )}
      </button>
      </div>
    );
  }
  
  return (
    <>
      <style>{`
        [data-live-chat] {
          position: fixed !important;
          right: 24px !important;
          left: auto !important;
          bottom: 24px !important;
          top: auto !important;
          max-height: calc(100vh - 48px) !important;
          overflow: hidden !important;
          margin-left: auto !important;
          transform: translateX(0) !important;
        }
        @media (max-width: 768px) {
          [data-live-chat] {
            right: 16px !important;
            left: auto !important;
            width: auto !important;
            max-width: calc(100vw - 32px) !important;
            max-height: calc(100vh - 32px) !important;
            bottom: 16px !important;
            margin-left: auto !important;
            transform: translateX(0) !important;
          }
        }
        
        /* Force right alignment globally */
        body [data-live-chat],
        html [data-live-chat] {
          right: 24px !important;
          left: auto !important;
        }
        .message-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pulse-dot {
          animation: pulse 1.4s ease-in-out infinite;
        }
        .pulse-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .pulse-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .dialog-fade-in {
          animation: dialogFadeIn 0.2s ease-out;
        }
        @keyframes dialogFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>


      <div 
        data-live-chat
        style={{ 
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          left: 'auto',
          top: 'auto',
          zIndex: 9998,
          width: '440px',
          maxWidth: 'calc(100vw - 48px)',
          height: '680px',
          maxHeight: 'calc(100vh - 48px)',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: 'auto',
        }}
      >
        {/* Header with AI Badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: '24px 24px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Header Action Buttons (Minimize & Close) */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
            {/* Minimize Button */}
            <button
              onClick={() => {
                setIsMinimized(true);
                setIsOpen(false);
              }}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(249, 115, 22, 0.95)',
                color: 'white',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                outline: 'none',
              }}
              className="hover:scale-110 hover:bg-orange-700"
              title="Minimize chat"
              aria-label="Minimize chat"
            >
              <Minimize2 size={20} strokeWidth={3} />
            </button>

          {/* Close Button */}
        <button
              onClick={handleCloseClick}
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            borderRadius: '9999px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            outline: 'none',
            }}
            className="hover:scale-110 hover:bg-red-700"
              title="End chat"
              aria-label="End chat"
        >
            <X size={20} strokeWidth={3} />
        </button>
          </div>

          <div style={{ flex: 1, paddingRight: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.35rem', lineHeight: '1.25' }}>
                AI Assistant
              </h3>
              <div
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Sparkles size={12} />
                GPT-4
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: isConnected ? '#10b981' : '#ef4444',
                  boxShadow: `0 0 10px ${isConnected ? '#10b981' : '#ef4444'}`,
                }}
              />
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.95)', lineHeight: '1.625' }}>
                {isConnected ? 'Connected • Real-time AI' : 'Reconnecting...'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
        flexDirection: 'column',
            gap: '18px',
        background: 'linear-gradient(to bottom, #F9FAFB, white)',
        flexShrink: 1,
            minHeight: 0,
            position: 'relative',
          }}
        >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '12px',
            }}
              className="message-fade-in"
          >
              {message.role === 'assistant' && (
            <div
              style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
              }}
            >
                  <Sparkles size={18} color="white" />
                </div>
              )}

              <div
                style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                  background:
                    message.role === 'user'
                      ? 'linear-gradient(135deg, #f97316, #ea580c)'
                      : message.isError
                      ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                      : 'white',
                  color: message.role === 'user' ? 'white' : message.isError ? '#991b1b' : '#111827',
                  border: message.role === 'user' ? 'none' : '1px solid #E5E7EB',
                }}
              >
                <p style={{ fontSize: '0.925rem', lineHeight: '1.65', marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
                  {renderMessageWithHighlights(message)}
                </p>
                
                {/* GENIUS FEATURE: Menu Item Cards with Quantity Controls */}
                {message.actions && message.actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {message.actions.map((action, index) => {
                      // Render menu item cards for add_to_cart actions
                      if (action.type === 'add_to_cart' && (action as any).menuItem) {
                        const item = (action as any).menuItem;
                        const itemId = item.id;
                        const quantity = getItemQuantity(itemId); // GENIUS FIX: Now syncs with cart
                        const isAdding = addingToCart[itemId];
                        const inCart = isItemInCart(itemId); // GENIUS FIX: Check if in cart
                        
                        return (
                          <div
                            key={index}
                            style={{
                              background: 'linear-gradient(135deg, #ffffff, #f9fafb)',
                              borderRadius: '16px',
                              padding: '14px',
                              border: '2px solid #e5e7eb',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                              transition: 'all 0.3s ease',
                            }}
                            className="hover:shadow-lg hover:border-orange-300"
                          >
                            {/* Item Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                                  {item.name}
                                  {item.isVegetarian && <span style={{ marginLeft: '6px', fontSize: '0.85rem' }}>🥬</span>}
                                  {item.isPopular && (
                                    <span
                                      style={{
                                        marginLeft: '8px',
                                        fontSize: '0.7rem',
                                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      POPULAR
                                    </span>
                                  )}
                                </h4>
                                {item.description && (
                                  <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: '1.4', marginBottom: '6px' }}>
                                    {item.description.length > 80 ? `${item.description.substring(0, 80)}...` : item.description}
                                  </p>
                                )}
                                {/* Price */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f97316' }}>
                                    ₹{item.price}
                                  </span>
                                  {item.originalPrice && (
                                    <span style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                                      ₹{item.originalPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls + Add to Cart */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                              {/* GENIUS FIX: Quantity Selector - Only show if item is in cart OR if user is selecting quantity */}
                              {(inCart || quantity > 0) && (
                               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', borderRadius: '12px', border: '2px solid #e5e7eb', padding: '4px 6px' }}>
                                 <button
                                    onClick={() => {
                                      if (inCart) {
                                        // If in cart, update cart quantity directly
                                        const cartItem = cart.items.find(i => i.menuItem.id === itemId);
                                        if (cartItem) {
                                          const newQty = Math.max(0, cartItem.quantity - 1);
                                          if (newQty === 0) {
                                            // Remove from cart if quantity becomes 0
                                            removeItem(cartItem.id);
                                          } else {
                                            updateQuantity(cartItem.id, newQty);
                                          }
                                        }
                                      } else {
                                        // If not in cart, update local state
                                        updateItemQuantity(itemId, -1);
                                      }
                                    }}
                                   disabled={(inCart ? quantity <= 1 : quantity <= 0) || isAdding}
                                   style={{
                                     width: '28px',
                                     height: '28px',
                                     borderRadius: '8px',
                                       background: (inCart ? quantity <= 1 : quantity <= 0) ? '#f3f4f6' : '#fee2e2',
                                     border: 'none',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                       cursor: (inCart ? quantity <= 1 : quantity <= 0) ? 'not-allowed' : 'pointer',
                                     transition: 'all 0.2s',
                                       opacity: (inCart ? quantity <= 1 : quantity <= 0) ? 0.5 : 1,
                                   }}
                                   className="hover:bg-red-100"
                                 >
                                    <Minus size={14} color={(inCart ? quantity <= 1 : quantity <= 0) ? '#9ca3af' : '#ef4444'} strokeWidth={2.5} />
                                 </button>
                                 
                                 <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', minWidth: '24px', textAlign: 'center' }}>
                                   {quantity}
                                 </span>
                                 
                                 <button
                                      onClick={() => {
                                        if (inCart) {
                                          // If in cart, update cart quantity directly
                                          const cartItem = cart.items.find(i => i.menuItem.id === itemId);
                                          if (cartItem) {
                                            updateQuantity(cartItem.id, Math.min(99, cartItem.quantity + 1));
                                          }
                                        } else {
                                          // If not in cart, update local state
                                          updateItemQuantity(itemId, 1);
                                        }
                                      }}
                                   disabled={quantity >= 99 || isAdding}
                                   style={{
                                     width: '28px',
                                     height: '28px',
                                     borderRadius: '8px',
                                     background: quantity >= 99 ? '#f3f4f6' : '#dcfce7',
                                     border: 'none',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                     cursor: quantity >= 99 ? 'not-allowed' : 'pointer',
                                     transition: 'all 0.2s',
                                     opacity: quantity >= 99 ? 0.5 : 1,
                                   }}
                                   className="hover:bg-green-100"
                                 >
                                   <Plus size={14} color={quantity >= 99 ? '#9ca3af' : '#10b981'} strokeWidth={2.5} />
                                 </button>
                               </div>
                              )}

                              {/* GENIUS FIX: Add to Cart Button - Compact when in cart, full width when not */}
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={isAdding || inCart}
                                style={{
                                  flex: inCart ? 'none' : 1,
                                  padding: inCart ? '8px 16px' : '10px 18px',
                                  background: inCart || isAdding
                                    ? 'linear-gradient(135deg, #10b981, #059669)' // Green if in cart
                                    : 'linear-gradient(135deg, #f97316, #ea580c)', // Orange if not in cart
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '12px',
                                  fontSize: inCart ? '0.85rem' : '0.9rem',
                                  fontWeight: 600,
                                  cursor: (isAdding || inCart) ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  boxShadow: inCart || isAdding
                                    ? '0 2px 8px rgba(16, 185, 129, 0.3)' // Green shadow if in cart
                                    : '0 4px 12px rgba(249, 115, 22, 0.3)', // Orange shadow if not
                                  transition: 'all 0.3s',
                                  minWidth: inCart ? 'auto' : '140px',
                                  whiteSpace: 'nowrap',
                                }}
                                className={inCart ? '' : 'hover:shadow-lg hover:scale-105'}
                              >
                                {isAdding ? (
                                  <>
                                    <svg
                                      className="animate-spin"
                                      width="16"
                                      height="16"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        opacity="0.25"
                                      />
                                      <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        opacity="0.75"
                                      />
                                    </svg>
                                    Added!
                                  </>
                                ) : inCart ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    In Cart
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart size={16} strokeWidth={2.5} />
                                    Add {quantity > 0 ? `${quantity} ` : ''}to Cart
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Urgency Badge (if present) */}
                            {action.urgency && action.urgency.level !== 'none' && (
                              <div
                                style={{
                                  marginTop: '10px',
                                  padding: '8px 12px',
                                  background: action.urgency.level === 'critical'
                                    ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                                    : action.urgency.level === 'high'
                                    ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                                    : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                  borderRadius: '10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: action.urgency.level === 'critical'
                                    ? '#991b1b'
                                    : action.urgency.level === 'high'
                                    ? '#92400e'
                                    : '#1e40af',
                                }}
                              >
                                {action.urgency.message}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // For other action types (non-menu items), render regular buttons
                      return (
                      <ActionButton
                        key={index}
                        action={action as any}
                        sessionId={message.sessionId}
                        onExecute={() => {
                          console.log('Action executed:', action);
                        }}
                      />
                      );
                    })}
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      color: message.role === 'user' ? 'rgba(255, 255, 255, 0.75)' : '#9CA3AF',
                      fontWeight: 500,
                }}
              >
                    {format(new Date(message.timestamp), 'p')}
                  </p>
                  {message.functionsCalled && message.functionsCalled.length > 0 && (
                    <div
                      style={{
                        fontSize: '0.65rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: '#7c3aed',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontWeight: 600,
                      }}
                      title={`AI used: ${message.functionsCalled.join(', ')}`}
                    >
                      🧠 Smart Data
                    </div>
                  )}
                </div>
            </div>
          </div>
        ))}

          {/* Typing Indicator */}
        {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px' }} className="message-fade-in">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Sparkles size={18} color="white" />
              </div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '20px 20px 20px 4px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E5E7EB',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '9999px' }} className="pulse-dot" />
                  <div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '9999px' }} className="pulse-dot" />
                  <div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '9999px' }} className="pulse-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

        {/* Quick Actions */}
        <div
          style={{
            padding: '20px 28px 16px',
        background: 'white',
        borderTop: '2px solid #F3F4F6',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => handleQuickAction(chatActions.askOrderStatus)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 6px)',
                minWidth: '110px',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              📦 Order Status
          </button>
            <button
              onClick={() => handleQuickAction(chatActions.askMenuHelp)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 6px)',
                minWidth: '110px',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              🍽️ Menu Help
          </button>
            <button
              onClick={() => handleQuickAction(chatActions.askPopular)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 6px)',
                minWidth: '110px',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              ⭐ Popular Dishes
          </button>
            <button
              onClick={() => handleQuickAction(chatActions.askDeliveryInfo)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 6px)',
                minWidth: '110px',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              🚚 Delivery Time
          </button>
            <button
              onClick={() => handleQuickAction(chatActions.askVegetarian)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 6px)',
                minWidth: '110px',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              🥗 Vegetarian
          </button>
            <button
              onClick={() => handleQuickAction(chatActions.askGlutenFree)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 6px)',
                minWidth: '110px',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              🌾 Gluten-Free
          </button>
        </div>

          {/* Input Area */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
              ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything..."
              disabled={isTyping}
            style={{
              flex: 1,
                padding: '14px 18px',
              background: '#F9FAFB',
              border: '2px solid #E5E7EB',
                borderRadius: '14px',
              transition: 'all 0.2s',
                fontSize: '0.95rem',
                outline: 'none',
            }}
              className="focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white placeholder-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
              disabled={!input.trim() || isTyping}
            style={{
                padding: '14px 20px',
                background: input.trim() && !isTyping ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#D1D5DB',
              color: 'white',
                borderRadius: '14px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: '60px',
              border: 'none',
                cursor: 'pointer',
                boxShadow: input.trim() && !isTyping ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
            }}
              className="hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              title="Send message"
          >
              <Send size={20} />
          </button>
        </div>

          {/* Bottom Actions */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              fontSize: '0.8rem',
              color: '#6B7280',
              paddingTop: '12px',
              borderTop: '2px solid #F3F4F6',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '24px' }}>
              <a
                href="tel:+919010460964"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'color 0.2s',
                  padding: '6px 0',
              textDecoration: 'none',
                  color: '#6B7280',
            }}
            className="hover:text-[#f97316]"
          >
                <Phone size={16} />
                <span style={{ fontWeight: 600 }}>Call</span>
          </a>
          <a 
            href="mailto:orders@bantuskitchen.com" 
            style={{
              display: 'flex',
              alignItems: 'center',
                  gap: '8px',
              transition: 'color 0.2s',
                  padding: '6px 0',
              textDecoration: 'none',
                  color: '#6B7280',
            }}
            className="hover:text-[#f97316]"
          >
                <Mail size={16} />
                <span style={{ fontWeight: 600 }}>Email</span>
              </a>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={retryLastMessage}
                disabled={isTyping}
                style={{
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'color 0.2s',
                }}
                className="hover:text-[#f97316]"
                title="Retry last message"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={clearHistory}
                disabled={isTyping}
                style={{
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'color 0.2s',
                }}
                className="hover:text-red-500"
                title="Clear history"
              >
                <Trash2 size={16} />
              </button>
            </div>
        </div>
      </div>

        {/* END CHAT CONFIRMATION - Inside Chat Window */}
        {showEndChatDialog && (
          <>
            {/* Overlay inside chat window */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                zIndex: 1000,
                backdropFilter: 'blur(4px)',
                borderRadius: '24px',
                animation: 'fadeIn 0.15s ease-out',
              }}
              onClick={() => setShowEndChatDialog(false)}
            />

            {/* Dialog inside chat window */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                width: 'calc(100% - 64px)',
                maxWidth: '340px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
              className="dialog-fade-in"
            >
              {/* Dialog Header */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 16px rgba(249, 115, 22, 0.35)',
                  }}
                >
                  <MessageSquare size={32} color="white" strokeWidth={2.5} />
                </div>
                <h3
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '8px',
                  }}
                >
                  END CHAT?
                </h3>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: '#6B7280',
                    lineHeight: '1.6',
                  }}
                >
                  This will clear your conversation history. Start fresh next time!
                </p>
              </div>

              {/* Dialog Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Cancel Button */}
                <button
                  onClick={() => setShowEndChatDialog(false)}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  className="hover:bg-gray-200 hover:border-gray-300"
                >
                  Cancel
                </button>

                {/* Confirm Button with Thumbs Up */}
                <button
                  onClick={handleEndChat}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    outline: 'none',
                  }}
                  className="hover:shadow-lg hover:scale-105"
                >
                  <ThumbsUp size={18} strokeWidth={2.5} />
                  Yes, End
                </button>
              </div>
            </div>
          </>
        )}
    </div>
    </>
  );
};

export default LiveChat;

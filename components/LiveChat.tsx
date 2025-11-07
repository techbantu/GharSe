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
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Minimize2, Phone, Mail, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { useChat, useChatActions } from '@/context/ChatContext';
import { format } from 'date-fns';

interface LiveChatProps {
  minimized?: boolean;
  onMinimize?: () => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ minimized = false, onMinimize }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use chat context
  const { messages, isTyping, isConnected, sendMessage, clearHistory, retryLastMessage } = useChat();
  const chatActions = useChatActions();
  
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

  // Floating button when closed
  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 9999 }}>
      <button
        onClick={() => setIsOpen(true)}
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
      `}</style>

      <div 
        data-live-chat
        style={{ 
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          left: 'auto',
          top: 'auto',
          zIndex: 9999,
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
          {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
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
            zIndex: 10,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            outline: 'none',
            }}
            className="hover:scale-110 hover:bg-red-700"
          title="Close chat"
          aria-label="Close chat"
        >
            <X size={20} strokeWidth={3} />
        </button>

          <div style={{ flex: 1, paddingRight: '60px' }}>
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
                  {message.content}
                </p>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => handleQuickAction(chatActions.askOrderStatus)}
              disabled={isTyping}
              style={{
            fontSize: '0.75rem',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
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
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
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
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                border: '1px solid #D1D5DB',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            fontWeight: 600,
            color: '#374151',
            whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
              className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-sm hover:text-[#f97316] hover:border-orange-200"
            >
              ⭐ Popular Dishes
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
    </div>
    </>
  );
};

export default LiveChat;

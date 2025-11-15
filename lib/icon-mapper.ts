/**
 * ICON MAPPER - Emoji to Lucide Icon Component Mapping
 * 
 * Purpose: Centralized mapping of emoji strings to Lucide React icon components
 * 
 * This ensures consistent icon usage across the entire application
 * and provides a single source of truth for icon replacements.
 */

import {
  MapPin,
  Target,
  Star,
  ChefHat,
  Crown,
  UtensilsCrossed,
  Utensils,
  FileText,
  CreditCard,
  MapPin as LocationPin,
  IndianRupee,
  PartyPopper,
  Trophy,
  Flame,
  BookOpen,
  Users,
  Sun,
  Moon,
  Wallet,
  Gem,
  Heart,
  Compass,
  Sparkles,
  Hand,
  ChefHat as FoodIcon,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Map emoji strings to Lucide icon components
 */
export const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  // Rank badges
  '🗺️': MapPin,
  '🎯': Target,
  '⭐': Star,
  '👨‍🍳': ChefHat,
  '👑': Crown,
  
  // Food & dishes
  '🍛': UtensilsCrossed,
  '🍽️': Utensils,
  '🍚': UtensilsCrossed,
  '🥬': UtensilsCrossed,
  '🍰': UtensilsCrossed,
  
  // Documents & info
  '📋': FileText,
  '💳': CreditCard,
  '📍': LocationPin,
  '💰': Wallet,
  '💎': Gem,
  
  // Achievements & celebrations
  '🎉': PartyPopper,
  '🏆': Trophy,
  '🔥': Flame,
  '📚': BookOpen,
  '👥': Users,
  '🦋': Sparkles, // Butterfly emoji mapped to Sparkles icon (Butterfly doesn't exist in lucide-react)
  '🌅': Sun,
  '🌙': Moon,
  '❤️': Heart,
  
  // Social & sharing
  '👋': Hand,
  '✨': Sparkles,
  
  // Explorer & navigation
  '🧭': Compass,
};

/**
 * Get Lucide icon component for an emoji string
 * Returns a default icon if emoji not found
 */
export function getIconForEmoji(emoji: string): LucideIcon {
  return EMOJI_TO_ICON[emoji] || Star; // Default to Star if not found
}

/**
 * Check if an emoji has a corresponding icon
 */
export function hasIconForEmoji(emoji: string): boolean {
  return emoji in EMOJI_TO_ICON;
}

/**
 * Render an icon component for an emoji string
 * This is a helper function for components that need to render icons
 */
export function renderIconForEmoji(
  emoji: string,
  size: number = 24,
  className?: string,
  color?: string
): React.ReactElement {
  const IconComponent = getIconForEmoji(emoji);
  return <IconComponent size={size} className={className} style={color ? { color } : undefined} />;
}


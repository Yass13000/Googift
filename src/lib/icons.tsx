import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = "w-5 h-5", size }) => {
  // Try exact match, then capitalized match
  const iconKey = name in LucideIcons 
    ? name 
    : (name.charAt(0).toUpperCase() + name.slice(1)) in LucideIcons 
      ? (name.charAt(0).toUpperCase() + name.slice(1)) 
      : 'Gift';

  const IconComponent = (LucideIcons as Record<string, any>)[iconKey] || LucideIcons.Gift;

  return <IconComponent className={className} size={size} />;
};

export const POPULAR_ICONS = [
  'Gift', 'Coffee', 'CupSoda', 'Cake', 'Cookie', 'Percent', 'Utensils', 
  'Pizza', 'Wine', 'Beer', 'IceCream', 'Award', 'Sparkles', 'Heart', 
  'ShoppingBag', 'Tag', 'Smile', 'Flame'
];

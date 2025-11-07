/**
 * Utility for consistent component styling
 * Provides type-safe class name composition and design system utilities
 */

type ClassValue = string | number | boolean | undefined | null | ClassArray | ClassDictionary;
interface ClassDictionary {
  [id: string]: any;
}
interface ClassArray extends Array<ClassValue> {}

/**
 * Combines class names efficiently
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const result = cn(...input);
      if (result) classes.push(result);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

/**
 * Design System Utilities
 */
export const ds = {
  // Spacing utilities
  spacing: {
    xs: 'p-xs',
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
    xl: 'p-xl',
    '2xl': 'p-2xl',
    '3xl': 'p-3xl',
  },
  
  // Gap utilities
  gap: {
    xs: 'gap-xs',
    sm: 'gap-sm',
    md: 'gap-md',
    lg: 'gap-lg',
    xl: 'gap-xl',
    '2xl': 'gap-2xl',
  },
  
  // Text sizes
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  },
  
  // Radius
  radius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  },
  
  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  },
  
  // Container
  container: (size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => 
    cn('container', size && `max-w-${size}`),
  
  // Card styles
  card: (hover?: boolean) => 
    cn('card', hover && 'card-hover'),
  
  // Button styles
  button: {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    success: 'btn btn-success',
  },
  
  // Input styles
  input: 'input',
  
  // Section styles
  section: 'section',
  
  // Image styles
  image: {
    responsive: 'img-responsive',
    cover: 'img-cover',
    contain: 'img-contain',
    loading: 'img-loading',
  },
  
  // Aspect ratios
  aspect: {
    square: 'aspect-square',
    video: 'aspect-video',
    food: 'aspect-food',
    portrait: 'aspect-portrait',
  }
};

/**
 * Common component patterns
 */
export const patterns = {
  // Card with consistent spacing
  card: (className?: string) => 
    cn('bg-white rounded-xl p-lg shadow-md border border-gray-100 transition-all hover:shadow-lg', className),
  
  // Button base
  button: (variant: 'primary' | 'secondary' = 'primary', className?: string) =>
    cn(
      'inline-flex items-center justify-center gap-xs px-lg py-sm rounded-lg font-medium transition-all cursor-pointer',
      variant === 'primary' && 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-md',
      variant === 'secondary' && 'bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
      className
    ),
  
  // Input field
  input: (className?: string) =>
    cn('w-full px-md py-sm border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all', className),
  
  // Container with responsive padding
  container: (className?: string) =>
    cn('container mx-auto px-lg md:px-xl lg:px-2xl', className),
  
  // Section with vertical spacing
  section: (className?: string) =>
    cn('py-2xl md:py-3xl', className),
  
  // Grid layouts
  grid: {
    cols: (cols: 1 | 2 | 3 | 4, className?: string) =>
      cn(`grid grid-cols-${cols} gap-lg`, className),
    responsive: (mobile: number, tablet: number, desktop: number, className?: string) =>
      cn(`grid grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop} gap-lg`, className),
  },
  
  // Flex layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    col: 'flex flex-col',
    wrap: 'flex flex-wrap',
  }
};

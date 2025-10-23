/**
 * Environment detection utility
 */

export type Environment = 'development' | 'production' | 'test';

/**
 * Get current environment
 */
export function getEnvironment(): Environment {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NODE_ENV as Environment || 'development';
  }
  
  // Client-side - check hostname and other indicators
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  
  // Check hostname for additional clues
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return 'development';
    }
    
    // Production domains (add your production domains here)
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app') || hostname === 'mingjyunhung.com') {
      return 'production';
    }
  }
  
  // Default to development if uncertain
  return 'development';
}

/**
 * Check if we're in development mode
 */
export const isDev = (): boolean => getEnvironment() === 'development';

/**
 * Check if we're in production mode
 */
export const isProd = (): boolean => getEnvironment() === 'production';

/**
 * Check if we're in test mode
 */
export const isTest = (): boolean => getEnvironment() === 'test';

/**
 * Get environment display name with emoji
 */
export function getEnvironmentDisplay(): string {
  const env = getEnvironment();
  switch (env) {
    case 'development':
      return '🔧 Development';
    case 'production':
      return '🚀 Production';
    case 'test':
      return '🧪 Test';
    default:
      return '❓ Unknown';
  }
}

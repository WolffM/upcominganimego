/**
 * UI Constants for the application
 * This file contains all the UI constants used across the application
 * for consistent styling and theming.
 */

/*** COLORS ***/

// Base Colors
export const COLORS = {
  // Primary brand colors
  PRIMARY: {
    50: 'bg-blue-50 dark:bg-blue-900/10',
    100: 'bg-blue-100 dark:bg-blue-900/20',
    200: 'bg-blue-200 dark:bg-blue-900/30',
    300: 'bg-blue-300 dark:bg-blue-800',
    400: 'bg-blue-400 dark:bg-blue-700',
    500: 'bg-blue-500 dark:bg-blue-600',
    600: 'bg-blue-600 dark:bg-blue-700',
    700: 'bg-blue-700 dark:bg-blue-800',
    800: 'bg-blue-800 dark:bg-blue-900',
    900: 'bg-blue-900 dark:bg-blue-950',
  },
  
  // Accent/Highlight colors
  ACCENT: {
    RED: {
      DEFAULT: 'bg-red-600',
      HOVER: 'hover:bg-red-700',
      TEXT: 'text-red-600 dark:text-red-500',
    },
    YELLOW: {
      DEFAULT: 'bg-yellow-500',
      HOVER: 'hover:bg-yellow-600',
      TEXT: 'text-yellow-500 dark:text-yellow-400',
    },
  },
  
  // Gray scale
  GRAY: {
    50: 'bg-gray-50 dark:bg-gray-950',
    100: 'bg-gray-100 dark:bg-gray-900',
    200: 'bg-gray-200 dark:bg-gray-800',
    300: 'bg-gray-300 dark:bg-gray-700',
    400: 'bg-gray-400 dark:bg-gray-600',
    500: 'bg-gray-500 dark:bg-gray-500',
    600: 'bg-gray-600 dark:bg-gray-400',
    700: 'bg-gray-700 dark:bg-gray-300',
    800: 'bg-gray-800 dark:bg-gray-200',
    900: 'bg-gray-900 dark:bg-gray-100',
  },
  
  // Base colors
  WHITE: 'bg-white dark:bg-gray-800',
  BLACK: 'bg-black dark:bg-gray-950',
  
  // Status colors
  SUCCESS: 'bg-green-500 dark:bg-green-600',
  ERROR: 'bg-red-500 dark:bg-red-600',
  WARNING: 'bg-yellow-500 dark:bg-yellow-600',
  INFO: 'bg-blue-500 dark:bg-blue-600',
};

// Text Colors
export const TEXT = {
  PRIMARY: 'text-gray-900 dark:text-white',
  SECONDARY: 'text-gray-600 dark:text-gray-300',
  TERTIARY: 'text-gray-500 dark:text-gray-400',
  DISABLED: 'text-gray-400 dark:text-gray-500',
  INVERTED: 'text-white dark:text-gray-900',
  LINK: 'text-blue-600 dark:text-blue-400',
  SUCCESS: 'text-green-600 dark:text-green-400',
  ERROR: 'text-red-600 dark:text-red-400',
  WARNING: 'text-yellow-600 dark:text-yellow-400',
};

/*** TYPOGRAPHY ***/

export const FONT = {
  SIZE: {
    XS: 'text-xs',
    SM: 'text-sm',
    BASE: 'text-base',
    LG: 'text-lg',
    XL: 'text-xl',
    '2XL': 'text-2xl',
    '3XL': 'text-3xl',
    '4XL': 'text-4xl',
  },
  WEIGHT: {
    NORMAL: 'font-normal',
    MEDIUM: 'font-medium',
    SEMIBOLD: 'font-semibold',
    BOLD: 'font-bold',
  },
  FAMILY: {
    SANS: 'font-sans',
    SERIF: 'font-serif',
    MONO: 'font-mono',
  },
};

/*** SPACING ***/

export const SPACING = {
  NONE: 'p-0',
  XS: 'p-1',
  SM: 'p-2',
  MD: 'p-4',
  LG: 'p-6',
  XL: 'p-8',
  '2XL': 'p-12',
  PADDING: {
    X: {
      NONE: 'px-0',
      XS: 'px-1',
      SM: 'px-2',
      MD: 'px-4',
      LG: 'px-6',
      XL: 'px-8',
    },
    Y: {
      NONE: 'py-0',
      XS: 'py-1',
      SM: 'py-2',
      MD: 'py-4',
      LG: 'py-6',
      XL: 'py-8',
      '2XL': 'py-12',
    },
  },
  MARGIN: {
    NONE: 'm-0',
    XS: 'm-1',
    SM: 'm-2',
    MD: 'm-4',
    LG: 'm-6',
    XL: 'm-8',
    X: {
      AUTO: 'mx-auto',
      NONE: 'mx-0',
      XS: 'mx-1',
      SM: 'mx-2',
      MD: 'mx-4',
      LG: 'mx-6',
      XL: 'mx-8',
    },
    Y: {
      NONE: 'my-0',
      XS: 'my-1',
      SM: 'my-2',
      MD: 'my-4',
      LG: 'my-6',
      XL: 'my-8',
    },
    BOTTOM: {
      NONE: 'mb-0',
      XS: 'mb-1',
      SM: 'mb-2',
      MD: 'mb-4',
      LG: 'mb-6',
      XL: 'mb-8',
    },
    TOP: {
      NONE: 'mt-0',
      XS: 'mt-1',
      SM: 'mt-2',
      MD: 'mt-4',
      LG: 'mt-6',
      XL: 'mt-8',
    },
  },
  GAP: {
    NONE: 'gap-0',
    XS: 'gap-1',
    SM: 'gap-2',
    MD: 'gap-4',
    LG: 'gap-6',
    XL: 'gap-8',
  },
};

/*** BORDERS & ROUNDED CORNERS ***/

export const BORDER = {
  NONE: 'border-none',
  DEFAULT: 'border border-gray-200 dark:border-gray-700',
  RADIUS: {
    NONE: 'rounded-none',
    SM: 'rounded-sm',
    DEFAULT: 'rounded',
    MD: 'rounded-md',
    LG: 'rounded-lg',
    XL: 'rounded-xl',
    FULL: 'rounded-full',
  },
};

/*** SHADOWS ***/

export const SHADOW = {
  NONE: 'shadow-none',
  SM: 'shadow-sm',
  DEFAULT: 'shadow',
  MD: 'shadow-md',
  LG: 'shadow-lg',
  XL: 'shadow-xl',
  '2XL': 'shadow-2xl',
};

/*** TRANSITIONS ***/

export const TRANSITION = {
  DEFAULT: 'transition-all duration-300',
  FAST: 'transition-all duration-150',
  SLOW: 'transition-all duration-500',
  COLORS: 'transition-colors duration-300',
  TRANSFORM: 'transition-transform duration-300',
  OPACITY: 'transition-opacity duration-300',
};

/*** EFFECTS ***/

export const EFFECTS = {
  HOVER: {
    SCALE: 'hover:scale-105',
    OPACITY: 'hover:opacity-80',
    SHADOW: 'hover:shadow-lg',
  },
};

/*** LAYOUTS ***/

export const LAYOUT = {
  CONTAINER: 'container mx-auto px-4 py-8',
  FLEX: {
    CENTER: 'flex items-center justify-center',
    BETWEEN: 'flex items-center justify-between',
    COLUMN: 'flex flex-col',
    ROW: 'flex flex-row',
  },
  GRID: {
    COLS: {
      1: 'grid grid-cols-1 gap-6',
      2: 'grid grid-cols-1 sm:grid-cols-2 gap-6',
      3: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6',
      4: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
    },
  },
};

/*** COMPONENTS ***/

// Common component styles
export const COMPONENTS = {
  CARD: {
    DEFAULT: 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden',
    HOVER: 'hover:shadow-lg transition-shadow duration-300',
    FULL: 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300',
  },
  BUTTON: {
    PRIMARY: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
    SECONDARY: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    DISABLED: 'px-4 py-2 bg-gray-200 text-gray-500 cursor-not-allowed rounded-md dark:bg-gray-700',
    ICON: 'rounded-full p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
  },
  MODAL: {
    OVERLAY: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80',
  },
  LOADING: {
    SPINNER: 'animate-spin',
    SKELETON: 'animate-pulse bg-gray-300 dark:bg-gray-700',
  },
}; 
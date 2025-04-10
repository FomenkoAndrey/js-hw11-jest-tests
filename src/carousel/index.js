/**
 * Carousel Module
 * @description Exports carousel components with different functionality
 */

// Basic carousel with core functionality
export { default as Carousel } from './core.js'

// Enhanced carousel with touch/swipe support
export { default as SwipeCarousel } from './swipe.js'

// Default export is the SwipeCarousel which has all functionality
export { default } from './swipe.js'

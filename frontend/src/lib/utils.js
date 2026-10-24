import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Optimizes external image URLs for faster loading
 * Specifically handles Unsplash and UI Avatars
 */
export function optimizeImageUrl(url, width = 600) {
  if (!url) return url;
  
  if (url.includes('images.unsplash.com')) {
    // Replace the width parameter to load a smaller image
    return url.replace(/w=\d+/, `w=${width}`);
  }
  
  if (url.includes('ui-avatars.com')) {
    // Add smaller size for avatars if not present
    if (!url.includes('size=')) {
      return `${url}&size=128`;
    }
  }
  
  return url;
}

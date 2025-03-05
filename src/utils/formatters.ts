/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Formats a price value to a standard currency format
 * Handles different price formats (number, string, null, undefined)
 * 
 * @param price - The price to format
 * @param defaultValue - The value to return if price is null/undefined
 * @returns Formatted price string
 */
export const formatPrice = (price: number | string | null | undefined, defaultValue = 'Price not available'): string => {
  if (price === null || price === undefined) {
    return defaultValue;
  }
  
  // Convert string to number if possible
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Check if conversion resulted in a valid number
  if (typeof numericPrice === 'number' && !isNaN(numericPrice)) {
    return numericPrice.toFixed(2);
  }
  
  // If it's a non-numeric string or conversion failed, return as is
  return String(price);
};

/**
 * Format price with currency symbol
 * 
 * @param price - The price value to format
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string with currency symbol
 */
export const formatCurrency = (
  price: number | string | null | undefined, 
  currency: string = '$',
  decimals: number = 2
): string => {
  return `${currency}${formatPrice(price)}`;
};

/**
 * Format a number with thousand separators
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string with thousand separators
 */
export const formatNumber = (value: number | string | null | undefined, decimals: number = 0): string => {
  const formattedValue = formatPrice(value);
  
  // Add thousand separators
  const parts = formattedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

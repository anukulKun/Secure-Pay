/**
 * Utility functions for working with Ethereum addresses
 */

/**
 * Shortens an Ethereum address for display
 * @param address - The full Ethereum address
 * @param startLength - Number of characters to keep at the start
 * @param endLength - Number of characters to keep at the end
 * @returns Shortened address with ellipsis in the middle
 */
export const shortenAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return '';
  if (address.length < startLength + endLength) return address;
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address to validate
 * @returns Boolean indicating if the address is valid
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  
  // Check if address contains only hexadecimal characters after 0x
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

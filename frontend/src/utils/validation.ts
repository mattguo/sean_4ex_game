/**
 * Validation utilities for form inputs
 * 
 * These validation rules match the backend validation to provide
 * immediate feedback to users.
 */

/**
 * Validate a nickname according to game rules
 * 
 * Rules:
 * - Must be between 3 and 20 characters
 * - Can only contain letters, numbers, and underscores
 * 
 * @param nickname - The nickname to validate
 * @returns null if valid, error message string if invalid
 */
export function validateNickname(nickname: string): string | null {
  if (!nickname || nickname.trim().length === 0) {
    return 'Nickname is required';
  }
  
  const trimmed = nickname.trim();
  
  if (trimmed.length < 3) {
    return 'Nickname must be at least 3 characters';
  }
  
  if (trimmed.length > 20) {
    return 'Nickname must be no more than 20 characters';
  }
  
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return 'Only letters, numbers, and underscores allowed';
  }
  
  return null;
}

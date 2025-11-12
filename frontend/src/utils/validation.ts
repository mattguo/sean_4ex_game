/**
 * Validation utilities for form inputs.
 * 
 * These validators match the backend validation rules to provide
 * immediate client-side feedback.
 */

const NICKNAME_MIN_LENGTH = 3;
const NICKNAME_MAX_LENGTH = 20;
const NICKNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

/**
 * Validate a player nickname.
 * 
 * Rules:
 * - Must not be empty
 * - Must be between 3 and 20 characters
 * - Must contain only letters, numbers, and underscores
 * 
 * @param nickname - The nickname to validate
 * @returns Error message if invalid, null if valid
 */
export function validateNickname(nickname: string): string | null {
  if (!nickname || nickname.trim() === '') {
    return 'Nickname is required';
  }

  const trimmed = nickname.trim();

  if (trimmed.length < NICKNAME_MIN_LENGTH) {
    return `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters`;
  }

  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be no more than ${NICKNAME_MAX_LENGTH} characters`;
  }

  if (!NICKNAME_PATTERN.test(trimmed)) {
    return 'Only letters, numbers, and underscores allowed';
  }

  return null;
}


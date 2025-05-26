// src/lib/utils/clipboard.ts

/**
 * Copies text to the clipboard.
 * @param text The text to copy.
 * @returns A Promise that resolves if the text was copied successfully, or rejects with an error.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (!navigator.clipboard) {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(new Error('Failed to copy text to clipboard.'));
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(new Error('Failed to copy text to clipboard.'));
  }
};

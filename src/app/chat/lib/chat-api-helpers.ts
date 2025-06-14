// --- Types and Helpers for AI Content Processing ---

// Define the expected structure of the chat API response
export interface ChatApiResponse {
  response: AiContentRaw;
  // Add other potential properties if the API returns them
  // e.g., sessionId?: string;
}

export interface ContentBlock {
  type: 'code' | 'mermaid';
  content: string;
  language?: string;
}

// For objects that might contain a single code block or mermaid diagram
export interface OtherObjectContent {
  code?: string;
  language?: string;
  mermaid?: string;
  [key: string]: unknown; // Allows any other properties, safer than 'any'
}

export type ArrayItemType = string | ContentBlock | OtherObjectContent;

export type AiContentRaw =
  | string
  | ContentBlock
  | OtherObjectContent
  | Array<ArrayItemType>
  | null
  | undefined;

// Type guard for ContentBlock
export function isContentBlock(item: unknown): item is ContentBlock {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    ((item as ContentBlock).type === 'code' ||
      (item as ContentBlock).type === 'mermaid') &&
    'content' in item &&
    typeof (item as ContentBlock).content === 'string'
  );
}

// Type guard for OtherObjectContent (basic check)
export function isOtherObjectContent(
  item: unknown,
): item is OtherObjectContent {
  return (
    typeof item === 'object' &&
    item !== null &&
    !Array.isArray(item) &&
    ('code' in item || 'mermaid' in item || Object.keys(item).length > 0)
  );
}

// Helper for single ContentBlock
export function processSingleContentBlock(block: ContentBlock): string {
  // Process based on the 'type' field
  switch (block.type) {
    case 'code': // Generic code block, use provided language or default
      return `\`\`\`${block.language || 'plaintext'}\n${block.content}\n\`\`\`;`;
    default:
      // Fallback: if type is unknown, represent the block as a JSON code block
      console.warn(
        `Unknown content block type: ${block.type}. Rendering as JSON.`,
      );
      return `\`\`\`JSON\n${JSON.stringify(block, null, 2)}\n\`\`\`;`;
  }
}

// Helper for OtherObjectContent
export function processOtherObjectContent(obj: OtherObjectContent): string {
  // Prioritize known code-like structures
  if (typeof obj.code === 'string')
    return `\`\`\`${obj.language || 'plaintext'}\n${obj.code}\n\`\`\`;`;
  // Fallback for any other object structure, treat as JSON
  console.warn(
    `Processing unknown object content structure. Rendering as JSON.`,
  );
  return `\`\`\`JSON\n${JSON.stringify(obj, null, 2)}\n\`\`\`;`;
}

// Processes the raw AI content received from the API into a single Markdown string.
// Handles strings, ContentBlock objects, OtherObjectContent objects, and arrays of these types.
export const processAiContentRaw = (rawContent: AiContentRaw): string => {
  if (typeof rawContent === 'string') {
    return rawContent;
  }
  // Explicitly handle null or undefined
  if (rawContent === null || typeof rawContent === 'undefined') {
    console.warn(
      'processAiContentRaw received null or undefined, defaulting to empty string.',
    );
    return '';
  }

  // Handle arrays of items
  if (Array.isArray(rawContent)) {
    return rawContent
      .map((item: ArrayItemType) => {
        if (typeof item === 'string') return item;
        if (isContentBlock(item)) {
          return processSingleContentBlock(item);
        }
        if (isOtherObjectContent(item)) {
          // Use refined type guard
          return processOtherObjectContent(item);
        }
        // Fallback for unexpected array item types
        console.warn('Array contains unexpected item type:', item);
        return String(item); // Convert unexpected types to string as a fallback
      })
      .join('\n\n'); // Join array items with double newline for separation
  }

  // Handle single objects
  if (isContentBlock(rawContent)) {
    return processSingleContentBlock(rawContent);
  }
  if (isOtherObjectContent(rawContent)) {
    // Use refined type guard
    return processOtherObjectContent(rawContent);
  }

  // Fallback for any other unexpected raw content type
  console.warn(
    'processAiContentRaw received unexpected raw content type:',
    rawContent,
  );
  return String(rawContent); // Convert unexpected types to string as a fallback
};

// Helper to extract a meaningful error message from a raw API response text.
export function getErrorMessageFromRawResponse(
  rawResponse: string,
  statusCode: number,
): string {
  const Suffix = '... (response truncated)';
  const MaxLength = 200;

  try {
    const errorData = JSON.parse(rawResponse);
    if (typeof errorData.error === 'string' && errorData.error.trim() !== '') {
      return errorData.error;
    }
    if (
      typeof errorData.message === 'string' &&
      errorData.message.trim() !== ''
    ) {
      return errorData.message;
    }
    // Fallback to truncated raw response if JSON was valid but no specific error field found
    if (rawResponse.trim() !== '' && rawResponse.trim() !== '{}') {
      return `Server Error ${statusCode}: ${rawResponse.substring(0, MaxLength)}${rawResponse.length > MaxLength ? Suffix : ''}`;
    }
  } catch (jsonParseError) {
    // If JSON parsing fails, use the truncated raw response
    return `Server Error ${statusCode}: ${rawResponse.substring(0, MaxLength)}${rawResponse.length > MaxLength ? Suffix : ''}`;
  }
  return `Server Error ${statusCode}: Empty or unparseable response.`;
}

// Parses an error response from the API
export async function parseApiErrorResponse(
  apiResponse: Response,
): Promise<string> {
  let errorResponseMessage = `API Error: ${apiResponse.status} ${apiResponse.statusText}`;

  try {
    const rawErrorResponse = await apiResponse.text();
    if (rawErrorResponse) {
      errorResponseMessage = getErrorMessageFromRawResponse(
        rawErrorResponse,
        apiResponse.status,
      );
    }
  } catch (textReadError) {
    console.error('Failed to read API error response as text:', textReadError);
    // If reading text fails, stick with the initial status text message
  }
  return errorResponseMessage;
}

import { Message } from '@/lib/chat-message-utils'; // Assuming Message interface is in chat-message-utils.ts
import { ChatState, ChatAction } from '@/lib/chat-reducer'; // Assuming ChatState and ChatAction are in chat-reducer.ts
import DOMPurify from 'dompurify'; // Assuming DOMPurify is used for sanitization

// Fetches chat response and processes it into a success or error object
export async function fetchAndProcessChatApi(
  userMessage: Message, // Accept the full user message object
  aiRespondingMessage: Message, // Accept the AI responding message object
  effectiveRetryLimit: number, // Accept the effective retry limit
  dispatch: React.Dispatch<ChatAction>, // Accept dispatch
  scrollToBottom: () => void, // Accept scrollToBottom
  currentMode: ChatState['mode'], // Accept currentMode
): Promise<void> {
  // Change return type to void as it dispatches actions
  console.log('Calling /api/chat with message:', userMessage.content);
  console.time('Fetch /api/chat');

  const currentRetryCount = userMessage.retryCount || 0;

  // Check if retries are exhausted *before* attempting the send
  if (currentRetryCount >= effectiveRetryLimit + 1) {
    console.warn(
      `Max retries (${effectiveRetryLimit}) reached for message ID ${userMessage.id}. Aborting send attempt ${currentRetryCount}.`,
    );
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        id: userMessage.id, // Use id
        updates: {
          status: 'error',
          error:
            userMessage.error ||
            `Aborted: Exceeded retry limit (${effectiveRetryLimit}) after ${currentRetryCount} attempts.`,
        },
      },
    });
    return;
  }

  // Sanitize the message content before sending
  const sanitizedContent = DOMPurify.sanitize(userMessage.content);

  // Update UI to show sending status for this attempt
  dispatch({
    type: 'UPDATE_MESSAGE',
    payload: {
      id: userMessage.id, // Use id
      updates: {
        status: 'sending',
        error: undefined,
        retryCount: currentRetryCount,
      },
    },
  });

  try {
    const apiResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: sanitizedContent.trim(),
        // Filter history to include only 'sent' messages for context
        history: [], // History should be managed by the component, not passed here
        mode: currentMode,
      }),
      cache: 'no-store',
    });
    console.timeEnd('Fetch /api/chat');
    console.log('API Response Status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorMessage = await parseApiErrorResponse(apiResponse);
      console.error(
        `API attempt failed for message ID ${userMessage.id} (Attempt ${currentRetryCount}): ${errorMessage}`,
      );
      const nextRetryCount = currentRetryCount + 1;

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: userMessage.id, // Use id
          updates: {
            status: 'error',
            error: errorMessage,
            retryCount: nextRetryCount,
          },
        },
      });
      return;
    }

    let data: ChatApiResponse;
    try {
      data = (await apiResponse.json()) as ChatApiResponse;
      console.log('API Data:', data);
    } catch (jsonError) {
      console.error('Failed to parse API response as JSON:', jsonError);
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: userMessage.id, // Use id
          updates: {
            status: 'error',
            error: 'Invalid JSON response from API.',
            retryCount: currentRetryCount + 1,
          },
        },
      });
      return;
    }

    const aiContentRaw = data?.response;
    const aiContent = processAiContentRaw(aiContentRaw);
    console.log('Processed aiContent before sending to UI:', aiContent);

    // Update the AI responding message with the actual content
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        id: aiRespondingMessage.id, // Use id
        updates: {
          content:
            aiContent.trim() !== ''
              ? aiContent
              : "Sorry, I couldn't fetch a valid response content. Please try again.",
          status: 'sent', // AI message is 'sent' once received
        },
      },
    });

    // Update the user message status to 'sent' after successful AI response
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        id: userMessage.id, // Use id
        updates: {
          status: 'sent',
          error: undefined,
        },
      },
    });

    scrollToBottom(); // Scroll after messages are updated
  } catch (error) {
    console.error(
      `Network/Fetch error for message ID ${userMessage.id} (Attempt ${currentRetryCount}):`,
      error,
    );
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown network error occurred during fetch.';
    const nextRetryCount = currentRetryCount + 1;

    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        id: userMessage.id, // Use id
        updates: {
          status: 'error',
          error: `Network error: ${message}`,
          retryCount: nextRetryCount,
        },
      },
    });
  }
}

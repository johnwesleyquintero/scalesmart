import { Message } from '@/lib/chat-message-utils'; // Assuming Message interface remains in chat-interface.tsx for now

export type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean; // True when waiting for AI response (any pending 'sending' message)
  isChatOpen: boolean; // Controls visibility of the chat window
  isFullScreen: boolean; // New state for fullscreen mode
  editingMessage: Message | null; // New state to hold the message being edited
  mode: 'default' | 'content' | 'code'; // New state for the agent mode, including 'code'
  isSidebarOpen: boolean; // New state for sidebar visibility
  lastModifiedMessageId: string | null; // Track the ID of the last message added or updated
};

export type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'TOGGLE_MODE'; payload: 'default' | 'content' | 'code' } // Action to set the mode with a payload
  | { type: 'TOGGLE_SIDEBAR' } // New action to toggle sidebar visibility
  | { type: 'ADD_MESSAGE'; payload: Message }
  | {
      type: 'UPDATE_MESSAGE';
      payload: {
        // Changed to identify by id
        id: string;
        updates: Partial<Message>; // Use Partial<Message> for updates
      };
    }
  | { type: 'REMOVE_MESSAGE'; payload: number } // Payload is the timestamp
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_EDITING_MESSAGE'; payload: Message | null };

// --- Helper Functions for Reducer ---

// Updates a specific message in the state array based on timestamp and role
const updateMessageInStateById = (
  messages: Message[],
  id: string,
  updates: Partial<Message>,
): Message[] => {
  return messages.map((msg) =>
    msg.id === id // Match by id
      ? { ...msg, ...updates }
      : msg,
  );
};

// Removes a message from the state array based on timestamp
const removeMessageFromState = (
  messages: Message[],
  timestamp: number,
): Message[] => {
  return messages.filter((msg) => msg.timestamp !== timestamp);
};

export const initialState: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  isChatOpen: false,
  isFullScreen: false, // Initialize to false
  editingMessage: null, // Initialize to null
  mode: 'default', // Initialize mode to 'default'
  isSidebarOpen: true, // Initialize sidebar to be open by default
  lastModifiedMessageId: null, // Initialize to null
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'TOGGLE_MODE': {
      return {
        ...state,
        mode: action.payload, // Set mode directly from payload
      };
    }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE': {
      const newMessage = action.payload.id
        ? action.payload
        : { ...action.payload, id: crypto.randomUUID() };

      if (state.messages.some((m) => m.id === newMessage.id)) {
        return state;
      }
      return {
        ...state,
        messages: [...state.messages, newMessage],
        lastModifiedMessageId: newMessage.id, // Set last modified ID
      };
    }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: updateMessageInStateById(
          state.messages,
          action.payload.id,
          action.payload.updates,
        ),
        lastModifiedMessageId: action.payload.id, // Set last modified ID
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: removeMessageFromState(state.messages, action.payload),
        lastModifiedMessageId: null, // No specific message was updated/added
      };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], lastModifiedMessageId: null }; // Clear last modified ID
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_CHAT':
      return {
        ...state,
        isChatOpen: !state.isChatOpen,
        isFullScreen: !state.isChatOpen ? false : state.isFullScreen,
      };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullScreen: !state.isFullScreen };
    case 'SET_EDITING_MESSAGE':
      return {
        ...state,
        editingMessage: action.payload,
        input: action.payload ? action.payload.content : '',
      };
    default:
      return state;
  }
}

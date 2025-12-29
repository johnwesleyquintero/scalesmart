import { PromptData, SavedRequest } from '@/lib/prompt-generator/types';

export interface PromptGeneratorState {
  promptData: PromptData;
  output: string;
  copied: boolean;
  loading: boolean;
  showSaveDialog: boolean;
  newRequestName: string;
  selectedSavedRequestId: string | null;
  validationErrors: Partial<Record<keyof PromptData, string>>;
  savedRequests: SavedRequest[];
  requestPendingDeletion: SavedRequest | null;
}

export const initialState: PromptGeneratorState = {
  promptData: {
    category: 'General Assistance',
    customCategory: '',
    context: '',
    request: '',
    parentTask: '',
    subtask: '',
    codeInput: '',
    outputFormat: '',
    constraints: '',
    examples: '',
    tone: '',
    additionalInfo: '',
  },
  output: '',
  copied: false,
  loading: false,
  showSaveDialog: false,
  newRequestName: '',
  selectedSavedRequestId: null,
  validationErrors: {},
  savedRequests: [],
  requestPendingDeletion: null,
};

export type PromptGeneratorAction =
  | { type: 'SET_FIELD'; field: keyof PromptData; value: string }
  | { type: 'SET_PROMPT_DATA'; payload: PromptData }
  | { type: 'CLEAR_FORM' }
  | { type: 'SET_OUTPUT'; payload: string }
  | { type: 'SET_COPIED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_SAVE_DIALOG'; payload: boolean }
  | { type: 'SET_NEW_REQUEST_NAME'; payload: string }
  | { type: 'SET_SELECTED_SAVED_REQUEST_ID'; payload: string | null }
  | {
      type: 'SET_VALIDATION_ERRORS';
      payload: Partial<Record<keyof PromptData, string>>;
    }
  | { type: 'SET_SAVED_REQUESTS'; payload: SavedRequest[] }
  | { type: 'LOAD_REQUEST'; payload: SavedRequest }
  | { type: 'DELETE_REQUEST'; payload: string }
  | { type: 'UPDATE_REQUEST'; payload: SavedRequest }
  | { type: 'SET_REQUEST_PENDING_DELETION'; payload: SavedRequest | null };

export function promptGeneratorReducer(
  state: PromptGeneratorState,
  action: PromptGeneratorAction,
): PromptGeneratorState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        promptData: {
          ...state.promptData,
          [action.field]: action.value,
        },
      };
    case 'SET_PROMPT_DATA':
      return { ...state, promptData: action.payload };
    case 'CLEAR_FORM':
      return {
        ...initialState,
        savedRequests: state.savedRequests,
      };
    case 'SET_OUTPUT':
      return { ...state, output: action.payload };
    case 'SET_COPIED':
      return { ...state, copied: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SHOW_SAVE_DIALOG':
      return { ...state, showSaveDialog: action.payload };
    case 'SET_NEW_REQUEST_NAME':
      return { ...state, newRequestName: action.payload };
    case 'SET_SELECTED_SAVED_REQUEST_ID':
      return { ...state, selectedSavedRequestId: action.payload };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'SET_SAVED_REQUESTS':
      return { ...state, savedRequests: action.payload };
    case 'LOAD_REQUEST':
      return {
        ...state,
        promptData: action.payload.data,
        selectedSavedRequestId: action.payload.id,
        validationErrors: {},
        output: '',
      };
    case 'DELETE_REQUEST': {
      const newSavedRequests = state.savedRequests.filter(
        (req) => req.id !== action.payload,
      );
      const isDeletingSelected =
        state.selectedSavedRequestId === action.payload;
      return {
        ...state,
        savedRequests: newSavedRequests,
        requestPendingDeletion: null, // Clear pending deletion after confirmation
        ...(isDeletingSelected
          ? { ...initialState, savedRequests: newSavedRequests }
          : {}),
      };
    }
    case 'UPDATE_REQUEST': {
      const newSavedRequests = state.savedRequests.map((req) =>
        req.id === action.payload.id ? action.payload : req,
      );
      return {
        ...state,
        savedRequests: newSavedRequests,
      };
    }
    case 'SET_REQUEST_PENDING_DELETION':
      return { ...state, requestPendingDeletion: action.payload };
    default:
      return state;
  }
}

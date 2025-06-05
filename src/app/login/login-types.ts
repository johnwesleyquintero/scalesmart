import { UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form';

// Define the expected return type for server actions
export type ServerActionResult = {
  success?: boolean;
  error?: string;
  mfaRequired?: boolean; // Specific to sign-in action
} | void; // Allow void for actions that don't return a specific result

// Type for managing the currently displayed form state
export type CurrentFormState =
  | 'login'
  | 'mfa'
  | 'forgotPassword'
  | 'forgotPasswordConfirmation';

// Props interface for the LoginForm component
export interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<ServerActionResult>;
  signUpAction: (formData: FormData) => Promise<never>; // Added signUpAction
  forgotPasswordAction: (formData: FormData) => Promise<ServerActionResult>;
  mfaVerifyAction: (formData: FormData) => Promise<ServerActionResult>;
  privacyPolicyHref: string;
  termsOfServiceHref: string;
}

// Props interface for a generic form field component
export interface FormFieldProps<TFieldValues extends FieldValues> {
  id: string;
  name: keyof TFieldValues;
  label: string;
  type: string;
  placeholder: string;
  registerAction: UseFormRegister<TFieldValues>; // Renamed to match FormField component
  errors: FieldErrors<TFieldValues>;
  disabled: boolean;
  autoComplete?: string;
  required?: boolean; // Make required optional as it's not always needed
  // Props for password visibility toggle
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePasswordVisibility?: () => void;
}

// Props interface for the SubmitButton component
export interface SubmitButtonProps {
  label: string;
  variant?: 'default' | 'outline';
  pending: boolean;
  disabled: boolean; // Added disabled prop
}

import {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form';

// Define the expected return type for server actions
export type ServerActionResult =
  | { success: true }
  | { success: false; error: string; mfaRequired?: boolean };

// Type for managing the currently displayed form state
export type CurrentFormState =
  | 'login'
  | 'mfa'
  | 'forgotPassword'
  | 'forgotPasswordConfirmation';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface MfaFormValues {
  mfaCode: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

// Props interface for the LoginForm component
export interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<ServerActionResult>;
  signUpAction: (formData: FormData) => Promise<ServerActionResult>;
  forgotPasswordAction: (formData: FormData) => Promise<ServerActionResult>;
  mfaVerifyAction: (formData: FormData) => Promise<ServerActionResult>;
  privacyPolicyHref: string;
  termsOfServiceHref: string;
}

// Props interface for a generic form field component
export interface FormFieldProps<TFieldValues extends FieldValues> {
  id: string;
  name: Path<TFieldValues>;
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

import * as z from 'zod';

// Define the expected return type for the sign-in action
export type SignInActionResult = {
  mfaRequired?: boolean;
  success?: boolean;
} | void;

// Type for managing the currently displayed form state
export type CurrentFormState = 'login' | 'mfa' | 'forgotPassword';

// Props interface for the LoginForm component
export interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<SignInActionResult>;
  signUpAction: (formData: FormData) => Promise<void>;
  forgotPasswordAction: (formData: FormData) => Promise<void>;
  mfaVerifyAction: (formData: FormData) => Promise<void>;
  privacyPolicyHref: string;
  termsOfServiceHref: string;
}

// Props interface for the SubmitButton component
export interface SubmitButtonProps {
  label: string;
  variant?: 'default' | 'outline';
  pending: boolean;
}

'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { signIn as NextAuthSignIn } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Removed unused import: import { set } from 'date-fns';

// --- Schemas ---
// Zod schema for email/password login form
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(50, 'Password must not exceed 50 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
});

// Zod schema for the MFA form
const mfaFormSchema = z.object({
  mfaCode: z.string().min(6, 'MFA code must be at least 6 digits.'), // Assuming 6 digits based on common MFA
});

// Zod schema for the Forgot Password form
const forgotPasswordFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

// --- Types ---
// Define the expected return type for the sign-in action
type SignInActionResult = { mfaRequired?: boolean; success?: boolean } | void; // Added success for clarity, though void implies success navigation
// Type for managing the currently displayed form state
type CurrentFormState = 'login' | 'mfa' | 'forgotPassword';

// Props interface for the LoginForm component
interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<SignInActionResult>;
  signUpAction: (formData: FormData) => Promise<void>; // signUpAction is defined but not used in the refactored form submission flow (assuming signup is a link or separate)
  forgotPasswordAction: (formData: FormData) => Promise<void>;
  mfaVerifyAction: (formData: FormData) => Promise<void>;
  privacyPolicyHref: string;
  termsOfServiceHref: string;
}

// Props interface for the SubmitButton component
interface SubmitButtonProps {
  label: string;
  variant?: 'default' | 'outline';
  pending: boolean; // Added pending prop
}

// --- Constants ---
const LOGIN_LABEL = 'Email/Password Login'; // Define constant for duplicated literal

// --- Helper Components ---

// Generic Submit Button Component
function SubmitButton({
  label,
  variant = 'default',
  pending,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit" // This button triggers the form's onSubmit handler
      disabled={pending} // Disable button while the action is pending
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      variant={variant}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

// Password Strength Indicator Component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[0-9]/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' },
  ];

  return (
    <div className="space-y-2 mt-2">
      {requirements.map((requirement, index) => (
        <div key={index} className="flex items-center space-x-2">
          {requirement.regex.test(password) ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm text-muted-foreground">
            {requirement.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Main Component ---
export default function LoginForm({
  signInAction,
  signUpAction, // signUpAction is present in props but assumed to be handled elsewhere (e.g., a link) for complexity reduction
  forgotPasswordAction,
  mfaVerifyAction,
  privacyPolicyHref,
  termsOfServiceHref,
}: LoginFormProps) {
  // State to manage which form is currently visible ('login', 'mfa', or 'forgotPassword')
  const [currentForm, setCurrentForm] = useState<CurrentFormState>('login');
  // State for GitHub sign-in loading state
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  // State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Use separate useTransition hooks for each distinct form submission flow
  const [isLoginPending, startLoginTransition] = useTransition();
  const [isMfaPending, startMfaTransition] = useTransition();
  const [isForgotPending, startForgotTransition] = useTransition();

  // --- React Hook Form Hooks ---
  // Hook for the main login form (email/password)
  const loginForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange', // Validate on change for better user feedback
  });

  // Hook for the MFA verification form
  const mfaForm = useForm<z.infer<typeof mfaFormSchema>>({
    resolver: zodResolver(mfaFormSchema),
    defaultValues: {
      mfaCode: '',
    },
    mode: 'onSubmit', // Simpler validation mode for MFA
  });

  // Hook for the Forgot Password form
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordFormSchema>>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit', // Validate on submit
  });

  // --- Event Handlers ---

  // Handles the GitHub sign-in process
  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    try {
      trackEvent({
        category: 'authentication',
        action: 'login_start',
        label: 'GitHub Login',
      });
      await NextAuthSignIn('github');
      // Successful GitHub sign-in typically involves a redirect, so success tracking might happen elsewhere
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      trackEvent({
        category: 'authentication',
        action: 'login_failure',
        label: 'GitHub Login',
        value: error instanceof Error ? 1 : 0, // Simple error indicator
      });
      // Consider showing a user-friendly error message to the user
    } finally {
      setIsGitHubLoading(false);
    }
  };

  // Handles submission for the main login form (Email/Password)
  const handleLoginSubmit = loginForm.handleSubmit(async (values, event) => {
    if (!event) return; // Ensure event is available for FormData
    const formData = new FormData(event.currentTarget);
    const startTime = Date.now(); // Start timing the action

    // Clear any previous errors before a new submission attempt
    loginForm.clearErrors();

    startLoginTransition(async () => {
      // Wrap the action in startTransition to manage pending state
      try {
        const result = await signInAction(formData);
        const duration = Date.now() - startTime;

        if (result?.mfaRequired) {
          setCurrentForm('mfa'); // Switch view to the MFA form
          loginForm.reset(); // Reset the login form fields
          trackEvent({
            category: 'authentication',
            action: 'login_mfa_required',
            label: LOGIN_LABEL,
            value: duration,
          });
        } else if (result?.success !== false) {
          // Assume successful login if MFA is not required and success is not explicitly false
          // Successful login typically involves navigation handled by next-auth or server action
          // If staying on page after success, uncomment loginForm.reset();
          // loginForm.reset();
          trackEvent({
            category: 'authentication',
            action: 'login_success',
            label: LOGIN_LABEL,
            value: duration,
          });
        } else {
          // Handle cases where signInAction returns a non-success result without requiring MFA
          console.error('Login failed with unspecified result:', result);
          // Set a general error message on a field, e.g., password or email
          loginForm.setError('password', {
            type: 'manual',
            message: 'Login failed. Please check your credentials.', // Provide user-friendly message
          });
          trackEvent({
            category: 'authentication',
            action: 'login_failure',
            label: LOGIN_LABEL,
            value: duration,
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error('Login failed:', error);
        // Set a user-friendly error message on form fields in case of action error
        loginForm.setError('password', {
          // Often credentials issues are surfaced on password field
          type: 'manual',
          message: 'Invalid email or password.', // User-friendly message
        });
        trackEvent({
          category: 'authentication',
          action: 'login_failure',
          label: LOGIN_LABEL,
          value: duration,
        });
      }
    });
  });

  // Handles submission for the MFA form
  const handleMfaSubmit = mfaForm.handleSubmit(async (values, event) => {
    if (!event) return;
    const formData = new FormData(event.currentTarget);

    // Clear any previous MFA errors
    mfaForm.clearErrors();

    startMfaTransition(async () => {
      // Use separate transition for MFA action
      try {
        await mfaVerifyAction(formData);
        // Assuming successful MFA verification navigates or updates state elsewhere.
        console.log('MFA verified successfully.');
        mfaForm.reset(); // Clear the MFA form
        setCurrentForm('login'); // Return to the login form state (or redirect as needed)
        trackEvent({
          category: 'authentication',
          action: 'mfa_verify_success',
          label: LOGIN_LABEL, // or a specific MFA label
        });
      } catch (error) {
        console.error('MFA verification failed:', error);
        // Display error message using react-hook-form setError
        mfaForm.setError('mfaCode', {
          type: 'manual',
          message: 'Invalid MFA code. Please try again.', // User-friendly error message
        });
        trackEvent({
          category: 'authentication',
          action: 'mfa_verify_failure',
          label: LOGIN_LABEL, // or specific MFA label
        });
      }
    });
  });

  // Handles submission for the Forgot Password form
  const handleForgotPasswordSubmit = forgotPasswordForm.handleSubmit(
    async (values, event) => {
      if (!event) return;
      const formData = new FormData(event.currentTarget);

      // Clear any previous forgot password errors
      forgotPasswordForm.clearErrors();

      startForgotTransition(async () => {
        // Use separate transition for forgot password action
        try {
          await forgotPasswordAction(formData);
          // Assuming successful request sends email and may or may not navigate
          console.log('Password reset email sent successfully.');
          // Display a success message to the user (optional, state variable could manage this)
          forgotPasswordForm.reset(); // Clear the form
          setCurrentForm('login'); // Return to the login form view
          trackEvent({
            category: 'authentication',
            action: 'forgot_password_request_success',
            label: values.email,
          });
        } catch (error) {
          console.error('Forgot password request failed:', error);
          // Display error message using react-hook-form setError
          forgotPasswordForm.setError('email', {
            // Often displayed on the email field
            type: 'manual',
            message: 'Failed to send reset email. Please try again.', // User-friendly error message
          });
          trackEvent({
            category: 'authentication',
            action: 'forgot_password_request_failure',
            label: values.email,
          });
        }
      });
    },
  );

  // --- Render Logic ---
  // Determine if any action is pending to disable global controls like the GitHub button
  const isAnyActionPending =
    isGitHubLoading || isLoginPending || isMfaPending || isForgotPending;

  return (
    <CardContent className="pt-0 sm:pt-2">
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* GitHub Sign-in Button - Always visible */}
        <Button
          variant="outline"
          className="w-full border-muted-foreground/40 hover:border-muted-foreground"
          onClick={handleGitHubSignIn}
          disabled={isAnyActionPending} // Disable if any other form action or GitHub is pending
        >
          {isGitHubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4 align-middle" />
          )}
          <span className="align-middle">Login with Github</span>
        </Button>

        {/* "OR CONTINUE WITH" separator - Visible only on the main login form */}
        {currentForm === 'login' && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wide font-medium">
                OR CONTINUE WITH
              </span>
            </div>
          </div>
        )}

        {/* --- Conditional Form Rendering --- */}
        {/* Render Login Form if currentForm is 'login' */}
        {currentForm === 'login' && (
          <form
            onSubmit={handleLoginSubmit} // Form submits to the handleLoginSubmit function
            className="flex flex-col gap-4 text-foreground"
            noValidate // Disable default browser validation
          >
            {/* Email Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email-login" className="text-sm font-medium">
                {' '}
                {/* Unique ID suffix for clarity */}
                Email
              </Label>
              <Input
                id="email-login" // Link label to input
                type="email"
                placeholder="m@example.com"
                className="h-10"
                autoComplete="email"
                {...loginForm.register('email')} // Register input with react-hook-form
                aria-invalid={
                  loginForm.formState.errors.email ? 'true' : 'false'
                } // ARIA attribute for accessibility
                disabled={isLoginPending} // Disable input during submission
              />
              {/* Display validation errors */}
              {loginForm.formState.errors.email && (
                <p
                  className="text-sm text-destructive"
                  role="alert" // ARIA role for errors
                  aria-live="polite" // Announce errors politely
                >
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password-login" className="text-sm font-medium">
                {' '}
                {/* Unique ID suffix */}
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password-login" // Link label to input
                  type={showPassword ? 'text' : 'password'} // Toggle visibility
                  placeholder="••••••••"
                  className="h-10 pr-10"
                  autoComplete="current-password"
                  {...loginForm.register('password')} // Register input
                  aria-invalid={
                    loginForm.formState.errors.password ? 'true' : 'false'
                  } // ARIA attribute
                  disabled={isLoginPending} // Disable input during submission
                />
                {/* Password visibility toggle button */}
                <Button
                  type="button" // Important: Prevents button from submitting the form
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 w-10 px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'} // ARIA label for accessibility
                  disabled={isLoginPending} // Disable button during submission
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* Display validation errors */}
              {loginForm.formState.errors.password && (
                <p
                  className="text-sm text-destructive mt-2"
                  role="alert"
                  aria-live="polite"
                >
                  {loginForm.formState.errors.password.message}
                </p>
              )}
              {/* Password Strength Indicator - Show only if password has content */}
              {loginForm.watch('password') && (
                <PasswordStrengthIndicator
                  password={loginForm.watch('password')}
                />
              )}
              {/* Forgot Password link/button */}
              <Button
                variant="link"
                type="button" // Important: Prevents button from submitting the form
                className="w-full justify-center px-0 mt-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
                onClick={() => {
                  setCurrentForm('forgotPassword'); // Switch view to forgot password form
                  loginForm.reset(); // Clear login form fields when switching
                }}
                disabled={isLoginPending} // Disable button during submission
              >
                Forgot your password?
              </Button>
            </div>

            {/* Sign In Button - Triggers form submission */}
            <SubmitButton
              label="Sign In"
              pending={isLoginPending} // Use login specific pending state
            />

            {/* Sign Up Button - Assumed to be a non-submitting button or link */}
            {/* Note: Original code had this as type="submit" which is unusual in this context. */}
            {/* Changed to type="button" as common UI pattern dictates Sign Up is separate. */}
            {/* If signUpAction should be called, add an onClick handler here */}
            <Button
              type="button" // Changed to button to prevent submitting the login form
              variant="outline"
              className="w-full border-muted-foreground/40 hover:border-muted-foreground"
              // Add onClick handler here if signUpAction needs to be triggered by this button
              // Example: onClick={() => startLoginTransition(async () => { await signUpAction(new FormData(event.currentTarget)); })}
              // disabled={isLoginPending} // Disable if login action is pending (adjust if Sign Up has separate pending)
              disabled={isAnyActionPending} // Disable if any other action is pending for safety
            >
              Sign Up
            </Button>
            {/* Alternative: Use a Link component if Sign Up is a separate page */}
            {/* <Link href="/signup" passHref>
              <Button variant="outline" className="w-full">Sign Up</Button>
            </Link> */}
          </form>
        )}

        {/* Render MFA Form if currentForm is 'mfa' */}
        {currentForm === 'mfa' && (
          <form
            onSubmit={handleMfaSubmit} // Form submits to the MFA handler
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            <div className="flex flex-col space-y-2">
              <Label htmlFor="mfaCode" className="text-sm font-medium">
                MFA Code
              </Label>
              <Input
                id="mfaCode"
                type="text" // Often text for varying code types, but number/tel also possible
                placeholder="Enter your MFA code"
                className="h-10"
                autoComplete="one-time-code" // Suggest one-time code autocomplete
                {...mfaForm.register('mfaCode')} // Register input
                aria-invalid={
                  mfaForm.formState.errors.mfaCode ? 'true' : 'false'
                } // ARIA attribute
                disabled={isMfaPending} // Disable input during submission
              />
              {/* Display validation/server errors */}
              {mfaForm.formState.errors.mfaCode && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {mfaForm.formState.errors.mfaCode.message}
                </p>
              )}
            </div>
            {/* MFA Verify Button - Triggers form submission */}
            <SubmitButton
              label="Verify Code"
              pending={isMfaPending} // Use MFA specific pending state
            />
            {/* Cancel MFA Button */}
            <Button
              type="button" // Prevents form submission
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setCurrentForm('login'); // Return to login form view
                mfaForm.reset(); // Clear MFA form on cancel
              }}
              disabled={isMfaPending} // Disable button during submission
            >
              Cancel
            </Button>
          </form>
        )}

        {/* Render Forgot Password Form if currentForm is 'forgotPassword' */}
        {currentForm === 'forgotPassword' && (
          <form
            onSubmit={handleForgotPasswordSubmit} // Form submits to the forgot password handler
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email-forgot" className="text-sm font-medium">
                {' '}
                {/* Unique ID suffix */}
                Email
              </Label>
              <Input
                id="email-forgot" // Link label
                type="email"
                placeholder="m@example.com"
                className="h-10"
                autoComplete="email"
                {...forgotPasswordForm.register('email')} // Register input
                aria-invalid={
                  forgotPasswordForm.formState.errors.email ? 'true' : 'false'
                } // ARIA attribute
                disabled={isForgotPending} // Disable input during submission
              />
              {/* Display validation/server errors */}
              {forgotPasswordForm.formState.errors.email && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {forgotPasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            {/* Reset Password Button - Triggers form submission */}
            <SubmitButton
              label="Send Reset Link" // Clearer label
              pending={isForgotPending} // Use forgot password specific pending state
            />
            {/* Back to Login Button */}
            <Button
              type="button" // Prevents form submission
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setCurrentForm('login'); // Return to login form view
                forgotPasswordForm.reset(); // Clear form fields on navigating back
              }}
              disabled={isForgotPending} // Disable button during submission
            >
              Back to Login
            </Button>
          </form>
        )}

        {/* Terms and Privacy Links - Always visible */}
        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link
            href={termsOfServiceHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href={privacyPolicyHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </CardContent>
  );
}

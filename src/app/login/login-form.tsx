'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Eye, EyeOff, Loader2 } from 'lucide-react'; // Removed Check, X as they are in helper component
import { signIn as NextAuthSignIn } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import schemas, types, and helper components from new files
import { z } from 'zod'; // Import z from zod for schema validation
import {
  formSchema,
  mfaFormSchema,
  forgotPasswordFormSchema,
} from './login-schemas';
import {
  SignInActionResult,
  CurrentFormState,
  LoginFormProps,
} from './login-types';
import {
  SubmitButton,
  PasswordStrengthIndicator,
} from './login-helper-components';

// --- Constants ---
const LOGIN_LABEL = 'Email/Password Login';

// --- Main Component ---
/**
 * LoginForm component handles user authentication flows including email/password login,
 * MFA verification, and forgot password requests. It utilizes react-hook-form for
 * form management and server actions for authentication logic.
 */
export default function LoginForm({
  signInAction,
  signUpAction, // Note: signUpAction is present in props but assumed to be handled elsewhere (e.g., a link) for complexity reduction within this component.
  forgotPasswordAction,
  mfaVerifyAction,
  privacyPolicyHref,
  termsOfServiceHref,
}: LoginFormProps) {
  // --- State Management ---
  // Manages the currently displayed form ('login', 'mfa', or 'forgotPassword').
  const [currentForm, setCurrentForm] = useState<CurrentFormState>('login');
  // Manages the loading state specifically for the GitHub sign-in button.
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  // Toggles the visibility of the password input field.
  const [showPassword, setShowPassword] = useState(false);
  // Displays a general message to the user (e.g., success/error messages).
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);

  // --- Transitions for Server Actions ---
  // Separate transitions for each distinct form submission flow to manage pending states independently.
  const [isLoginPending, startLoginTransition] = useTransition();
  const [isMfaPending, startMfaTransition] = useTransition();
  const [isForgotPending, startForgotTransition] = useTransition();

  // --- React Hook Form Hooks ---
  // --- React Hook Form Hooks ---
  // Manages the state and validation for the main email/password login form.
  const loginForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange', // Validate on change for better user feedback during typing.
  });

  // Manages the state and validation for the MFA verification form.
  const mfaForm = useForm<z.infer<typeof mfaFormSchema>>({
    resolver: zodResolver(mfaFormSchema),
    defaultValues: {
      mfaCode: '',
    },
    mode: 'onSubmit', // Validate only on form submission for simplicity.
  });

  // Manages the state and validation for the Forgot Password request form.
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordFormSchema>>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit', // Validate only on form submission.
  });

  // --- Event Handlers ---

  // --- Event Handlers ---

  /**
   * Handles the GitHub sign-in process.
   * Sets loading state, tracks the event, and calls next-auth's signIn.
   * Includes basic error handling and analytics tracking.
   */
  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    setGeneralMessage(null); // Clear any previous general messages
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
      // Provide a user-friendly error message.
      setGeneralMessage('Failed to sign in with GitHub. Please try again.');
      trackEvent({
        category: 'authentication',
        action: 'login_failure',
        label: 'GitHub Login',
        value: error instanceof Error ? 1 : 0, // Simple error indicator
      });
    } finally {
      setIsGitHubLoading(false);
    }
  };

  /**
   * Handles submission for the main login form (Email/Password).
   * Uses react-hook-form's handleSubmit for validation.
   * Wraps the server action call in startLoginTransition to manage pending state.
   * Handles different results from the server action (MFA required, success, failure).
   * Includes error handling and analytics tracking.
   */
  const handleLoginSubmit = loginForm.handleSubmit(async (values, event) => {
    // Ensure event is available to construct FormData.
    if (!event) return;
    const formData = new FormData(event.currentTarget);
    const startTime = Date.now(); // Start timing the action for performance tracking.

    // Clear any previous errors and messages before a new submission attempt.
    loginForm.clearErrors();
    setGeneralMessage(null);

    // Wrap the asynchronous server action call in startTransition.
    startLoginTransition(async () => {
      try {
        // Execute the server action.
        const result = await signInAction(formData);
        const duration = Date.now() - startTime; // Calculate action duration.

        // Handle different possible outcomes from the server action.
        if (result?.mfaRequired) {
          setCurrentForm('mfa'); // Switch the UI to display the MFA form.
          loginForm.reset(); // Clear the login form fields.
          setGeneralMessage('MFA required. Please enter your code.'); // Inform the user.
          trackEvent({
            category: 'authentication',
            action: 'login_mfa_required',
            label: LOGIN_LABEL,
            value: duration,
          });
        } else if (result?.success !== false) {
          // Assume successful login if MFA is not required and success is not explicitly false.
          // Note: Successful login typically involves navigation handled by next-auth or the server action itself.
          // If the component should remain on the page after success, uncomment the line below:
          // loginForm.reset();
          trackEvent({
            category: 'authentication',
            action: 'login_success',
            label: LOGIN_LABEL,
            value: duration,
          });
        } else {
          // Handle cases where signInAction returns a non-success result without requiring MFA.
          console.error('Login failed with unspecified result:', result);
          // Display a general error message to the user.
          setGeneralMessage('Login failed. Please check your credentials.');
          trackEvent({
            category: 'authentication',
            action: 'login_failure',
            label: LOGIN_LABEL,
            value: duration,
          });
        }
      } catch (error) {
        // Handle unexpected errors during the server action call.
        const duration = Date.now() - startTime;
        console.error('Login failed:', error);
        // Display a user-friendly error message.
        setGeneralMessage('Invalid email or password.');
        trackEvent({
          category: 'authentication',
          action: 'login_failure',
          label: LOGIN_LABEL,
          value: duration,
        });
      }
    });
  });

  /**
   * Handles submission for the MFA verification form.
   * Uses react-hook-form's handleSubmit for validation.
   * Wraps the server action call in startMfaTransition to manage pending state.
   * Includes error handling and analytics tracking.
   */
  const handleMfaSubmit = mfaForm.handleSubmit(async (values, event) => {
    if (!event) return;
    const formData = new FormData(event.currentTarget);

    // Clear any previous MFA errors and general messages.
    mfaForm.clearErrors();
    setGeneralMessage(null);

    // Wrap the asynchronous server action call in startMfaTransition.
    startMfaTransition(async () => {
      try {
        // Execute the MFA verification server action.
        await mfaVerifyAction(formData);
        // Assuming successful MFA verification navigates or updates state elsewhere.
        console.log('MFA verified successfully.');
        mfaForm.reset(); // Clear the MFA form fields.
        setCurrentForm('login'); // Return to the login form state (or redirect as needed).
        setGeneralMessage('MFA verified successfully. Redirecting...'); // Inform the user.
        trackEvent({
          category: 'authentication',
          action: 'mfa_verify_success',
          label: LOGIN_LABEL, // or a specific MFA label
        });
      } catch (error) {
        console.error('MFA verification failed:', error);
        // Display a field-specific error message using react-hook-form's setError.
        mfaForm.setError('mfaCode', {
          type: 'manual',
          message: 'Invalid MFA code. Please try again.', // User-friendly error message.
        });
        setGeneralMessage('MFA verification failed.'); // General feedback.
        trackEvent({
          category: 'authentication',
          action: 'mfa_verify_failure',
          label: LOGIN_LABEL, // or specific MFA label
        });
      }
    });
  });

  /**
   * Handles submission for the Forgot Password request form.
   * Uses react-hook-form's handleSubmit for validation.
   * Wraps the server action call in startForgotTransition to manage pending state.
   * Includes error handling and analytics tracking.
   */
  const handleForgotPasswordSubmit = forgotPasswordForm.handleSubmit(
    async (values, event) => {
      if (!event) return;
      const formData = new FormData(event.currentTarget);

      // Clear any previous forgot password errors and general messages.
      forgotPasswordForm.clearErrors();
      setGeneralMessage(null);

      // Wrap the asynchronous server action call in startForgotTransition.
      startForgotTransition(async () => {
        try {
          // Execute the forgot password server action.
          await forgotPasswordAction(formData);
          // Assuming successful request sends email and may or may not navigate.
          console.log('Password reset email sent successfully.');
          // Display a success message to the user.
          setGeneralMessage('Password reset link sent to your email.');
          forgotPasswordForm.reset(); // Clear the form fields.
          setCurrentForm('login'); // Return to the login form view.
          trackEvent({
            category: 'authentication',
            action: 'forgot_password_request_success',
            label: values.email,
          });
        } catch (error) {
          console.error('Forgot password request failed:', error);
          // Display a field-specific error message using react-hook-form's setError.
          forgotPasswordForm.setError('email', {
            // Often displayed on the email field.
            type: 'manual',
            message: 'Failed to send reset email. Please try again.', // User-friendly error message.
          });
          setGeneralMessage('Failed to send password reset email.'); // General feedback.
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
  // Determines if any form submission or the GitHub sign-in is currently in progress.
  // Used to disable buttons and inputs to prevent multiple submissions.
  const isAnyActionPending =
    isGitHubLoading || isLoginPending || isMfaPending || isForgotPending;

  return (
    <CardContent className="pt-0 sm:pt-2">
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* GitHub Sign-in Button */}
        {/* Always visible, provides an alternative sign-in method. */}
        <Button
          variant="outline"
          className="w-full border-muted-foreground/40 hover:border-muted-foreground"
          onClick={handleGitHubSignIn}
          disabled={isAnyActionPending} // Disable if any other form action or GitHub is pending.
        >
          {isGitHubLoading ? (
            // Display a spinner when loading.
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            // Display the GitHub icon when not loading.
            <Github className="mr-2 h-4 w-4 align-middle" />
          )}
          <span className="align-middle">Login with Github</span>
        </Button>

        {/* "OR CONTINUE WITH" separator */}
        {/* Visible only when the main login form is displayed. */}
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

        {/* General Message Display */}
        {/* Displays informational messages to the user (e.g., success, general errors). */}
        {generalMessage && (
          <div
            className="my-2 space-y-2 px-4 sm:px-0" // Adjusted padding for better mobile view.
            role="status" // ARIA role for live regions.
            aria-live="polite" // Announce changes politely to screen readers.
          >
            <p className="rounded-md bg-muted/50 p-3 text-sm text-foreground border">
              {generalMessage}
            </p>
          </div>
        )}

        {/* --- Conditional Form Rendering --- */}
        {/* Renders the appropriate form based on the currentForm state. */}

        {/* Login Form (Email/Password) */}
        {currentForm === 'login' && (
          <form
            onSubmit={handleLoginSubmit} // Binds form submission to the handler.
            className="flex flex-col gap-4 text-foreground"
            noValidate // Disables default browser validation to rely on react-hook-form.
          >
            {/* Email Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email-login" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email-login" // Unique ID to link label and input.
                type="email"
                placeholder="m@example.com"
                className="h-10"
                autoComplete="email" // Improves accessibility and user experience.
                {...loginForm.register('email')} // Registers the input with react-hook-form for state and validation.
                aria-invalid={
                  loginForm.formState.errors.email ? 'true' : 'false'
                } // ARIA attribute to indicate validation status for accessibility.
                disabled={isLoginPending} // Disables the input while the login action is pending.
              />
              {/* Displays validation errors for the email field. */}
              {loginForm.formState.errors.email && (
                <p
                  className="text-sm text-destructive"
                  role="alert" // ARIA role to indicate an alert message.
                  aria-live="polite" // ARIA attribute to announce changes politely to screen readers.
                >
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password-login" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password-login" // Unique ID to link label and input.
                  type={showPassword ? 'text' : 'password'} // Toggles input type based on showPassword state.
                  placeholder="••••••••"
                  className="h-10 pr-10" // Adds padding to accommodate the toggle button.
                  autoComplete="current-password" // Improves accessibility and user experience.
                  {...loginForm.register('password')} // Registers the input with react-hook-form.
                  aria-invalid={
                    loginForm.formState.errors.password ? 'true' : 'false'
                  } // ARIA attribute for accessibility.
                  disabled={isLoginPending} // Disables the input while the login action is pending.
                />
                {/* Password visibility toggle button */}
                <Button
                  type="button" // Explicitly set to 'button' to prevent form submission.
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 w-10 px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)} // Toggles password visibility state.
                  aria-label={showPassword ? 'Hide password' : 'Show password'} // ARIA label for accessibility.
                  disabled={isLoginPending} // Disables the button while the login action is pending.
                >
                  {showPassword ? (
                    // Displays the EyeOff icon when password is visible.
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    // Displays the Eye icon when password is hidden.
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* Displays validation errors for the password field. */}
              {loginForm.formState.errors.password && (
                <p
                  className="text-sm text-destructive mt-2"
                  role="alert"
                  aria-live="polite"
                >
                  {loginForm.formState.errors.password.message}
                </p>
              )}
              {/* Password Strength Indicator */}
              {/* Only shown if the password input has content. */}
              {loginForm.watch('password') && (
                <PasswordStrengthIndicator
                  password={loginForm.watch('password')}
                />
              )}
              {/* Forgot Password link/button */}
              <Button
                variant="link"
                type="button" // Explicitly set to 'button' to prevent form submission.
                className="w-full justify-center px-0 mt-2 text-sm sm:text-base font-semibold text-primary hover:text-primary/80"
                onClick={() => {
                  setCurrentForm('forgotPassword'); // Switches the UI to the forgot password form.
                  loginForm.reset(); // Clears the login form fields when switching.
                  loginForm.clearErrors(); // Clears any validation errors when switching.
                  setGeneralMessage(null); // Clears any general messages when switching.
                }}
                disabled={isLoginPending} // Disables the button while the login action is pending.
              >
                Forgot your password?
              </Button>
            </div>

            {/* Sign In Button */}
            {/* Triggers the form submission when clicked. */}
            <SubmitButton
              label="Sign In"
              pending={isLoginPending} // Passes the login specific pending state to the SubmitButton component.
            />

            {/* Sign Up Link */}
            {/* Provides a link to the signup page. Using next/link for client-side navigation. */}
            <Link href="/signup" passHref legacyBehavior>
              {/* Assuming /signup is the signup page */}
              <Button
                variant="outline"
                className="w-full border-muted-foreground/40 hover:border-muted-foreground"
                disabled={isAnyActionPending} // Disables the button if any other action is pending.
              >
                Sign Up
              </Button>
            </Link>
          </form>
        )}

        {/* MFA Verification Form */}
        {/* Renders when currentForm is 'mfa'. */}
        {currentForm === 'mfa' && (
          <form
            onSubmit={handleMfaSubmit} // Binds form submission to the MFA handler.
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            <div className="flex flex-col space-y-2">
              <Label htmlFor="mfaCode" className="text-sm font-medium">
                MFA Code
              </Label>
              <Input
                id="mfaCode" // Unique ID.
                type="text" // Using text for flexibility with different MFA code types.
                placeholder="Enter your MFA code"
                className="h-10"
                autoComplete="one-time-code" // Suggests autocomplete for one-time codes.
                {...mfaForm.register('mfaCode')} // Registers the input with react-hook-form.
                aria-invalid={
                  mfaForm.formState.errors.mfaCode ? 'true' : 'false'
                } // ARIA attribute for accessibility.
                disabled={isMfaPending} // Disables the input while the MFA action is pending.
              />
              {/* Displays validation/server errors for the MFA code field. */}
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
            {/* MFA Verify Button */}
            {/* Triggers the MFA form submission. */}
            <SubmitButton
              label="Verify Code"
              pending={isMfaPending} // Passes the MFA specific pending state.
            />
            {/* Cancel MFA Button */}
            <Button
              type="button" // Explicitly set to 'button' to prevent form submission.
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setCurrentForm('login'); // Returns to the login form view.
                mfaForm.reset(); // Clears the MFA form fields on cancel.
                mfaForm.clearErrors(); // Clears any validation errors on cancel.
                setGeneralMessage(null); // Clears any general messages on cancel.
              }}
              disabled={isMfaPending} // Disables the button while the MFA action is pending.
            >
              Cancel
            </Button>
          </form>
        )}

        {/* Forgot Password Form */}
        {/* Renders when currentForm is 'forgotPassword'. */}
        {currentForm === 'forgotPassword' && (
          <form
            onSubmit={handleForgotPasswordSubmit} // Binds form submission to the forgot password handler.
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email-forgot" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email-forgot" // Unique ID.
                type="email"
                placeholder="m@example.com"
                className="h-10"
                autoComplete="email" // Improves accessibility and user experience.
                {...forgotPasswordForm.register('email')} // Registers the input with react-hook-form.
                aria-invalid={
                  forgotPasswordForm.formState.errors.email ? 'true' : 'false'
                } // ARIA attribute for accessibility.
                disabled={isForgotPending} // Disables the input while the forgot password action is pending.
              />
              {/* Displays validation/server errors for the email field. */}
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
            {/* Reset Password Button */}
            {/* Triggers the forgot password form submission. */}
            <SubmitButton
              label="Send Reset Link" // Clearer label for the button.
              pending={isForgotPending} // Passes the forgot password specific pending state.
            />
            {/* Back to Login Button */}
            <Button
              type="button" // Explicitly set to 'button' to prevent form submission.
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setCurrentForm('login'); // Returns to the login form view.
                forgotPasswordForm.reset(); // Clears the form fields on navigating back.
                forgotPasswordForm.clearErrors(); // Clears any validation errors on navigating back.
                setGeneralMessage(null); // Clears any general messages on navigating back.
              }}
              disabled={isForgotPending} // Disables the button while the forgot password action is pending.
            >
              Back to Login
            </Button>
          </form>
        )}

        {/* Terms and Privacy Links */}
        {/* Always visible at the bottom of the form. */}
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

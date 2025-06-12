'use client';

import { useState, useTransition, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Github, Loader2 } from 'lucide-react';
import { signIn as NextAuthSignIn } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import {
  useForm,
  UseFormRegister,
  FieldErrors,
  FieldValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

import { z } from 'zod';
import {
  formSchema,
  mfaFormSchema,
  forgotPasswordFormSchema,
} from './login-schemas';
import {
  ServerActionResult,
  CurrentFormState,
  LoginFormProps,
  FormFieldProps,
  SubmitButtonProps,
  LoginFormValues,
  MfaFormValues,
  ForgotPasswordFormValues,
} from './login-types';
import {
  SubmitButton,
  PasswordStrengthIndicator,
} from './login-helper-components';
import { FormField } from './login-form-field';

// --- Constants ---
// Analytics Labels
const AUTH_EVENT_CATEGORY = 'authentication';
const LOGIN_LABEL = 'Email/Password Login';
const GITHUB_LOGIN_LABEL = 'GitHub Login';
const MFA_VERIFY_LABEL = 'MFA Verification';
const FORGOT_PASSWORD_LABEL = 'Forgot Password Request';

// Form Default Values
const DEFAULT_LOGIN_VALUES: LoginFormValues = {
  email: '',
  password: '',
  rememberMe: false,
};
const DEFAULT_MFA_VALUES: MfaFormValues = {
  mfaCode: '',
};
const DEFAULT_FORGOT_PASSWORD_VALUES: ForgotPasswordFormValues = {
  email: '',
};

// UI Messages and Titles (for toasts and field errors)
const TOAST_TITLE_AUTH_FAILED = 'Authentication Failed';
const TOAST_TITLE_FORM_ERROR = 'Form Error';
const TOAST_TITLE_MFA_REQUIRED = 'MFA Required';
const TOAST_TITLE_LOGIN_SUCCESS = 'Login Successful';
const TOAST_TITLE_MFA_VERIFIED = 'MFA Verified';
const TOAST_TITLE_MFA_FAILED = 'MFA Failed';
const TOAST_TITLE_PASSWORD_RESET_INITIATED = 'Password Reset Initiated';
const TOAST_TITLE_PASSWORD_RESET_FAILED = 'Reset Failed';

const TOAST_DESCRIPTION_GITHUB_FAILED =
  'Failed to sign in with GitHub. Please try again.';
const TOAST_DESCRIPTION_FORM_SUBMISSION_ERROR =
  'Could not submit form due to an internal error.';
const TOAST_DESCRIPTION_MFA_REQUIRED =
  'Please enter your MFA code to complete login.';
const TOAST_DESCRIPTION_LOGIN_SUCCESS = 'You have been successfully logged in.';
const TOAST_DESCRIPTION_MFA_VERIFIED =
  'MFA code verified successfully. Redirecting...';
const TOAST_DESCRIPTION_MFA_FAILED =
  'MFA verification failed. Please try again.';
const TOAST_DESCRIPTION_LOGIN_FAILED_CREDENTIALS =
  'Invalid email or password. Please try again.';
const TOAST_DESCRIPTION_PASSWORD_RESET_SENT =
  'A password reset link has been sent to your email.';
const TOAST_DESCRIPTION_PASSWORD_RESET_FAILED =
  'Failed to send password reset email. Please try again.';

const FIELD_ERROR_INVALID_MFA = 'Invalid MFA code. Please try again.';
const FIELD_ERROR_PASSWORD_RESET_FAILED =
  'Failed to send reset email. Please try again.';

// --- Main Component ---
/**
 * LoginForm component handles user authentication flows including email/password login,
 * MFA verification, and forgot password requests. It utilizes react-hook-form for
 * form management and server actions for authentication logic.
 */
export default function LoginForm({
  signInAction,
  signUpAction,
  forgotPasswordAction,
  mfaVerifyAction,
  privacyPolicyHref,
  termsOfServiceHref,
}: LoginFormProps) {
  // --- State Management ---
  const [currentForm, setCurrentForm] = useState<CurrentFormState>('login');
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility toggle

  // --- Toast Notification Hook ---
  const { toast } = useToast(); // Hook for showing user notifications

  // --- Transitions for Server Actions ---
  // Manage pending states for each distinct server action flow
  const [isLoginPending, startLoginTransition] = useTransition();
  const [isMfaPending, startMfaTransition] = useTransition();
  const [isForgotPending, startForgotTransition] = useTransition();

  // Determine if any form action is currently pending to disable buttons/links
  const isAnyActionPending =
    isGitHubLoading || isLoginPending || isMfaPending || isForgotPending;

  // --- React Hook Form Hooks ---
  // Setup form instances for different authentication flows
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema), // Zod for schema validation
    defaultValues: DEFAULT_LOGIN_VALUES,
    mode: 'onChange', // Validate on change for better UX
    // Consider adding reValidateMode: 'onSubmit' or 'onBlur' if onChange is too aggressive
  });

  const mfaForm = useForm<MfaFormValues>({
    resolver: zodResolver(mfaFormSchema),
    defaultValues: DEFAULT_MFA_VALUES,
    mode: 'onSubmit', // Validate only on submit for MFA
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: DEFAULT_FORGOT_PASSWORD_VALUES,
    mode: 'onSubmit', // Validate only on submit for forgot password
  });

  // --- Helper Functions ---
  /**
   * Logs authentication-related events using the analytics tracking function.
   */
  const logAuthEvent = useCallback(
    (action: string, label: string, value?: number) => {
      // Ensure trackEvent is robust and handles potential errors internally
      if (typeof trackEvent === 'function') {
        trackEvent({
          category: AUTH_EVENT_CATEGORY,
          action,
          label,
          value,
        });
      } else {
        console.warn('trackEvent function not available.');
        // Fallback logging or no-op
      }
    },
    [],
  ); // Empty dependency array as trackEvent is assumed to be stable

  /**
   * Displays a standard form submission error toast.
   */
  const showFormSubmissionErrorToast = useCallback(() => {
    toast({
      title: TOAST_TITLE_FORM_ERROR,
      description: TOAST_DESCRIPTION_FORM_SUBMISSION_ERROR,
      variant: 'destructive',
    });
  }, [toast]); // Dependency on toast, which is assumed to be stable from useToast hook

  // Function to navigate back to login form and reset its state
  const navigateBackToLogin = useCallback(() => {
    setCurrentForm('login');
    loginForm.reset(DEFAULT_LOGIN_VALUES); // Reset login form state
    loginForm.clearErrors(); // Clear any previous errors on login form
    setShowPassword(false); // Reset password visibility state
  }, [loginForm, setCurrentForm, setShowPassword]); // Dependencies: loginForm, setCurrentForm, setShowPassword

  // --- Event Handlers ---
  /**
   * Handles the GitHub sign-in process.
   * Sets loading state, tracks the event, and calls next-auth's signIn.
   * Includes basic error handling and analytics tracking.
   */
  const handleGitHubSignIn = useCallback(async () => {
    setIsGitHubLoading(true);
    try {
      logAuthEvent('login_start', GITHUB_LOGIN_LABEL);
      // NextAuthSignIn handles redirects automatically on success/failure
      await NextAuthSignIn('github');
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      toast({
        title: TOAST_TITLE_AUTH_FAILED,
        description: TOAST_DESCRIPTION_GITHUB_FAILED,
        variant: 'destructive',
      });
      // Track error, value could indicate type or code if available
      logAuthEvent(
        'login_failure',
        GITHUB_LOGIN_LABEL,
        error instanceof Error ? 1 : 0,
      );
    } finally {
      setIsGitHubLoading(false);
    }
  }, [logAuthEvent, toast]); // Dependencies: logAuthEvent, toast (setIsGitHubLoading is a state setter, so it's stable)

  /**
   * Handles submission for the main login form (Email/Password).
   * Uses react-hook-form's handleSubmit for validation.
   * Wraps the server action call in startLoginTransition to manage pending state.
   * Handles different results from the server action (MFA required, success, failure).
   * Includes error handling and analytics tracking.
   */
  const handleLoginSubmit = loginForm.handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append('email', values.email);
    formData.append('password', values.password);
    formData.append('rememberMe', String(values.rememberMe));
    const startTime = Date.now();

    // Clear previous errors before new submission
    loginForm.clearErrors();

    // Use transition for server action to keep UI responsive
    startLoginTransition(async () => {
      try {
        const result: ServerActionResult = await signInAction(formData);
        const duration = Date.now() - startTime;

        // Handle different outcomes from the server action
        if (result && 'mfaRequired' in result && result.mfaRequired) {
          setCurrentForm('mfa');
          loginForm.reset(DEFAULT_LOGIN_VALUES);
          mfaForm.reset(DEFAULT_MFA_VALUES);
          mfaForm.clearErrors();
          toast({
            title: TOAST_TITLE_MFA_REQUIRED,
            description: TOAST_DESCRIPTION_MFA_REQUIRED,
          });
          logAuthEvent('login_mfa_required', LOGIN_LABEL, duration);
        } else if (result && 'success' in result && result.success === true) {
          toast({
            title: TOAST_TITLE_LOGIN_SUCCESS,
            description: TOAST_DESCRIPTION_LOGIN_SUCCESS,
            variant: 'success',
          });
          logAuthEvent('login_success', LOGIN_LABEL, duration);
        } else {
          console.warn('Login failed with result:', result);
          toast({
            title: TOAST_TITLE_AUTH_FAILED,
            description:
              result && 'error' in result
                ? result.error
                : TOAST_DESCRIPTION_LOGIN_FAILED_CREDENTIALS,
            variant: 'destructive',
          });
          logAuthEvent('login_failure', LOGIN_LABEL, duration);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error('Login action failed due to exception:', error);
        toast({
          title: TOAST_TITLE_AUTH_FAILED,
          description: TOAST_DESCRIPTION_LOGIN_FAILED_CREDENTIALS,
          variant: 'destructive',
        });
        logAuthEvent('login_failure', LOGIN_LABEL, duration);
      }
    });
  });

  /**
   * Handles submission for the MFA verification form.
   * Uses react-hook-form's handleSubmit for validation.
   * Wraps the server action call in startMfaTransition to manage pending state.
   * Includes error handling and analytics tracking.
   */
  const handleMfaSubmit = mfaForm.handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append('mfaCode', values.mfaCode);
    const startTime = Date.now();

    mfaForm.clearErrors();

    startMfaTransition(async () => {
      try {
        const result: ServerActionResult = await mfaVerifyAction(formData);
        const duration = Date.now() - startTime;

        if (result && 'success' in result && result.success === true) {
          toast({
            title: TOAST_TITLE_MFA_VERIFIED,
            description: TOAST_DESCRIPTION_MFA_VERIFIED,
            variant: 'success',
          });
          mfaForm.reset(DEFAULT_MFA_VALUES);
          setCurrentForm('login');
          logAuthEvent('mfa_verify_success', MFA_VERIFY_LABEL, duration);
        } else {
          console.warn('MFA verification failed with result:', result);
          mfaForm.setError('mfaCode', {
            type: 'manual',
            message:
              result && 'error' in result
                ? result.error
                : FIELD_ERROR_INVALID_MFA,
          });
          toast({
            title: TOAST_TITLE_MFA_FAILED,
            description: TOAST_DESCRIPTION_MFA_FAILED,
            variant: 'destructive',
          });
          logAuthEvent('mfa_verify_failure', MFA_VERIFY_LABEL, duration);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error('MFA verification failed due to exception:', error);
        mfaForm.setError('mfaCode', {
          type: 'manual',
          message: FIELD_ERROR_INVALID_MFA,
        });
        toast({
          title: TOAST_TITLE_MFA_FAILED,
          description: TOAST_DESCRIPTION_MFA_FAILED,
          variant: 'destructive',
        });
        logAuthEvent('mfa_verify_failure', MFA_VERIFY_LABEL, duration);
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
    async (values) => {
      const formData = new FormData();
      formData.append('email', values.email);
      const startTime = Date.now();

      forgotPasswordForm.clearErrors();

      startForgotTransition(async () => {
        try {
          const result: ServerActionResult =
            await forgotPasswordAction(formData);

          if (result && 'success' in result && result.success === true) {
            toast({
              title: TOAST_TITLE_PASSWORD_RESET_INITIATED,
              description: TOAST_DESCRIPTION_PASSWORD_RESET_SENT,
              variant: 'success',
            });
            forgotPasswordForm.reset(DEFAULT_FORGOT_PASSWORD_VALUES);
            setCurrentForm('forgotPasswordConfirmation');
            logAuthEvent(
              'forgot_password_request_success',
              FORGOT_PASSWORD_LABEL,
              Date.now() - startTime,
            );
          } else {
            console.warn('Forgot password request failed with result:', result);
            forgotPasswordForm.setError('email', {
              type: 'manual',
              message:
                result && 'error' in result
                  ? result.error
                  : FIELD_ERROR_PASSWORD_RESET_FAILED,
            });
            toast({
              title: TOAST_TITLE_PASSWORD_RESET_FAILED,
              description: TOAST_DESCRIPTION_PASSWORD_RESET_FAILED,
              variant: 'destructive',
            });
            logAuthEvent(
              'forgot_password_request_failure',
              FORGOT_PASSWORD_LABEL,
              Date.now() - startTime,
            );
          }
        } catch (error) {
          console.error(
            'Forgot password action failed due to exception:',
            error,
          );
          forgotPasswordForm.setError('email', {
            type: 'manual',
            message: FIELD_ERROR_PASSWORD_RESET_FAILED,
          });
          toast({
            title: TOAST_TITLE_PASSWORD_RESET_FAILED,
            description: TOAST_DESCRIPTION_PASSWORD_RESET_FAILED,
            variant: 'destructive',
          });
          logAuthEvent(
            'forgot_password_request_failure',
            FORGOT_PASSWORD_LABEL,
            Date.now() - startTime,
          );
        }
      });
    },
  );

  // --- Render Logic ---
  return (
    <CardContent className="pt-0 sm:pt-2">
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* GitHub Sign-in Button */}
        <Button
          variant="outline"
          className="w-full border-muted-foreground/40 hover:border-muted-foreground"
          onClick={handleGitHubSignIn}
          disabled={isAnyActionPending}
          aria-disabled={isAnyActionPending}
        >
          {isGitHubLoading ? (
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-label="Loading..."
            />
          ) : (
            <Github className="mr-2 h-4 w-4 align-middle" aria-hidden="true" />
          )}
          <span className="align-middle">Login with Github</span>
        </Button>

        {/* "OR CONTINUE WITH" separator - Only show on the main login form and Forgot Password Confirmation */}
        {(currentForm === 'login' ||
          currentForm === 'forgotPasswordConfirmation') && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wide font-medium">
                {currentForm === 'login' ? 'OR CONTINUE WITH' : 'OR'}
              </span>
            </div>
          </div>
        )}

        {/* --- Conditional Form Rendering --- */}

        {/* Login Form (Email/Password) */}
        {currentForm === 'login' && (
          <form
            onSubmit={handleLoginSubmit}
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            {/* Email Field */}
            <FormField<LoginFormValues>
              id="email-login"
              name="email"
              label="Email"
              type="email"
              placeholder="m@example.com"
              registerAction={loginForm.register}
              errors={loginForm.formState.errors}
              disabled={isLoginPending}
              autoComplete="email"
              required
            />

            {/* Password Field */}
            <FormField<LoginFormValues>
              id="password-login"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              registerAction={loginForm.register}
              errors={loginForm.formState.errors}
              disabled={isLoginPending}
              autoComplete="current-password"
              showPasswordToggle
              showPassword={showPassword}
              onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
              required
            />

            {/* Additional password-related elements and "Remember Me" */}
            <div className="flex flex-col gap-2">
              {/* Password Strength Indicator - Only show if password field has a value */}
              {loginForm.watch('password') && (
                <PasswordStrengthIndicator
                  password={loginForm.watch('password')}
                />
              )}

              {/* "Remember Me" Checkbox */}
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="rememberMe"
                  {...loginForm.register('rememberMe')}
                  disabled={isLoginPending}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Remember me
                </Label>
              </div>

              {/* Forgot Password link/button */}
              <Button
                type="button"
                variant="link"
                className="w-full justify-center px-0 text-sm sm:text-base font-semibold text-primary hover:text-primary/80"
                onClick={() => {
                  setCurrentForm('forgotPassword');
                  loginForm.reset(DEFAULT_LOGIN_VALUES);
                  loginForm.clearErrors();
                  setShowPassword(false);
                  forgotPasswordForm.reset(DEFAULT_FORGOT_PASSWORD_VALUES);
                  forgotPasswordForm.clearErrors();
                }}
                disabled={isLoginPending}
                aria-disabled={isLoginPending}
              >
                Forgot your password?
              </Button>
            </div>

            {/* Sign In Button */}
            <SubmitButton
              label="Sign In"
              pending={isLoginPending}
              disabled={isLoginPending}
            />

            {/* Sign Up Link - Styled as button but keeps link behavior */}
            <Link
              href="/signup"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground w-full border-muted-foreground/40 hover:border-muted-foreground px-4 py-2 ${isAnyActionPending ? 'pointer-events-none opacity-50' : ''}`}
              aria-disabled={isAnyActionPending}
              tabIndex={isAnyActionPending ? -1 : 0}
            >
              Sign Up
            </Link>
          </form>
        )}

        {/* MFA Verification Form */}
        {currentForm === 'mfa' && (
          <form
            onSubmit={handleMfaSubmit}
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            {/* Assuming FormFieldProps accepts `disabled` and `required` */}
            <FormField<MfaFormValues>
              id="mfaCode"
              name="mfaCode"
              label="MFA Code"
              type="text"
              placeholder="Enter your MFA code"
              registerAction={mfaForm.register}
              errors={mfaForm.formState.errors}
              disabled={isMfaPending}
              autoComplete="one-time-code"
              required
            />
            {/* MFA Verify Button */}
            <SubmitButton
              label="Verify Code"
              pending={isMfaPending}
              disabled={isMfaPending}
            />
            {/* Cancel MFA Button */}
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => {
                navigateBackToLogin();
                mfaForm.reset(DEFAULT_MFA_VALUES);
                mfaForm.clearErrors();
              }}
              disabled={isMfaPending}
              aria-disabled={isMfaPending}
            >
              Cancel
            </Button>
          </form>
        )}

        {/* Forgot Password Form */}
        {currentForm === 'forgotPassword' && (
          <form
            onSubmit={handleForgotPasswordSubmit}
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            <FormField<ForgotPasswordFormValues>
              id="email-forgot"
              name="email"
              label="Email"
              type="email"
              placeholder="m@example.com"
              registerAction={forgotPasswordForm.register}
              errors={forgotPasswordForm.formState.errors}
              disabled={isForgotPending}
              autoComplete="email"
              required
            />
            {/* Send Reset Link Button */}
            <SubmitButton
              label="Send Reset Link"
              pending={isForgotPending}
              disabled={isForgotPending}
            />
            {/* Back to Login Button */}
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => {
                navigateBackToLogin();
                forgotPasswordForm.reset(DEFAULT_FORGOT_PASSWORD_VALUES);
                forgotPasswordForm.clearErrors();
              }}
              disabled={isForgotPending}
              aria-disabled={isForgotPending}
            >
              Back to Login
            </Button>
          </form>
        )}

        {/* Forgot Password Confirmation Message State */}
        {currentForm === 'forgotPasswordConfirmation' && (
          <div className="flex flex-col gap-4 text-foreground text-center">
            <p className="text-lg font-semibold">Check Your Email</p>
            <p className="text-muted-foreground">
              A password reset link has been sent to your email address. Please
              check your inbox (and spam folder) to continue.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                navigateBackToLogin();
              }}
              disabled={isAnyActionPending}
              aria-disabled={isAnyActionPending}
            >
              Back to Login
            </Button>
          </div>
        )}

        {/* Terms and Privacy Links - Always visible */}
        <p className="text-center text-sm text-muted-foreground mt-auto pt-4">
          By continuing, you agree to our{' '}
          <Link
            href={termsOfServiceHref}
            className="underline underline-offset-4 hover:text-primary"
            prefetch={false}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href={privacyPolicyHref}
            className="underline underline-offset-4 hover:text-primary"
            prefetch={false}
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </CardContent>
  );
}

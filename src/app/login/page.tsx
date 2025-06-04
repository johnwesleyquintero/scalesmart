'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import LoginForm from './login-form';
import { signIn, signUp, forgotPassword } from '../auth/actions';
import { DevLogin } from './dev-login';

const PRIVACY_POLICY_HREF = '/privacy-policy';
const TERMS_OF_SERVICE_HREF = '/terms-of-service';

const SEARCH_PARAM_ERROR_KEY = 'error';
const SEARCH_PARAM_MESSAGE_KEY = 'message';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get(SEARCH_PARAM_ERROR_KEY);
  const infoMessage = searchParams.get(SEARCH_PARAM_MESSAGE_KEY);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <Card className="w-full max-w-md rounded-lg shadow-lg overflow-hidden">
        <CardHeader className="text-center py-8 px-6">
          <div className="mb-4 flex flex-col items-center space-y-3">
            <Logo className="h-16 w-16 text-primary mb-2" />
            <CardTitle className="text-3xl font-bold tracking-tight">
              Login to Your Account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground px-4 leading-relaxed">
              Begin by entering your email to log in or create a new account.
            </CardDescription>
          </div>

          {(errorMessage || infoMessage) && (
            <div
              className="my-4 space-y-2 px-4 sm:px-0"
              role="status"
              aria-live="polite"
            >
              {errorMessage && (
                <p className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30">
                  {errorMessage}
                </p>
              )}
              {infoMessage && (
                <p className="rounded-md bg-muted/50 p-3 text-sm text-foreground border">
                  {infoMessage}
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <LoginForm
          signInAction={signIn}
          signUpAction={signUp}
          forgotPasswordAction={forgotPassword}
          privacyPolicyHref={PRIVACY_POLICY_HREF}
          termsOfServiceHref={TERMS_OF_SERVICE_HREF}
        />
      </Card>
      {process.env.NODE_ENV === 'development' && <DevLogin />}
    </main>
  );
}

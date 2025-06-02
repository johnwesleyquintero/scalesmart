'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Loader2 } from 'lucide-react';
import { signIn as NextAuthSignIn } from 'next-auth/react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const PRIVACY_POLICY_PATH = '/privacy-policy';
const TERMS_OF_SERVICE_PATH = '/terms-of-service';

interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<void>;
  signUpAction: (formData: FormData) => Promise<void>;
}

function AuthFormButtons({
  signInAction,
  signUpAction,
}: Pick<LoginFormProps, 'signInAction' | 'signUpAction'>) {
  const { pending } = useFormStatus();

  return (
    <>
      <Button
        type="submit"
        formAction={signInAction}
        disabled={pending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" // Explicit primary styling similar to image
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign In
      </Button>
      <Button
        type="submit"
        variant="outline"
        formAction={signUpAction}
        disabled={pending}
        className="w-full"
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign Up
      </Button>
    </>
  );
}

export default function LoginForm({
  signInAction,
  signUpAction,
}: LoginFormProps) {
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    try {
      await NextAuthSignIn('github');
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      setIsGitHubLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // TODO: Implement forgot password functionality
  };

  return (
    <CardContent className="pt-0 sm:pt-2">
      {' '}
      {/* Adjusted top padding if CardHeader has bottom margin */}
      <div className="flex flex-col gap-5 sm:gap-6">
        {' '}
        {/* Consistent gap */}
        <Button
          variant="outline"
          className="w-full border-muted-foreground/40 hover:border-muted-foreground"
          onClick={handleGitHubSignIn}
          disabled={isGitHubLoading}
        >
          {isGitHubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4 align-middle" />
          )}
          <span className="align-middle">Login with Github</span>
        </Button>
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
        <form className="flex flex-col gap-4 text-foreground">
          {/* Email Field */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="m@example.com"
              required
              className="h-10"
            />
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="mt-2 h-10"
            />
            <Button
              variant="link"
              type="button"
              className="w-full justify-center px-0 mt-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </Button>
          </div>

          <AuthFormButtons
            signInAction={signInAction}
            signUpAction={signUpAction}
          />
        </form>
        <p className="px-0 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <Link
            href={PRIVACY_POLICY_PATH}
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          {' and '}
          <Link
            href={TERMS_OF_SERVICE_PATH}
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </CardContent>
  );
}

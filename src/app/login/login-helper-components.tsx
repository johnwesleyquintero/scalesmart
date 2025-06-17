import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { SubmitButtonProps } from './login-types'; // Import type from new types file

// Generic Submit Button Component
export function SubmitButton({
  label,
  variant = 'primary',
  pending,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit" // This button triggers the form's onSubmit handler
      disabled={pending} // Disable button while the action is pending
      className="w-full"
      variant={variant}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

// Password Strength Indicator Component
export function PasswordStrengthIndicator({ password }: { password: string }) {
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

---
title: Supabase RLS Policies Documentation
description: Documentation for Supabase Row Level Security (RLS) policies.
date: 2025-05-30
tags: ['supabase', 'rls', 'security']
readingTime: '7 min read'
author: 'Wesley Quintero'
type: 'doc'
---

## Row Level Security and Policies Setup

**Key Changes Made:**

- Function Definition First: The public.validate_verification_token function is now defined before any policies that reference it, ensuring that it exists when the policies are created.

```sql
-- Enable Row Level Security for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Updated validate_verification_token Function
CREATE OR REPLACE FUNCTION public.validate_verification_token(token TEXT, identifier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.verification_tokens
    WHERE public.verification_tokens.token = token
      AND public.verification_tokens.identifier = identifier
      AND public.verification_tokens.expires > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Table Policies
CREATE POLICY "Users can select their own user data." ON public.users
AS PERMISSIVE FOR SELECT
TO public
USING (id = auth.uid());

CREATE POLICY "Users can update their own user data." ON public.users
AS PERMISSIVE FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (updated_at IS NOT NULL);  -- Restrict updates to only the updated_at field

DROP POLICY IF EXISTS "Users can delete their own user data." ON public.users;

-- Accounts Table Policies
CREATE POLICY "Users can select accounts associated with their user ID." ON public.accounts
AS PERMISSIVE FOR SELECT
TO public
USING (user_id = auth.uid());

CREATE POLICY "Users can insert accounts associated with their user ID." ON public.accounts
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update accounts associated with their user ID." ON public.accounts
AS PERMISSIVE FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (
    (oauth_token IS NULL OR oauth_token IS NOT NULL) AND
    (oauth_scopes IS NULL OR oauth_scopes IS NOT NULL)
);  -- Ensure only oauth_token and oauth_scopes can be updated

CREATE POLICY "Users can delete accounts associated with their user ID." ON public.accounts
AS PERMISSIVE FOR DELETE
TO public
USING (user_id = auth.uid());

-- Sessions Table Policies
CREATE POLICY "Users can select sessions associated with their user ID." ON public.sessions
AS PERMISSIVE FOR SELECT
TO public
USING (user_id = auth.uid());

CREATE POLICY "Users can insert sessions associated with their user ID." ON public.sessions
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- If updates are needed, implement a similar policy as accounts
CREATE POLICY "Users can update sessions associated with their user ID." ON public.sessions
AS PERMISSIVE FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (TRUE);  -- Adjust as necessary to restrict specific fields

CREATE POLICY "Users can delete sessions associated with their user ID." ON public.sessions
AS PERMISSIVE FOR DELETE
TO public
USING (user_id = auth.uid());

-- Verification Tokens Table Policies
CREATE POLICY "Allow inserts for anyone." ON public.verification_tokens
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);  -- Consider restricting this policy

CREATE POLICY "Allow selects only for valid tokens." ON public.verification_tokens
AS PERMISSIVE FOR SELECT
TO public
USING (public.validate_verification_token(token, identifier));

-- Trigger function for users table
CREATE OR REPLACE FUNCTION public.check_user_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id <> OLD.id OR NEW.email <> OLD.email OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Cannot update id, email, or created_at fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for users table
CREATE TRIGGER check_user_update_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.check_user_update();

-- Trigger function for accounts table
CREATE OR REPLACE FUNCTION public.check_account_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id <> OLD.id OR NEW.user_id <> OLD.user_id OR NEW.provider_type <> OLD.provider_type OR NEW.provider_id <> OLD.provider_id OR NEW.provider_account_id <> OLD.provider_account_id OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Cannot update id, user_id, provider_type, provider_id, provider_account_id, or created_at fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for accounts table
CREATE TRIGGER check_account_update_trigger
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.check_account_update();
```

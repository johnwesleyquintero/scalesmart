-- Add index to sessions.userId
CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions (userId);

-- Add index to accounts.provider_id
CREATE INDEX IF NOT EXISTS accounts_provider_id_idx ON accounts (provider_id);

-- Add index to accounts.provider_account_id
CREATE INDEX IF NOT EXISTS accounts_provider_account_id_idx ON accounts (provider_account_id);

-- Add index to users.email
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

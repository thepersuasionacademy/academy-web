-- Create access_status enum type if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'access')) THEN
        CREATE TYPE access.access_status AS ENUM ('granted', 'revoked');
    END IF;
END $$;

-- Add status column to user_access table if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'access'
        AND table_name = 'user_access'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE access.user_access 
        ADD COLUMN status access.access_status NOT NULL DEFAULT 'granted';
    END IF;
END $$;

-- Update existing records to have 'granted' status
UPDATE access.user_access
SET status = 'granted'
WHERE status IS NULL; 
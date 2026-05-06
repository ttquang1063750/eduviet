-- Create shadow database for Prisma migrations
CREATE DATABASE eduviet_shadow;
GRANT ALL PRIVILEGES ON DATABASE eduviet_shadow TO eduviet;

-- Enable pgcrypto for UUID generation
\c eduviet_dev;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

\c eduviet_shadow;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

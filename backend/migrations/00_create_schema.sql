-- Create custom schema for financial reporting system
-- Run this FIRST before running other migrations

-- Create schema
CREATE SCHEMA IF NOT EXISTS "financial-reporting-db";

-- Set search path (this will be used for all subsequent commands in this session)
SET search_path TO "financial-reporting-db", public;

-- Verify schema created
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'financial-reporting-db';

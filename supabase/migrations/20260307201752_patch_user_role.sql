-- Migration to add ORGANIZER to the existing user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'ORGANIZER';

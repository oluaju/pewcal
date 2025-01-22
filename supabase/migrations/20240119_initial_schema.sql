-- Enable the UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create user profiles table
create table if not exists user_profiles (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  name text,
  picture text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create calendars table
create table if not exists calendars (
  id uuid default uuid_generate_v4() primary key,
  google_calendar_id text not null,
  name text not null,
  owner_id uuid references user_profiles(id) not null,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create calendar shares table
create table if not exists calendar_shares (
  id uuid default uuid_generate_v4() primary key,
  calendar_id uuid references calendars(id) not null,
  user_id uuid references user_profiles(id) not null,
  role text check (role in ('editor', 'viewer')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Add unique constraint to prevent duplicate shares
  unique(calendar_id, user_id)
);

-- Create indexes for better query performance
create index if not exists idx_user_profiles_email on user_profiles(email);
create index if not exists idx_calendars_owner on calendars(owner_id);
create index if not exists idx_calendar_shares_calendar on calendar_shares(calendar_id);
create index if not exists idx_calendar_shares_user on calendar_shares(user_id);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update updated_at
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row
  execute function update_updated_at_column();

create trigger update_calendars_updated_at
  before update on calendars
  for each row
  execute function update_updated_at_column();

create trigger update_calendar_shares_updated_at
  before update on calendar_shares
  for each row
  execute function update_updated_at_column(); 
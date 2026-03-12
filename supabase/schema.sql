create table if not exists config_store (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null
);

create table if not exists menus (
  id text primary key,
  name text not null,
  location text not null,
  items_json jsonb not null,
  specials_json jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists reward_programs (
  id text primary key,
  name text not null,
  points_per_dollar numeric not null,
  tiers_json jsonb not null,
  redemptions_json jsonb not null,
  point_generators_json jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists members (
  id text primary key,
  username text not null,
  email text not null,
  name text not null,
  status text not null,
  phone text,
  loyalty_points numeric not null,
  tier text not null,
  join_date text not null,
  last_visit text,
  favorite_location text,
  address text,
  date_of_birth text,
  notes text,
  tags_json jsonb not null,
  marketing_opt_in boolean,
  total_spend numeric,
  visits numeric,
  avatar text,
  password_hash text,
  password_updated_at timestamptz,
  companion_access_code text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (username),
  unique (email)
);

create table if not exists branding_configs (
  id text primary key,
  brand_name text not null,
  primary_color text not null,
  secondary_color text not null,
  accent_color text not null,
  logo text,
  favicon text,
  custom_domain text,
  font_family text not null
);

create table if not exists users (
  id text primary key,
  username text not null,
  email text not null,
  name text not null,
  role text not null,
  status text not null,
  phone text,
  title text,
  department text,
  notes text,
  avatar text,
  password_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz,
  unique (username),
  unique (email)
);

create table if not exists auth_sessions (
  token_hash text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

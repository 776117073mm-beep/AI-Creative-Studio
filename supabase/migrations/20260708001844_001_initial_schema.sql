/*
# AI Creative Studio - Initial Database Schema

1. Purpose
This migration creates the foundational schema for a multi-user AI Creative Studio platform
supporting video editing, design, motion graphics, audio production, and collaborative creative workflows.

2. New Tables

## profiles
- `id` (uuid, PK, references auth.users) - User profile linked to Supabase auth
- `email` (text) - Cached email for quick access
- `full_name` (text) - User's display name
- `avatar_url` (text) - Profile picture URL
- `preferences` (jsonb) - User preferences (theme, shortcuts, defaults)
- `created_at` (timestamptz) - Account creation timestamp
- `updated_at` (timestamptz) - Last profile update

## projects
- `id` (uuid, PK) - Unique project identifier
- `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid()) - Project owner
- `name` (text, NOT NULL) - Project name
- `description` (text) - Project description
- `type` (text, NOT NULL) - Project type: 'video', 'design', 'motion', 'audio', 'presentation', 'image', 'brand', '3d', 'animation'
- `settings` (jsonb) - Project settings (resolution, frame rate, etc.)
- `metadata` (jsonb) - Additional metadata (tags, version, template info)
- `graph_data` (jsonb) - Project graph serialization (nodes, connections)
- `scenes` (jsonb) - Scene definitions
- `timeline_data` (jsonb) - Timeline state serialization
- `status` (text) - Project status: 'draft', 'in_progress', 'completed', 'archived'
- `is_template` (boolean) - Whether this is a template
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last modification timestamp

## assets
- `id` (uuid, PK) - Unique asset identifier
- `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid()) - Asset owner
- `project_id` (uuid, FK to projects, nullable) - Associated project (null = library asset)
- `name` (text, NOT NULL) - Asset filename
- `type` (text, NOT NULL) - Media type: 'image', 'video', 'audio', 'font', 'document', 'template', 'brush', 'preset'
- `mime_type` (text) - MIME type
- `size` (bigint) - File size in bytes
- `storage_path` (text) - Path in Supabase storage
- `thumbnail_path` (text) - Thumbnail storage path
- `width` (integer) - Width (for images/videos)
- `height` (integer) - Height (for images/videos)
- `duration` (real) - Duration in seconds (for audio/video)
- `fps` (real) - Frames per second (for video)
- `sample_rate` (integer) - Sample rate (for audio)
- `metadata` (jsonb) - Additional technical metadata
- `processed` (boolean) - Whether processing is complete
- `created_at` (timestamptz) - Upload timestamp
- `updated_at` (timestamptz) - Last modification

## asset_folders
- `id` (uuid, PK) - Unique folder identifier
- `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid()) - Folder owner
- `parent_id` (uuid, FK to asset_folders, nullable) - Parent folder (null = root)
- `name` (text, NOT NULL) - Folder name
- `created_at` (timestamptz) - Creation timestamp

## ai_commands
- `id` (uuid, PK) - Unique command identifier
- `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid()) - Command issuer
- `project_id` (uuid, FK to projects, nullable) - Associated project
- `query` (text, NOT NULL) - Original user query
- `interpretation` (jsonb) - AI interpretation result
- `status` (text) - Command status: 'pending', 'processing', 'completed', 'failed'
- `result` (jsonb) - Execution result
- `error` (text) - Error message if failed
- `created_at` (timestamptz) - Command timestamp
- `completed_at` (timestamptz) - Completion timestamp

## project_collaborators
- `id` (uuid, PK) - Unique collaboration record
- `project_id` (uuid, FK to projects, NOT NULL) - Shared project
- `user_id` (uuid, FK to auth.users, NOT NULL) - Collaborator
- `role` (text, NOT NULL) - Role: 'viewer', 'editor', 'admin'
- `invited_by` (uuid, FK to auth.users) - User who invited
- `accepted` (boolean) - Whether invitation accepted
- `created_at` (timestamptz) - Invitation timestamp
- UNIQUE constraint on (project_id, user_id)

## exports
- `id` (uuid, PK) - Unique export identifier
- `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid()) - Export initiator
- `project_id` (uuid, FK to projects, NOT NULL) - Exported project
- `format` (text, NOT NULL) - Export format: 'mp4', 'webm', 'gif', 'png', 'jpg', etc.
- `settings` (jsonb) - Export settings (codec, quality, resolution)
- `status` (text) - Export status: 'pending', 'processing', 'completed', 'failed'
- `progress` (real) - Progress percentage (0-100)
- `storage_path` (text) - Output file path
- `file_size` (bigint) - Output file size
- `error` (text) - Error message if failed
- `created_at` (timestamptz) - Export start time
- `completed_at` (timestamptz) - Export completion time

## plugins
- `id` (uuid, PK) - Unique plugin identifier
- `user_id` (uuid, FK to auth.users, nullable) - Plugin owner (null = system plugin)
- `manifest` (jsonb, NOT NULL) - Plugin manifest (id, name, version, permissions)
- `settings` (jsonb) - User-specific plugin settings
- `enabled` (boolean) - Whether plugin is active
- `installed_at` (timestamptz) - Installation timestamp

## user_settings
- `id` (uuid, PK) - Unique settings identifier
- `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid()) - Settings owner
- `theme` (text) - UI theme: 'light', 'dark', 'system'
- `language` (text) - Interface language
- `keyboard_shortcuts` (jsonb) - Custom keyboard shortcuts
- `auto_save` (boolean, default true) - Auto-save preference
- `auto_save_interval` (integer) - Auto-save interval in seconds
- `default_resolution` (jsonb) - Default project resolution
- `default_frame_rate` (real) - Default frame rate
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

3. Security (RLS)
- Enable RLS on ALL tables.
- Owner-scoped policies for user-owned resources (projects, assets, commands, exports).
- Collaboration-aware policies for shared projects.
- All tables use `auth.uid()` for ownership verification.
- Default `user_id` columns to `auth.uid()` for seamless inserts.

4. Indexes
- `projects_user_id_idx` - Filter projects by owner
- `projects_type_idx` - Filter projects by type
- `projects_status_idx` - Filter projects by status
- `assets_user_id_idx` - Filter assets by owner
- `assets_project_id_idx` - Filter assets by project
- `assets_type_idx` - Filter assets by type
- `ai_commands_user_id_idx` - Filter commands by user
- `ai_commands_project_id_idx` - Filter commands by project
- `exports_project_id_idx` - Filter exports by project
- `exports_status_idx` - Filter exports by status

5. Notes
## User Ownership Default
All user-owned tables have `user_id uuid NOT NULL DEFAULT auth.uid()` ensuring inserts
work correctly when the frontend omits the user_id field.

## Collaboration Model
Users can share projects with others through project_collaborators table.
The RLS policies check both direct ownership AND collaboration membership.

## Soft Deletes
Projects use a 'status' field including 'archived' for soft deletion capability.

## JSONB Flexibility
Complex nested data (settings, graph_data, scenes) stored as JSONB for flexibility
while maintaining query capability with PostgreSQL JSON operators.
*/

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('video', 'design', 'motion', 'audio', 'presentation', 'image', 'brand', '3d', 'animation')),
  settings jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  graph_data jsonb,
  scenes jsonb DEFAULT '[]'::jsonb,
  timeline_data jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects: Direct owner access
DROP POLICY IF EXISTS "projects_select_own" ON projects;
CREATE POLICY "projects_select_own" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_insert_own" ON projects;
CREATE POLICY "projects_insert_own" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_update_own" ON projects;
CREATE POLICY "projects_update_own" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_delete_own" ON projects;
CREATE POLICY "projects_delete_own" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video', 'audio', 'font', 'document', 'project', 'template', 'brush', 'preset')),
  mime_type text,
  size bigint,
  storage_path text,
  thumbnail_path text,
  width integer,
  height integer,
  duration real,
  fps real,
  sample_rate integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_select_own" ON assets;
CREATE POLICY "assets_select_own" ON assets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "assets_insert_own" ON assets;
CREATE POLICY "assets_insert_own" ON assets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assets_update_own" ON assets;
CREATE POLICY "assets_update_own" ON assets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assets_delete_own" ON assets;
CREATE POLICY "assets_delete_own" ON assets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Asset folders table
CREATE TABLE IF NOT EXISTS asset_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES asset_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asset_folders_select_own" ON asset_folders;
CREATE POLICY "asset_folders_select_own" ON asset_folders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "asset_folders_insert_own" ON asset_folders;
CREATE POLICY "asset_folders_insert_own" ON asset_folders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "asset_folders_update_own" ON asset_folders;
CREATE POLICY "asset_folders_update_own" ON asset_folders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "asset_folders_delete_own" ON asset_folders;
CREATE POLICY "asset_folders_delete_own" ON asset_folders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI commands table
CREATE TABLE IF NOT EXISTS ai_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  query text NOT NULL,
  interpretation jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE ai_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_commands_select_own" ON ai_commands;
CREATE POLICY "ai_commands_select_own" ON ai_commands FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_commands_insert_own" ON ai_commands;
CREATE POLICY "ai_commands_insert_own" ON ai_commands FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_commands_update_own" ON ai_commands;
CREATE POLICY "ai_commands_update_own" ON ai_commands FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Project collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collaborators_select_own" ON project_collaborators;
CREATE POLICY "collaborators_select_own" ON project_collaborators FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_collaborators.project_id AND projects.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "collaborators_insert_owner" ON project_collaborators;
CREATE POLICY "collaborators_insert_owner" ON project_collaborators FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_collaborators.project_id AND projects.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "collaborators_update_own" ON project_collaborators;
CREATE POLICY "collaborators_update_own" ON project_collaborators FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "collaborators_delete_owner" ON project_collaborators;
CREATE POLICY "collaborators_delete_owner" ON project_collaborators FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_collaborators.project_id AND projects.user_id = auth.uid()
  ));

-- Exports table
CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format text NOT NULL CHECK (format IN ('mp4', 'webm', 'gif', 'png', 'jpg', 'webp', 'pdf', 'svg', 'mp3', 'wav', 'ogg', 'json')),
  settings jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress real DEFAULT 0,
  storage_path text,
  file_size bigint,
  error text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exports_select_own" ON exports;
CREATE POLICY "exports_select_own" ON exports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exports_insert_own" ON exports;
CREATE POLICY "exports_insert_own" ON exports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exports_update_own" ON exports;
CREATE POLICY "exports_update_own" ON exports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exports_delete_own" ON exports;
CREATE POLICY "exports_delete_own" ON exports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Plugins table
CREATE TABLE IF NOT EXISTS plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  manifest jsonb NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  enabled boolean DEFAULT true,
  installed_at timestamptz DEFAULT now()
);

ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plugins_select_own" ON plugins;
CREATE POLICY "plugins_select_own" ON plugins FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "plugins_insert_own" ON plugins;
CREATE POLICY "plugins_insert_own" ON plugins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "plugins_update_own" ON plugins;
CREATE POLICY "plugins_update_own" ON plugins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "plugins_delete_own" ON plugins;
CREATE POLICY "plugins_delete_own" ON plugins FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'en',
  keyboard_shortcuts jsonb DEFAULT '{}'::jsonb,
  auto_save boolean DEFAULT true,
  auto_save_interval integer DEFAULT 30,
  default_resolution jsonb DEFAULT '{"width": 1920, "height": 1080}'::jsonb,
  default_frame_rate real DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert_own" ON user_settings;
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_own" ON user_settings;
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_type_idx ON projects(type);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS assets_user_id_idx ON assets(user_id);
CREATE INDEX IF NOT EXISTS assets_project_id_idx ON assets(project_id);
CREATE INDEX IF NOT EXISTS assets_type_idx ON assets(type);
CREATE INDEX IF NOT EXISTS assets_created_at_idx ON assets(created_at DESC);

CREATE INDEX IF NOT EXISTS ai_commands_user_id_idx ON ai_commands(user_id);
CREATE INDEX IF NOT EXISTS ai_commands_project_id_idx ON ai_commands(project_id);
CREATE INDEX IF NOT EXISTS ai_commands_status_idx ON ai_commands(status);

CREATE INDEX IF NOT EXISTS exports_project_id_idx ON exports(project_id);
CREATE INDEX IF NOT EXISTS exports_status_idx ON exports(status);

CREATE INDEX IF NOT EXISTS project_collaborators_project_id_idx ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS project_collaborators_user_id_idx ON project_collaborators(user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
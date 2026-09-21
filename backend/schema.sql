-- Core Users table (Foundation for all pillars)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'member', -- member, admin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles (Knowledge Gap pillar - understanding what people need)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(100),
  year_level VARCHAR(50), -- 100l, 200l, 300l, 400l, graduate
  skills TEXT[], -- Array of skills
  what_building TEXT, -- What venture are they building
  looking_for TEXT, -- What help they're looking for
  bio TEXT,
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events (Knowledge Gap + Events pillar - Sessions, workshops)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50), -- session, workshop, meetup, pitch_day
  pillar VARCHAR(100), -- knowledge_gap, co_builders, events, grants, alumni
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  is_online BOOLEAN DEFAULT false,
  meeting_link VARCHAR(500),
  capacity INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event RSVPs (Events pillar - tracking attendance)
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'registered', -- registered, attended, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Resources (Knowledge Gap pillar - Session recordings, slides, guides)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50), -- recording, slide, guide, article, template
  pillar VARCHAR(100), -- which pillar it belongs to
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Optional link to event
  file_url VARCHAR(500),
  category VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Co-Builder Requests (Co-Builders/eHub pillar - Matching & collaboration)
CREATE TABLE co_builder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50), -- seeking_help, offering_help, collaboration
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Tracker (Knowledge Gap pillar - Track learning path)
CREATE TABLE progress_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- business_fundamentals, technical, market_research, etc
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_item_id UUID NOT NULL REFERENCES progress_items(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, progress_item_id)
);

-- Grant Opportunities (Grants pillar - v1 is info only)
CREATE TABLE grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount_range VARCHAR(100),
  deadline DATE,
  external_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alumni Network (Alumni pillar - v1 is basic directory)
CREATE TABLE alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  graduation_year INTEGER,
  current_company VARCHAR(255),
  role_title VARCHAR(255),
  venture_outcome VARCHAR(255), -- Still building, Acquired, Closed, Pivoted, etc
  willing_to_mentor BOOLEAN DEFAULT false,
  contact_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin logs (For admin dashboard)
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications (recruitment pipeline - prospective members applying to join)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,

  who_are_you TEXT NOT NULL,
  what_building TEXT NOT NULL,
  startup_pull TEXT,
  persistent_problem TEXT NOT NULL,
  what_is_venture_built TEXT NOT NULL,
  cv_url VARCHAR(500) NOT NULL,
  pitch_deck_url VARCHAR(500),

  club_skills TEXT[],
  club_skills_other TEXT,
  builder_skills TEXT[],
  builder_skills_other TEXT,
  role_fit VARCHAR(50),
  role_fit_other TEXT,
  role_fit_reason TEXT NOT NULL,

  meeting_days TEXT[],
  meeting_time VARCHAR(100),
  can_commit_hours BOOLEAN,
  comfortable_pitching BOOLEAN,

  stage VARCHAR(50) DEFAULT 'applied', -- applied, interview, accepted, rejected
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner Inquiries (mentors, funders, and organizations wanting to get involved)
CREATE TABLE partner_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255) NOT NULL,

  help_types TEXT[] NOT NULL,
  help_types_other TEXT,

  agreed_to_communications BOOLEAN NOT NULL DEFAULT false,
  agreed_to_data_storage BOOLEAN NOT NULL DEFAULT false,

  status VARCHAR(50) DEFAULT 'new', -- new, contacted, partnered, declined
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Applications (leadership roles: Head of Programs/Talent/Growth/Finance)
CREATE TABLE team_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,

  role VARCHAR(50) NOT NULL, -- Head of Programs, Head of Talent, Head of Growth, Head of Finance/Operations
  led_before TEXT NOT NULL,
  why_role TEXT NOT NULL,
  first_month_plan TEXT NOT NULL,
  additional_info TEXT,
  cv_url VARCHAR(500) NOT NULL,

  stage VARCHAR(50) DEFAULT 'applied', -- applied, interview, accepted, rejected
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_pillar ON events(pillar);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_co_builder_requests_status ON co_builder_requests(status);
CREATE INDEX idx_co_builder_requests_receiver ON co_builder_requests(receiver_id);
CREATE INDEX idx_resources_pillar ON resources(pillar);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_applications_stage ON applications(stage);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_partner_inquiries_status ON partner_inquiries(status);
CREATE INDEX idx_partner_inquiries_email ON partner_inquiries(email);
CREATE INDEX idx_team_applications_stage ON team_applications(stage);
CREATE INDEX idx_team_applications_email ON team_applications(email);

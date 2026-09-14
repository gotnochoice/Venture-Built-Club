# Venture Built Club - Backend API

Node.js/Express API for the Venture Built Club student portal and admin application.

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your database URL:
```
DATABASE_URL=postgresql://user:password@localhost:5432/venture_built_club
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

4. Create database and run schema:
```bash
psql -U user -d postgres -c "CREATE DATABASE venture_built_club;"
psql -U user -d venture_built_club -f schema.sql
```

5. Start the server:
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Profiles (Knowledge Gap Pillar)
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/update` - Update own profile (requires auth)

### Directory (Knowledge Gap + Co-Builders)
- `GET /api/directory/search?query=name&department=dept` - Search members
- `GET /api/directory/:userId` - Get member profile

### Events (Events Pillar)
- `GET /api/events?status=upcoming` - List events
- `GET /api/events/:eventId` - Get event details
- `POST /api/events` - Create event (admin only)
- `POST /api/events/:eventId/rsvp` - RSVP to event (auth required)
- `GET /api/events/:eventId/attendees` - Get event attendees

### Resources (Knowledge Gap Pillar)
- `GET /api/resources?pillar=knowledge_gap` - List resources
- `GET /api/resources/:resourceId` - Get resource
- `POST /api/resources` - Upload resource (admin only)

### Co-Builders (Co-Builders/eHub Pillar)
- `POST /api/co-builders/request` - Send co-builder request (auth required)
- `GET /api/co-builders/my-requests` - Get incoming requests (auth required)
- `GET /api/co-builders/sent-requests` - Get sent requests (auth required)
- `PATCH /api/co-builders/request/:requestId` - Accept/reject request

### Admin
- `GET /api/admin/dashboard` - Dashboard stats (admin only)
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/events` - List all events with stats (admin only)
- `POST /api/admin/progress-items` - Create curriculum item (admin only)
- `GET /api/admin/progress-items` - Get curriculum items (admin only)
- `POST /api/admin/log` - Log admin action (admin only)

## Database Schema

### Tables (mapped to 5 pillars)
- `users` - Core user accounts
- `profiles` - User profiles with skills, dept, etc
- `events` - Sessions, workshops, meetings
- `event_rsvps` - Event attendance tracking
- `resources` - Recordings, slides, guides (Knowledge Gap)
- `co_builder_requests` - Collaboration requests (Co-Builders)
- `progress_items` - Curriculum checklist items
- `user_progress` - Track progress completion
- `grants` - Grant opportunities (v2 feature)
- `alumni_profiles` - Alumni network (v2 feature)
- `admin_logs` - Admin action audit trail

## V1 Features
✅ Authentication & login
✅ User profiles & directory
✅ Event calendar with RSVP
✅ Resource library
✅ Co-builder matching requests
✅ Admin dashboard
✅ Progress tracking (curriculum)

## V2 Features (Coming Soon)
- Grants application tracking
- Advanced co-builder matching algorithm
- Alumni network features
- Notifications
- File upload integration

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

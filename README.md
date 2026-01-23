# VillageVeggies (MVP)

## Project Overview

VillageVeggies is a simple MVP web platform that connects **small-scale gardeners** with **local food enthusiasts** along Colorado’s **Front Range**. The primary goal is to validate local supply and demand for backyard-grown food using the smallest practical feature set, while maintaining a clean, production-ready architecture.

The MVP intentionally avoids payments, on-platform messaging, and image uploads. All transactions and coordination occur **off-platform** once a grower’s contact details are revealed.

---

## Core Features (MVP)

* User authentication (register, login, logout)
* Authenticated users can browse local produce listings
* Any authenticated user can create listings (no role separation)
* Listings are restricted to the **Front Range** using a ZIP code allowlist
* Grower contact information is **click-to-reveal** to reduce scraping and abuse
* User dashboard displaying profile information and owned listings
* Text-only listings (no images in MVP)

---

## Tech Stack

### Backend

* Node.js
* Express.js
* PostgreSQL
* Cookie-based session authentication

### Frontend

* HTML, CSS, and JavaScript
* Static assets served directly from Express (`/public`)

---

## Architecture Overview

### Project Structure

```
NewVersion/
│
├── backend/
│   ├── server.js        # Main Express server
│   ├── setup_db.js      # Database initialization script
│   ├── package.json     # Backend dependencies
│   └── node_modules/    # Installed packages (gitignored)
│
├── css/
│   └── styles.css       # Global styles
│
├── js/
│   ├── auth.js          # Login and registration logic
│   ├── profile.js       # Profile functionality
│   ├── browse.js        # Browse local crops logic
│   ├── new-crop.js      # New crop logic
│   ├── view-crop.js     # Crops detail logic
│   ├── legal.js         # Legal modal logic
│   └── admin.js         # Admin dashboard logic
│
├── auth.html            # Login and registration UI
├── index.html           # Landing page
├── profile.html         # User dashboard
├── browse.html          # Browse local crops page
├── new-crop.html        # New crop input page
├── view-crop.html       # Crop detail page
├── legal.html           # Terms and privacy
└── admin.html           # Admin dashboard
```

### Runtime Architecture

```
Browser
  │
  │  HTTPS + Cookies
  ▼
Node.js / Express (Azure App Service)
  ├─ Serves static frontend
  ├─ JSON API (/api/*)
  └─ Session middleware (PostgreSQL-backed)

PostgreSQL (Azure Flexible Server)
  ├─ users
  ├─ listings
  └─ sessions
```

The application is deployed as a single-origin system, avoiding CORS complexity and simplifying cookie-based authentication.

---

## Database Schema (MVP)

### users

* `id` (PK)
* `email` (unique)
* `password_hash`
* `display_name`
* `zip` (TEXT)
* `bio` (TEXT)
* `contact_text` (TEXT — user-defined contact information)
* `created_at`
* `updated_at`

### listings

* `id` (PK)
* `user_id` (FK → users.id)
* `title`
* `description`
* `category` (e.g., vegetables, fruit, herbs, eggs)
* `quantity` (NUMERIC)
* `price` (NUMERIC)
* `available_from` (DATE)
* `available_to` (DATE)
* `pickup_zip` (TEXT)
* `is_active` (BOOLEAN)
* `created_at`
* `updated_at`

### sessions

* Managed automatically by the session store (`connect-pg-simple`)

---

## Authentication & Sessions

* Cookie-based authentication using Express sessions
* Passwords are securely hashed using bcrypt
* Raw passwords are never stored or returned by the API
* Sessions are persisted in PostgreSQL to survive application restarts

---

## API Overview

All API routes are prefixed with `/api`. Authentication is required unless explicitly stated otherwise.

### Auth

* `POST /auth/register`
* `POST /auth/login`
* `POST /auth/logout`

### Current User

* `GET /me`

### Dashboard

* `GET /dashboard`

Returns the authenticated user and their listings in a single response:

```json
{
  "user": { "id": 1, "email": "...", "displayName": "...", "zip": "80202" },
  "myListings": []
}
```

### Listings

* `GET /listings`
* `GET /listings/:id`
* `POST /listings`
* `PATCH /listings/:id` (owner only)
* `DELETE /listings/:id` (owner only, soft delete)

### Reveal Contact

* `POST /listings/:id/reveal-contact`

Returns:

```json
{ "contactText": "Preferred contact info entered by grower" }
```

---

## ZIP Allowlist (Front Range)

Listings are filtered using a server-side ZIP code allowlist representing the Colorado Front Range.

Example environment variable:

```
ALLOWED_ZIPS=80002,80014,80021,80202,80301
```

---

## Hosting & Deployment (Azure)

### Hosting Stack

* **Azure App Service (Linux)** — hosts the Node.js / Express application
* **Azure Database for PostgreSQL – Flexible Server** — primary relational database and session store

### Deployment Flow

1. Create an Azure App Service configured for Node.js
2. Create an Azure PostgreSQL Flexible Server instance
3. Configure required environment variables in App Service
4. Enable GitHub-based deployment via Deployment Center
5. Push changes to the `main` branch to trigger automatic deployment

### Required Environment Variables

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://...
SESSION_SECRET=long-random-string
ALLOWED_ZIPS=...
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

---

## MVP Roadmap

### Phase 1 (Current)

* Authentication
* Listings
* Contact reveal
* Azure hosting

### Phase 2 (Post-MVP)

* Image uploads (Azure Blob Storage)
* Subscription model for image uploads
* Redis-backed sessions
* Public browsing mode
* Messaging or contact masking
* Admin moderation tools

---

## Non-Goals (MVP)

* Payments
* On-platform messaging
* Delivery logistics
* Ratings or reviews
* Mobile applications

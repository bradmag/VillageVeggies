# VillageVeggies

A community-driven platform that allows backyard gardeners, urban growers, and small-scale farmers to list and share their surplus produce directly with neighbors. The MVP focuses on simple authentication, user profiles, and preparation for listings and sessions.


## 1. Overview

The VillageVeggies backend provides authentication and user management for the MVP version of the platform. It supports:

- Registering new users
- Logging in existing users
- Preparing for profile endpoints, session-based authentication, and listings

The frontend is built in plain HTML/CSS/JavaScript and consumes JSON endpoints from a Node.js + Express backend with a PostgreSQL database.


## 2. Page Layout

### **Index (Landing)**
Explains the three-step process (post → browse → handoff). Clear CTAs direct users to Browse or Start Selling. Highlights Denver-only MVP scope and encourages off-platform transactions.

### **Funding**
A short support page with a GoFundMe button and optional Stripe one-time donation flow. Contains a simple lead form (name/email) and explains how funds support hosting, moderation, and outreach.

### **Auth (Login & Register)**
A single page (`auth.html`) containing side-by-side Login and Register tabs.
- **Register:** Creates a user account via `POST /auth/register` and stays on the same page.
- **Login:** Authenticates via `POST /auth/login` and redirects to `profile.html` on success.

### **Profile**
The user's workspace. Shows their profile info (name, ZIP, blurb, contact) and will eventually allow updating via a protected `/api/profile` endpoint. Will later include “My Listings” and a “New Crop” form.

### **Browse**
Shows all active local listings. Not implemented yet — no listings table exists yet.

### **View Crop**
Displays details for a single listing. Not implemented yet — will be added after listings table and API.

### **Legal**
A small popup or page with terms, safety guidelines, privacy basics, and disclaimers. Linked from the footer.

### **Admin**
A private dashboard for accounts with `is_admin = true`. Not implemented yet — dependent on sessions and admin APIs.


## 3. Tech Stack

- **Node.js** — JavaScript runtime for the backend.
- **Express.js** — Lightweight routing and middleware.
- **PostgreSQL** — Relational database for all persistent data.
- **pg (node-postgres)** — PostgreSQL client for Node.js.
- **bcrypt** — Secure password hashing for authentication.
- **HTML/CSS/JavaScript** — Simple, framework-free frontend.


## 4. Folder Structure

```text
NewVersion/
│
├── backend/
│   ├── server.js               # Main Express server
│   ├── setup_db.js             # Script to initialize PostgreSQL database
│   ├── package.json            # Backend dependencies
│   └── node_modules/           # Installed backend packages (ignored in Git)
│
├── css/
│   └── styles.css              # Global styles
│
├── js/
│   ├── auth.js                 # Frontend logic for login + register
│   ├── profile.js              # (Future) Profile functionality
│   ├── browse.js               # (Future) Browse page functionality
│   ├── view-crop.js            # (Future) View Crop page logic
│   ├── legal.js                # (Future) Legal popup logic
│   └── admin.js                # (Future) Admin dashboard logic
│
├── auth.html                   # Login + Register UI
├── index.html                  # Landing page
├── profile.html                # Dashboard for the user after login
├── browse.html                 # (Future) Active listings page
├── view-crop.html              # (Future) Listing detail page
├── legal.html                  # (Future) Terms & privacy
└── admin.html                  # (Future) Admin dashboard
```


## 5. Environment Setup

*(To complete later — will describe how to run server, set env vars, install dependencies, and initialize DB.)*


## 6. Database Schema
### **Users Table**

| Column        | Type               | Constraints           | Description                         |
| ------------- | ------------------ | --------------------- | ----------------------------------- |
| id            | SERIAL PRIMARY KEY | Not null              | Unique user ID.                     |
| email         | VARCHAR(255)       | UNIQUE, NOT NULL      | Used for login.                     |
| password_hash | TEXT               | NOT NULL              | bcrypt hash of password.            |
| name          | VARCHAR(255)       | NOT NULL              | Display name.                       |
| zip           | INT                | NOT NULL              | Used to verify Denver-local users.  |
| blurb         | TEXT               | Optional              | Short description about the grower. |
| contact       | VARCHAR(120)       | NOT NULL              | Preferred buyer contact method.     |
| is_admin      | BOOLEAN            | Default: false        | Admin account flag.                 |
| created_at    | DATE               | Default: CURRENT_DATE | Registration date.                  |

**Note:**
Listings, inquiries, and admin tables will be added after session authentication is implemented.


## 7. API Endpoints

### **Authentication Summary**

| Method | Endpoint       | Description                | Auth Required |
| ------ | -------------- | -------------------------- | ------------- |
| POST   | /auth/register | Create a new user account  | No            |
| POST   | /auth/login    | Authenticate existing user | No            |


### **7.1 POST /auth/register**

**Description:** Registers a new user.

**Auth Required:** No
**Response Behavior:** After success, frontend stays on `auth.html` (Login tab opens).

**Request Body**

```json
{
  "email": "brad@example.com",
  "password": "Password123!",
  "name": "Brad",
  "zip": 80202,
  "contact": "brad@example.com",
  "blurb": "I grow tomatoes."
}
```

**Success (201 Created)**

```json
{
  "message": "User registered successfully",
  "user": 
  {
    "email": "brad@example.com",
    "password": "Password123!",
    "name": "Brad",
    "zip": 80202,
    "contact": "brad@example.com",
    "blurb": "I grow tomatoes."
  }
}
```

**Errors**

| Status                        | Meaning                     | Trigger Condition                                             | Backend Behavior                           |
| ----------------------------- | --------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| **400 Bad Request**           | Required fields are missing | `email`, `password`, `name`, `zip`, or `contact` not provided | Returns text: `"Missing required fields"`  |
| **409 Conflict**              | Email already exists        | PostgreSQL unique constraint violation on `email`             | Returns text: `"Email already registered"` |
| **500 Internal Server Error** | Unexpected backend issue    | Database error, bcrypt error, query failure                   | Returns text: `"Registration failed"`      |

### **7.2 POST /auth/login**

**Description:** Authenticates the user.

**Auth Required:** No
**Response Behavior:** Frontend redirects to `profile.html` on success.

**Request Body**

```json
{
  "email": "brad@example.com",
  "password": "Password123!"
}
```

**Success (200 OK)**

```json
{
  "message": "Login successful",
  "user": 
  {
    "email": "brad@example.com",
    "password": "Password123!",
    "name": "Brad",
    "zip": 80202,
    "contact": "brad@example.com",
    "blurb": "I grow tomatoes."
  }
}
```

**Errors**

| Status                        | Meaning                 | Trigger Condition                           | Backend Behavior                                  |
| ----------------------------- | ----------------------- | ------------------------------------------- | ------------------------------------------------- |
| **400 Bad Request**           | Missing required fields | `email` or `password` is empty              | Returns text: `"Email and password are required"` |
| **401 Unauthorized**          | Invalid credentials     | Email not found OR bcrypt password mismatch | Returns text: `"Invalid email or password"`       |
| **500 Internal Server Error** | Backend-level failure   | Database query issues or bcrypt error       | Returns text: `"Login failed"`                    |

## 8. Testing

*(To complete after implementing Thunder Client/Postman examples.)*

## 9. User Flow

*(To complete after session authentication is added.)*

## 10. Security

*(To complete — will contain bcrypt rules, env variables, and future session notes.)*

## 11. Known Limitations

* No session authentication yet.
* No protected routes.
* No listings or crop features implemented.
* Users cannot update profile yet.
* Admin dashboard not active.

## 12. Future Improvements

* Add session-based login (cookies + middleware).
* Add `/api/profile` GET/PUT endpoints.
* Add listings table + listing API.
* Add inquiries, crop handoff, and reporting.
* Add admin dashboard functionality.
* Add email verification & rate limiting.

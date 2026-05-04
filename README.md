# VillageVeggies

A simple MVP web platform that connects plant shops and nurseries with local plant enthusiasts along Colorado's Front Range. Plant shops can manage and display their inventory online. Shoppers can browse local shops and find plants in stock, then visit in person to purchase.

---

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Cookie-based session authentication

### Frontend
- HTML, CSS, and JavaScript
- Static assets served directly from Express (`/public`)

---

## Pages

| Route | Description |
|---|---|
| `/index.html` | Public home page. Lists all registered plant shops. |
| `/login.html` | Shop owner login. |
| `/register.html` | New shop owner registration. |
| `/forgot-password.html` | Request a password reset email. |
| `/reset-password.html` | Set a new password via emailed link. |
| `/shop.html` | Public inventory page for a single shop. |
| `/dashboard.html` | Authenticated shop owner inventory management. |
| `/funding.html` | Mission statement and GoFundMe link. |

---

## Getting Started

### Prerequisites
- Node.js
- PostgreSQL

### Installation
```bash
git clone <your-repo-url>
cd villageveggies
npm install
```

### Environment Variables
Create a `.env` file in the project root:
```
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_session_secret
EMAIL_API_KEY=your_email_service_key
AZURE_STORAGE_CONNECTION_STRING=your_azure_blob_connection_string
```

### Run the App
```bash
npm start
```

---

## Project Structure
```
/public          # Static HTML, CSS, JS files
/routes          # Express route handlers
/middleware      # Auth and session middleware
/db              # Database connection and queries
CLAUDE.md        # Project memory for Claude Code
README.md        # This file
```

---

## Database
Four tables: `shops`, `inventory_items`, `sessions`, `password_reset_tokens`. See `CLAUDE.md` for the full schema.

---

## Photo Storage
Plant and shop photos are stored in Azure Blob Storage. The database holds only the URL pointing to each file.

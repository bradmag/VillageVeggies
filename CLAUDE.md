# VillageVeggies — Claude Code Project Memory

## Project Overview
VillageVeggies is an MVP web platform that connects plant shops and nurseries with local plant enthusiasts along Colorado's Front Range. The primary goal is to enable plant shops to manage their inventory while making it discoverable online.

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

## Front End Pages

**/index.html — Home Page and List of Local Shops**
The public-facing landing page. Introduces the marketplace concept and displays a browsable grid of all registered plant shops in the area. Each shop card shows the shop name, photo, and a short blurb. Clicking a shop navigates to /shop.html?id={shopId}. No account required to browse. Nav links to /login.html and /funding.html.

**/login.html — Shop Login**
Login page exclusively for plant shop owners. Shoppers don't need accounts. Contains an email and password form. Successful login redirects to /dashboard.html. Failed login shows an inline error message. Includes a link to /forgot-password.html and a link to /register.html beneath the form.

**/register.html — Shop Registration**
Public-facing page where new plant shop owners can create an account. Contains a form to enter their shop name, email, password, address, and a short blurb. Once submitted, the account is created and they are redirected to /dashboard.html to complete their profile and begin adding inventory.

**/forgot-password.html — Forgot Password**
A single-field form where shop owners enter their registered email to receive a password reset link. Always shows a neutral confirmation message regardless of whether the email exists, to prevent email enumeration. The emailed link directs to /reset-password.html with a time-limited token.

**/reset-password.html — Reset Password**
Reached via the emailed reset link. Validates the token from the URL on load. If valid, shows a form to enter and confirm a new password. If the token is invalid or expired, shows an error with a link back to /forgot-password.html. On success, redirects to /login.html with a confirmation message.

**/shop.html — Shop Inventory**
Public-facing page for an individual plant shop, loaded using a shopId query parameter. Displays the shop's banner photo, name, blurb, and contact info, followed by their full inventory — plant name, photo, price, and stock status (in stock / sold out). No account required. Includes a link back to /index.html.

**/dashboard.html — Shop Dashboard**
Private page for authenticated shop owners. Requires a valid session token — redirects to /login.html if missing or expired. Shop owners can edit their profile (name, photo, blurb) and manage their inventory: adding, editing, and deleting items. Each item has a name, photo, price, and stock status. Includes a sign out option.

**/funding.html — Funding & Mission**
A fully static public page. Tells the story of how this plant marketplace connects to a larger vision of combating food insecurity and world hunger through local agriculture and community access to plants. Ends with a prominent link to the GoFundMe page.

---

## User Flows

### Plant Shop Owner — Happy Path
1. Shop owner discovers the platform and navigates to /register.html and fills out the registration form with their shop name, email, password, address, and a short blurb
2. Account is created and they are redirected to /dashboard.html (their shop is now visible on /index.html)
3. Shop owner adds inventory items, each with a plant name, photo, price, and stock status
4. Shop owner saves their inventory (items are now visible to shoppers on /shop.html)
5. Shop owner returns to /dashboard.html periodically to add, edit, or remove inventory items
6. When done, shop owner clicks sign out

### Plant Shopper — Happy Path
1. Shopper discovers the platform (word of mouth, search, social media)
2. Shopper lands on /index.html and reads a brief description of the marketplace
3. Shopper browses the grid of local plant shops, each showing a name, photo, and blurb
4. Shopper clicks a shop they're interested in and is taken to /shop.html?id={shopId}
5. Shopper views the shop's banner and full inventory
6. Shopper finds a plant they want and confirms it is in stock, then visits the shop in person to purchase

---

## API List

### Auth
- `POST /api/auth/register` — Creates a new shop account with name, email, password, address, and blurb
- `POST /api/auth/login` — Authenticates a shop owner and returns a session token
- `POST /api/auth/logout` — Invalidates the current session token and signs the shop owner out
- `POST /api/auth/forgot-password` — Accepts an email and sends a password reset link if the account exists
- `GET /api/auth/validate-token` — Checks whether a password reset token is valid and unexpired
- `POST /api/auth/reset-password` — Accepts a valid reset token and updates the shop owner's password

### Index
- `GET /api/index/shops` — Returns a list of all active shops with name, photo, and blurb for the home page grid

### Shop (public)
- `GET /api/shop/:shopId` — Returns a single shop's details including name, banner photo, blurb, and contact info
- `GET /api/shop/:shopId/inventory` — Returns the full inventory for a shop including plant name, photo, price, and stock status

### Dashboard (authenticated)
- `GET /api/dashboard/profile` — Returns the authenticated shop owner's profile data to populate the dashboard
- `GET /api/dashboard/inventory/items` — Returns all inventory items belonging to the authenticated shop
- `POST /api/dashboard/inventory/items` — Adds a new inventory item with plant name, photo, price, and stock status
- `PATCH /api/dashboard/inventory/items/:itemId` — Updates an existing inventory item by ID
- `DELETE /api/dashboard/inventory/items/:itemId` — Removes an inventory item by ID

---

## Database Schema

### Table: shops
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | integer | not null | nextval | Primary key |
| email | varchar(255) | not null | | Unique, used for login |
| password_hash | varchar(255) | | | Hashed password |
| name | varchar(255) | not null | | Display name on index and shop page |
| blurb | varchar(500) | | | Short description shown on shop card |
| location | varchar(255) | not null | | Shop address |
| photo_url | varchar(500) | | | Banner photo for shop page and index card. URL pointing to Azure Blob Storage. |
| is_active | boolean | not null | true | Controls visibility on /index.html |
| inventory_updated_at | timestamp | | now() | Updated when inventory changes |
| created_at | timestamp | | now() | Account creation time |

### Table: inventory_items
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | integer | not null | nextval | Primary key |
| shop_id | integer | not null | | Foreign key → shops(id) ON DELETE CASCADE |
| name | varchar(255) | not null | | Plant name |
| photo_url | varchar(500) | | | Item photo. URL pointing to Azure Blob Storage. |
| price_range | varchar(255) | | | e.g. "$5 – $20" |
| quantity | integer | | | Number in stock |
| availability | boolean | not null | true | In stock / sold out toggle |
| created_at | timestamp | | now() | |
| updated_at | timestamp | | now() | Updated on any item change |

### Table: sessions
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | integer | not null | nextval | Primary key |
| shop_id | integer | not null | | Foreign key → shops(id) ON DELETE CASCADE |
| token | varchar(500) | not null | | Unique session token |
| created_at | timestamp | | now() | |
| expires_at | timestamp | not null | | Session expiry, checked on each authenticated request |

### Table: password_reset_tokens
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | integer | not null | nextval | Primary key |
| shop_id | integer | not null | | Foreign key → shops(id) ON DELETE CASCADE |
| token | varchar(500) | not null | | Unique reset token sent in email link |
| used | boolean | not null | false | Marked true after password is reset |
| created_at | timestamp | | now() | |
| expires_at | timestamp | not null | | Token invalid after this time, typically 1 hour |

---

## Photo Storage Notes
Photos are not stored in the database. The `photo_url` columns hold a text URL pointing to a file in Azure Blob Storage. When a shop owner uploads a photo, the file is sent to the backend, uploaded to Azure Blob Storage, and the resulting URL is saved to the database. Browsers load images directly from Azure using the stored URL.

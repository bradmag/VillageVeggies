# VillageVeggies
A platform that allows backyard gardeners, urban growers, and small-scale farmers to list and sell their surplus produce directly to their neighbors.

## Overview
- Mission: Build a more human and sustainable future through education, innovation, and local food systems.
- Vision: A world where communities grow their own food locally—replacing lawns and abandoned lots with regenerative greenhouses, powered by technology, compost, and care.
- Our Why: We challenge unsustainable food systems by helping people grow food, learn new skills, and reconnect with nature and their communities.
---
## Page Layout
**Index (Landing)**
A simple explanation of what the marketplace is and how it works in three steps: post plants/food, browse, hand off. Clear CTAs drive users to Browse or Start Selling. MVP emphasizes Denver-only scope, backyard growers, and off-platform transactions. A minimal header/footer links to Auth, Funding, and Legal.

**Funding**
Encourages supporters to keep the project alive during MVP by donating. Presents a short why/impact blurb, a GoFundMe button (with a tiny name/email lead form), and a Stripe one-time option. Sets expectations about how funds are used (hosting, moderation, outreach) and links back to Index. Keeps the flow frictionless—form → redirect or checkout.

**Login (And Register form)**
A single page with a hero card with tabs for Login and Register using email + password. Successful auth sets a session and routes users to Profile. 

**Profile (And new Crop form)**
The seller’s workspace to manage their profile (Full name, Zip code, blurb, contact info (email/phone/social)) and post a New Crop. The inline form is short and requires ZIP, harvest date, quantity, and price/unit text plus a terms checkbox. “My Listings” shows statuses (Active, Expired, Handed Off, Deactivated) with an option to remove early if needed. It’s designed for quick repeat posting with minimal friction.

**Browse**
A clean, fast list of Denver-only active listings, sorted oldest first (FIFO). Each card surfaces the essentials: title, price/unit, ZIP, and harvest date. There are no filters yet—users click through to see full details. The page nudges new sellers with a subtle “Start Selling” prompt.

**View Crop**
Displays the full listing details and the seller’s description/notes. A Reveal Contact button shows the seller’s chosen contact info and quietly logs an inquiry for metrics; safety tips appear after reveal. Owners see a Mark as handed off control to close the loop. Anyone can Report the listing with a brief reason to flag issues.

**Legal**
A compact, plain-language popup covering acceptable use, privacy basics, and important disclaimers (off-platform payments, food safety, meet-up guidance). It’s linked in the footer and summarized during the New Crop flow. Acceptance is required when creating a listing. Written to be short enough that people actually read it.

**(Admin – private)**
A lightweight dashboard restricted to accounts with `is_admin = true`. Metrics summarizes supply/demand health (active listings, inquiries per listing, liquidity, handoffs, donations, open reports) with quick time windows (Today / 7d / 30d). Users is read-only for visibility. Listings allows deactivation, and Reports supports resolving incoming flags to keep the marketplace clean.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node, Express
- Database: PostgreSQL

## APIs
**Auth & session**
| Method | Endpoint | Description | Body Example |
|---|---|---|---|
| POST | /auth/register | Register a new user into the user database. | {<br>"email": "bradley@example.com",<br>"password": "password123",<br>"name": "Bradley Magee",<br>"zip": 80202,<br>"contact": "bradley@example.com",<br>"blurb": "Spicy jalapeños"<br>} |

## Database
**users**
`id, email (unique), password_hash, name, zip, blurb, contact, is_admin (bool), created_at`



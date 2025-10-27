# VillageVeggies
A platform that allows backyard gardeners, urban growers, and small-scale farmers to list and sell their surplus produce directly to nearby consumers.

---
## Page Layout
### Index (Landing)

A simple explanation of what the marketplace is and how it works in three steps: post plants/food, browse, hand off. Clear CTAs drive users to **Browse** or **Start Selling**. MVP emphasizes Denver-only scope, backyard growers, and off-platform transactions. A minimal header/footer links to Auth, Funding, and Legal.


### Funding

Encourages supporters to keep the project alive during MVP by donating. Presents a short why/impact blurb, a **GoFundMe** button (with a tiny name/email lead form), and a **Stripe one-time** option. Sets expectations about how funds are used (hosting, moderation, outreach) and links back to Index. Keeps the flow frictionless—form → redirect or checkout.


### Login (And Register form)

A single page with a hero card with tabs for **Login** and **Register** using email + password. Successful auth sets a session and routes users to **Profile**. 


### Profile (And new Crop form)

The seller’s workspace to manage their profile (Full name, Zip code, blurb, contact info (email/phone/social)) and post a **New Crop**. The inline form is short and requires ZIP, harvest date, quantity, and price/unit text plus a terms checkbox. “My Listings” shows statuses (Active, Expired, Handed Off, Deactivated) with an option to remove early if needed. It’s designed for quick repeat posting with minimal friction.

**New Crop Form**
Crop name 
Price
Quantity
Harvest Date
Growing Method
Notes

**Dashboard**
A section of the profile page will be dedicated to listing the crops the user has posted previously. This section will show the crop cards as they appear in the browse page and you can click on them to access the view crop page

**User’s Profile Form**
Full name 
Zip Code
Blurb
Contact (email/phone/social)


### Browse

A clean, fast list of **Denver-only** active listings, sorted **oldest first** (FIFO). Each card surfaces the essentials: title, price/unit, ZIP, and harvest date. There are no filters yet—users click through to see full details. The page nudges new sellers with a subtle “Start Selling” prompt.


### View Crop

Displays the full listing details and the seller’s description/notes. A **Reveal Contact** button shows the seller’s chosen contact info and quietly logs an inquiry for metrics; safety tips appear after reveal. Owners see a **Mark as handed off** control to close the loop. Anyone can **Report** the listing with a brief reason to flag issues.


### Legal

A compact, plain-language popup covering acceptable use, privacy basics, and important disclaimers (off-platform payments, food safety, meet-up guidance). It’s linked in the footer and summarized during the New Crop flow. Acceptance is required when creating a listing. Written to be short enough that people actually read it.

### (Admin – private)

A lightweight dashboard restricted to accounts with `is_admin = true`. **Metrics** summarizes supply/demand health (active listings, inquiries per listing, liquidity, handoffs, donations, open reports) with quick time windows (Today / 7d / 30d). **Users** is read-only for visibility. **Listings** allows deactivation, and **Reports** supports resolving incoming flags to keep the marketplace clean.

---
## APIs (Python + Django)

**Auth & session**
- `POST /api/auth/register` → sets session cookie
- `POST /api/auth/login` → sets session cookie
- `POST /api/auth/logout`

**Profile**
- `GET /api/profile`
- `PUT /api/profile`

**Listings**
- `POST /api/listings` (requires hCaptcha + terms checkbox)
- `GET /api/listings` (active + not expired + **Denver ZIP allowlist**)
- `GET /api/listings/:id`
- `POST /api/listings/:id/inquiry` → logs `contact_revealed` (rate-limited) and returns seller contact fields
- `POST /api/listings/:id/handoff` (owner only) → logs `handoff_marked`, set status
- `POST /api/listings/:id/report` → creates report + logs event

**Donations**
- `POST /api/donors` (name, email, source='gofundme') → 200; front-end redirects to GoFundMe
- `POST /api/donations/checkout` → creates Stripe Checkout session
- `POST /api/donations/stripe-webhook` → records `donation_recorded`

**Admin** (requires `is_admin`)
- `GET /api/admin/metrics?window=today|7d|30d`
- `GET /api/admin/users`
- `GET /api/admin/listings`
- `POST /api/admin/listings/:id/deactivate`
- `GET /api/admin/reports`
- `POST /api/admin/reports/:id/resolve`

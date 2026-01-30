# VillageVeggies

## Overview

VillageVeggies is a simple MVP web platform that connects Plant shops and Nurseries with local plant enthusiasts along Colorado’s Front Range. The primary goal is to enable plant shops and nurseries to keep track of inventory while displaying their plants online.

## Hypothesis

Plant shops will keep a simple inventory page updated if it reduces customer friction and increases purchase intent.

1. Shops update Inventory with sufficient content
2. Visibility creates higher-intent customers

## Metrics

🌟 Weekly Inventory Update Rate per shop

Shops must keep at > 10 Items in their inventory and update at least once per week.

Metric: ShopsThatUpdatedInventoryThisWeek / TotalShops

Failure: <30% | Concern: 30-50% | Success: >50%

🌟 Inventory-Informed Purchase Rate

Metric: CustomersWhoViewedInventoryBeforeVisiting / TotalCustomersWhoPurchasedInventoryListedItems

Failure: <5% | Concern: 5-20% | Success: >20%

🌟 Customer Interruption Rate

HowManyTimesPerDayDoStaffAnswerAvailabilityQuestions (lower is better)

Supporting Metrics
- Inventory Page Views per Week
- Time Since Last Update
- Items Listed per Shop

## MVP Feature List

Shop Side (Login Required)
- Inventory Page (with last_updated_at)
  - Add item: Name, availability, quantity, price range
  - Update item: Availability, Quantity, Delete

Public Side
- Public inventory page (no login)
  - Clearly shows Items, Availability, and “Last updated X days ago”

Admin (Login Required)
- List of Shops onboarded with last updated timestamps and inventory count
- Weekly inventory update rate per shop
- Inventory-informed purchase rate
- Customer interruption Rate

## Tech Stack

Backend: Node.js, Express.js, PostgreSQL
Frontend: HTML, CSS, JS

## User Flows

Concierge Onboarding
1. Admin logs in
2. Admin creates shop (emails shop owner for access, testing, and promotion instructions)
3. Admin Opens Shop page
4. Admin Teaches how to add Items (10 required for test)
5. Admin Teaches how to update inventory

Shop update inventory (Testing behavior)
1. Shop logs in
2. Lands on “Inventory Dashboard”
3. Toggle availability / update quantity / add/remove items
4. Save updates (timestamps update automatically)

Public visitor
1. User lands on shop inventory page
2. Sees last updated and availability

Weekly measurement loop (admin + shop)
1. Once per week, admin checks admin dashboard
2. Admin send reminder to non-updaters
3. Admin collects weekly report numbers from the shop
4. Enter weekly report via admin form

## Front-End Pages
/index.html
    Explanation of what the website is and does with a list of plant shops
/login.html
    Shops can login to update their inventory
/dashboard.html
    Shops can update their inventory
        Add item
        Edit Item
        Delete Item
/admin.html
    Admin can log in to check the status of the website
        How many shops
        How many items in each inventory
        Last updated
/shop/:shopId.html
    Displays shop info and inventory for the public to see
/funding.html
    Explain that this website is a small part of a big plan to end world hunger with a ling to the GoFundMe

## Data Model

`shops`:
- id
- name
- location
- created_at
- inventory_updated_at
- is_admin (boolean)

`inventory_items`:
- id
- shop_id
- name
- availability (boolean)
- quantity (integer, nullable)
- price_range (string)
- item_updated_at

## API List (current plan)

Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

Admin
- GET /api/admin/shops

Index
- GET /api/index/shops

Dashboard (authenticated)
- GET /api/dashboard/items
- POST /api/dashboard/inventory/items
- PATCH /api/dashboard/inventory/items/:itemId
- DELETE /api/dashboard/inventory/items/:itemId

Public
- GET /api/shops/:shopId
- GET /api/shops/:shopId/inventory


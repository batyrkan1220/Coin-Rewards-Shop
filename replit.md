# Coins Rewards Platform

## Overview
Multi-tenant SaaS Coins Rewards, Shop, and Lessons platform with Role-Based Access Control (RBAC). Four user roles: SUPER_ADMIN (platform owner, manages companies and plans), ADMIN (company admin, full company control), ROP (team lead with coin management and approval powers), and MANAGER (can earn coins, shop, and learn). All UI is in Russian, no emojis.

## Multi-Tenant Architecture
- **SUPER_ADMIN** has null companyId, sees /super-admin dashboard with Companies, Plans, Stats tabs
- **All other users** (ADMIN/ROP/MANAGER) belong to a company (companyId), data is company-scoped
- Company-scoped routes use `getCompanyId(req)` helper to extract companyId from session user
- Registration enforces subscription plan user limits (maxUsers per company)
- Each company has a subdomain, plan, and support email

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, shadcn/ui, wouter routing, TanStack Query
- **Backend**: Express.js + TypeScript, Passport.js (local strategy), connect-pg-simple sessions
- **Database**: PostgreSQL with Drizzle ORM
- **Port**: Frontend and backend both served on port 5000

## Project Structure
```
shared/
  schema.ts       - Drizzle tables, relations, Zod schemas, TypeScript types
  routes.ts       - API contract (paths, methods, input/output schemas)
server/
  index.ts        - Server entry point
  db.ts           - Database connection (Pool + Drizzle)
  auth.ts         - Passport.js setup, password hashing, login/logout/me routes
  routes.ts       - All API route handlers, seed data, Super Admin endpoints
  storage.ts      - Database CRUD operations (IStorage interface + DatabaseStorage class)
  vite.ts         - Vite dev server integration
client/src/
  App.tsx          - Router with ProtectedRoute wrapper (SUPER_ADMIN redirect to /super-admin)
  pages/
    auth.tsx       - Login page
    dashboard.tsx  - User dashboard with balance, transactions, redemptions
    shop.tsx       - Rewards shop with search and redemption dialog
    lessons.tsx    - Lessons library grouped by course
    team.tsx       - Team management (coin ops: earn, adjust, zero-out)
    requests.tsx   - Redemption requests with approval workflow
    admin.tsx      - Admin panel with 8 tabs (Users, Teams, Shop, Lessons, Redemptions, Transactions, Audit, Invites)
    super-admin.tsx - Super Admin dashboard (Statistics, Companies, Plans)
    register.tsx   - Registration page via invite token
    profile.tsx    - User profile with name/password change
  hooks/
    use-auth.ts, use-team.ts, use-shop.ts, use-transactions.ts, use-redemptions.ts, use-lessons.ts, use-audit.ts
  components/
    layout-shell.tsx - Sidebar + topbar layout (hides balance for SUPER_ADMIN)
    item-card.tsx    - Shop item card component
    ui/              - shadcn/ui components
```

## Database Tables
1. **users** - id, username, password, role, name, gender, avatarStyle, companyId (nullable for SUPER_ADMIN), teamId, isActive, createdAt
2. **companies** - id, name, subdomain, planId, isActive, supportEmail, createdAt
3. **subscription_plans** - id, name, maxUsers, priceMonthly, features (jsonb), isActive, createdAt
4. **teams** - id, name, ropUserId, companyId, createdAt
5. **shop_items** - id, title, description, priceCoins, stock, isActive, imageUrl, companyId, createdAt
6. **coin_transactions** - id, userId, type (EARN/SPEND/ADJUST), amount, reason, refType, refId, status (PENDING/APPROVED), createdById, companyId, createdAt
7. **redemptions** - id, userId, shopItemId, priceCoinsSnapshot, status, comment, companyId, approvedById, approvedAt, issuedById, issuedAt, createdAt
8. **lessons** - id, course, title, contentType, content, orderIndex, isActive, companyId, createdAt
9. **audit_logs** - id, actorId, action, entity, entityId, details (jsonb), companyId, createdAt
10. **invite_tokens** - id, token, teamId, createdById, usedById, expiresAt, usageLimit, usageCount, isActive, companyId, createdAt, usedAt
11. **level_configs** - id, name, displayName, requiredCoins, orderIndex, isActive, companyId, createdAt

## Demo Credentials
- Super Admin: superadmin@platform.com / superadmin123
- Admin: admin@example.com / admin123
- ROP: rop@example.com / rop123
- Manager: manager1@example.com / manager123

## Super Admin API Endpoints
- GET /api/super/stats - Platform statistics (total companies, active companies, total users)
- GET /api/super/companies - List all companies with plan info and user count
- POST /api/super/companies - Create new company with admin user
- PATCH /api/super/companies/:id - Update company details
- GET /api/super/plans - List all subscription plans
- POST /api/super/plans - Create subscription plan
- PATCH /api/super/plans/:id - Update subscription plan

## Key Features
- Multi-tenant SaaS with company isolation
- Three subscription plans: Базовый (free, 50 users), Профессиональный (5000 KZT/mo, 100 users), Корпоративный (15000 KZT/mo, 500 users)
- Three-step redemption workflow: PENDING -> APPROVED -> ISSUED
- Coins deducted on APPROVED status
- Transaction approval workflow: ROP transactions PENDING, Admin auto-APPROVED
- Balance only counts APPROVED transactions
- Zero-out creates ADJUST transaction (preserves history)
- Full audit trail for all admin operations
- Lessons support VIDEO (YouTube embedded), ARTICLE (rich text), and LINK content types
- YouTube videos play embedded within the platform (no redirect to YouTube)
- Russian UI throughout, no emojis

## Content Types for Lessons
- **VIDEO**: YouTube link, embedded player via iframe on platform
- **ARTICLE**: Full text content displayed within the platform
- **LINK**: External link with iframe preview and fallback external link button

## Image Upload
- Shop items support image upload with 1:1 crop via Replit Object Storage
- Upload flow: file select -> react-easy-crop 1:1 -> canvas resize 600x600 -> presigned URL upload to GCS
- Upload endpoint: POST /api/uploads/request-url (auth required)
- Uploaded images served via: GET /objects/uploads/<uuid>
- Component: client/src/components/image-crop-uploader.tsx
- Object storage integration: server/replit_integrations/object_storage/

## Invite System
- Admin creates invite links from Admin > Invites tab
- Invite tokens expire after 7 days
- Each invite has a configurable usage limit (default 5, max 100)
- Usage count tracked per invite, link auto-deactivates when limit reached
- Atomic usage enforcement with DB-level concurrency safety
- Registration via invite automatically assigns MANAGER role and specified team
- Registration endpoint auto-logs in user after successful registration
- Invite links format: /register/:token

## Gender & Avatars
- Users select gender (male/female) during registration
- Default avatars use DiceBear avataaars API with gender-specific styling
- Male avatars: short hair styles, optional facial hair
- Female avatars: long hair styles, no facial hair, optional accessories
- Users can choose custom avatars from 16 DiceBear styles on the profile page
- Avatar styles include: adventurer, avataaars, big-ears, lorelei, notionists, personas, micah, miniavs, croodles, etc.
- Each style offers 8 seed variations for different looks
- Selected avatar stored in user.avatarStyle field (format: "style:seed")
- Shared helper: client/src/lib/avatars.ts (getAvatarUrl, AVATAR_STYLES)

## Profile Page
- Users can change their display name
- Password change requires current password verification
- Shows balance, team, and role information

## Branding
- Logo text: "tabys" (lowercase) in header/sidebar/footer
- All other text references: "Tabys" (capital T) in descriptions, about section, copyright, etc.
- Platform name in browser title: "tabys"

## Company Registration
- New companies get 3-day free trial (no plan selection required)
- Registration form collects: company name, phone number, admin name, email, password, gender
- Companies table has phone and trialEndsAt fields
- 20 template shop items auto-created for new companies

## Support Contact
- WhatsApp: +7 777 014 58 74
- Direct link: https://wa.me/77770145874
- Shown on: homepage footer contacts, deactivated company login page

## Level System
- Levels based on total earned coins (SUM of EARN transactions with APPROVED status only)
- Spending coins does NOT reduce level progress - levels never decrease
- Default 5 levels auto-created per company: Бронза(0), Серебро(100), Золото(500), Платина(1000), Алмаз(2500)
- Admin manages levels via Admin > Уровни tab (create, edit, activate/deactivate)
- Dashboard shows current level, progress bar to next level, and coins needed
- Level-up popup dialog appears when user reaches a new level
- API: GET /api/levels (list), POST /api/levels (create, ADMIN), PATCH /api/levels/:id (update, ADMIN), GET /api/my-level (current user level info)
- Company-scoped: each company has its own level configuration

## Company Deactivation Flow
- When Super Admin deactivates a company (isActive=false), all users from that company:
  - Cannot log in (403 with "company_deactivated" message)
  - Get logged out if already authenticated (redirected to /auth?reason=company_deactivated)
  - See "Доступ приостановлен" card with expired plan message and WhatsApp support link

## Recent Changes
- 2026-02-11: Added Level system: level_configs table, admin CRUD tab, dashboard progress bar, level-up popup, default 5 levels per company, company-scoped
- 2026-02-11: Added company deactivation flow: users see expired plan message with WhatsApp support link, homepage footer shows WhatsApp contact
- 2026-02-10: Removed pricing/tariff section from homepage, added phone number to registration, free 3-day trial for all new companies, "Tabys" branding (capital T in text, lowercase in logo)
- 2026-02-10: Redesigned homepage with marketing sections: hero, stats, features, how-it-works, audience, about, CTA
- 2026-02-10: Added 20 template shop items auto-created for new companies
- 2026-02-09: Multi-tenant SaaS transformation: added SUPER_ADMIN role, companies table, subscription_plans table, company-scoped data isolation, Super Admin dashboard with Statistics/Companies/Plans tabs
- 2026-02-09: Added invite usage limits (configurable per link) and gender selection at registration with gender-specific avatars
- 2026-02-09: Added invite token system: admin creates secret registration links, registration page, admin Invites tab with create/copy/deactivate
- 2026-02-09: Added user profile page with name change and password change
- 2026-02-09: Added profile link to sidebar navigation
- 2026-02-09: Added image upload with 1:1 crop to admin shop form (create and edit), using Replit Object Storage + react-easy-crop
- 2026-02-09: Added VIDEO/ARTICLE/LINK content types for lessons, embedded YouTube player, article viewer, lesson detail page within platform, admin CRUD for lessons with delete, content type selector in admin
- 2026-02-09: Transaction approval workflow, balance filters by APPROVED status, dashboard stats filter APPROVED only
- 2026-02-09: Fixed storage.ts class structure bug, added full Admin CRUD routes, expanded admin page to 8 tabs, added zero-out functionality, added audit log viewing

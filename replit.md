# Coins Rewards Platform

## Overview
Corporate Coins Rewards, Shop, and Lessons platform with Role-Based Access Control (RBAC). Three user roles: ADMIN (full system control), ROP (team lead with coin management and approval powers), and MANAGER (can earn coins, shop, and learn). All UI is in Russian.

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
  routes.ts       - All API route handlers, seed data
  storage.ts      - Database CRUD operations (IStorage interface + DatabaseStorage class)
  vite.ts         - Vite dev server integration
client/src/
  App.tsx          - Router with ProtectedRoute wrapper
  pages/
    auth.tsx       - Login page
    dashboard.tsx  - User dashboard with balance, transactions, redemptions
    shop.tsx       - Rewards shop with search and redemption dialog
    lessons.tsx    - Lessons library grouped by course
    team.tsx       - Team management (coin ops: earn, adjust, zero-out)
    requests.tsx   - Redemption requests with approval workflow
    admin.tsx      - Admin panel with 8 tabs (Users, Teams, Shop, Lessons, Redemptions, Transactions, Audit, Invites)
    register.tsx   - Registration page via invite token
    profile.tsx    - User profile with name/password change
  hooks/
    use-auth.ts, use-team.ts, use-shop.ts, use-transactions.ts, use-redemptions.ts, use-lessons.ts, use-audit.ts
  components/
    layout-shell.tsx - Sidebar + topbar layout
    item-card.tsx    - Shop item card component
    ui/              - shadcn/ui components
```

## Database Tables
1. **users** - id, username, password, role, name, teamId, isActive, createdAt
2. **teams** - id, name, ropUserId, createdAt
3. **shop_items** - id, title, description, priceCoins, stock, isActive, imageUrl, createdAt
4. **coin_transactions** - id, userId, type (EARN/SPEND/ADJUST), amount, reason, refType, refId, createdById, createdAt
5. **redemptions** - id, userId, shopItemId, priceCoinsSnapshot, status, comment, approvedById, approvedAt, issuedById, issuedAt, createdAt
6. **lessons** - id, course, title, contentType, content, orderIndex, isActive, createdAt
7. **audit_logs** - id, actorId, action, entity, entityId, details (jsonb), createdAt
8. **invite_tokens** - id, token, teamId, createdById, usedById, expiresAt, isActive, createdAt, usedAt

## Demo Credentials
- Admin: admin@example.com / admin123
- ROP: rop@example.com / rop123
- Manager: manager1@example.com / manager123

## Key Features
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
- Invite tokens expire after 7 days, one-time use only
- Registration via invite automatically assigns MANAGER role and specified team
- Registration endpoint auto-logs in user after successful registration
- Invite links format: /register/:token

## Profile Page
- Users can change their display name
- Password change requires current password verification
- Shows balance, team, and role information

## Recent Changes
- 2026-02-09: Added invite token system: admin creates secret registration links, registration page, admin Invites tab with create/copy/deactivate
- 2026-02-09: Added user profile page with name change and password change
- 2026-02-09: Added profile link to sidebar navigation
- 2026-02-09: Added image upload with 1:1 crop to admin shop form (create and edit), using Replit Object Storage + react-easy-crop
- 2026-02-09: Added VIDEO/ARTICLE/LINK content types for lessons, embedded YouTube player, article viewer, lesson detail page within platform, admin CRUD for lessons with delete, content type selector in admin
- 2026-02-09: Transaction approval workflow, balance filters by APPROVED status, dashboard stats filter APPROVED only
- 2026-02-09: Fixed storage.ts class structure bug, added full Admin CRUD routes, expanded admin page to 8 tabs, added zero-out functionality, added audit log viewing

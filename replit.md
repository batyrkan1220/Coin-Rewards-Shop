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
    admin.tsx      - Admin panel with 7 tabs (Users, Teams, Shop, Lessons, Redemptions, Transactions, Audit)
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

## Demo Credentials
- Admin: admin@example.com / admin123
- ROP: rop@example.com / rop123
- Manager: manager1@example.com / manager123

## Key Features
- Three-step redemption workflow: PENDING -> APPROVED -> ISSUED
- Coins deducted on APPROVED status
- Zero-out creates ADJUST transaction (preserves history)
- Full audit trail for all admin operations
- Russian UI throughout

## Recent Changes
- 2026-02-09: Fixed storage.ts class structure bug, added full Admin CRUD routes, expanded admin page to 7 tabs, added zero-out functionality, added audit log viewing

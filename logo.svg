# Backstage Manager — Costume Inventory Platform

Multi-tier costume, props & equipment inventory system for theatres and schools.  
Built with **Next.js 15 · Supabase · Tailwind CSS · TypeScript**.

---

## Quick Start

### 1 — Clone & Install

```bash
git clone <your-repo>
cd stagward
npm install
```

### 2 — Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in the Supabase dashboard
3. Paste and run the entire contents of **`supabase-schema.sql`**  
   *(creates all tables, RLS policies, storage bucket, triggers, and seed data)*
4. Copy your credentials from **Settings → API**

### 3 — Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4 — Run Locally

```bash
npm run dev
# → http://localhost:3000
```

### 5 — Deploy to Vercel

```bash
npx vercel --prod
```

Add the two environment variables in Vercel dashboard:  
**Settings → Environment Variables**

---

## First Login & Admin Setup

1. Go to your app URL → click **Sign Up**
2. In Supabase dashboard → **Authentication → Users** confirm the user
3. In **SQL Editor**, promote yourself to sysadmin:
   ```sql
   update user_profiles
   set role = 'sysadmin'
   where email = 'your@email.com';
   ```
4. Log in — you'll land on the System Admin dashboard

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Root redirect
│   ├── login/page.tsx              # Auth page
│   ├── dashboard/
│   │   ├── layout.tsx              # AppShell wrapper
│   │   ├── page.tsx                # Dashboard (role-aware)
│   │   ├── inventory/[type]/       # Costumes / Props / Wigs / Jewelry / Equipment
│   │   ├── locations/              # Nested location manager
│   │   ├── loans/
│   │   │   ├── incoming/           # Loan requests TO this facility
│   │   │   └── outgoing/           # Loan requests FROM this facility
│   │   ├── sharing/                # Per-facility sharing settings
│   │   └── customize/              # Editable dropdown lists
│   └── api/
│       ├── items/                  # GET list, POST create
│       ├── items/[id]/             # GET, PUT, DELETE single item
│       ├── photos/                 # Upload, set-primary, delete
│       ├── locations/              # CRUD nested locations
│       ├── dropdowns/              # GET & PUT facility lists
│       ├── loan-requests/          # GET list, POST create
│       ├── loan-requests/[id]/     # PATCH (approve/decline/checkout/checkin)
│       ├── checkout/               # Internal checkout records
│       ├── districts/              # Sysadmin district management
│       └── facilities/             # District/sysadmin facility management
├── components/
│   └── AppShell.tsx                # Sidebar + topbar navigation
└── lib/
    ├── types.ts                    # Full TypeScript data model
    ├── supabase-client.ts          # Browser Supabase client
    └── supabase-server.ts          # Server-side Supabase client
```

---

## Role Hierarchy

| Role | Access |
|------|--------|
| **sysadmin** | All districts, all facilities, all data |
| **district_manager** | All facilities + inventory within their district |
| **facility_manager** | Own facility only + shared items from peers |

---

## Inter-Facility Loan Workflow

1. **Facility A** enables "Can View" + "Can Request Loans" for Facility B in **Sharing Settings**
2. **Facility B** browses shared inventory, clicks "Request Loan"
3. **Facility A** sees request in "Loans In" → Approve or Decline
4. On approval → Facility A clicks "Check Out" (marks item `On Loan`)
5. When returned → Facility A clicks "Check In" (item returns to `Available`)

---

## Database Tables

| Table | Description |
|-------|-------------|
| `districts` | Top-level organisations |
| `facilities` | Schools / theatres within a district |
| `facility_share_settings` | Who can view / request loans from whom |
| `user_profiles` | Auth users with role + district/facility assignment |
| `locations` | Nested building → room → area → shelf/bin |
| `dropdown_lists` | Per-facility customisable dropdown values |
| `inventory_items` | All costumes, props, wigs, jewelry, equipment |
| `item_photos` | Up to 6 photos per item, stored in Supabase Storage |
| `loan_requests` | Inter-facility loan workflow |
| `checkout_records` | Internal person-level checkouts |
| `activity_log` | Audit trail of all actions |

---

## Item Fields Captured

### Costumes (from official Costume Piece Worksheet)
Costume type, group/category, time period, gender, adult/child, size, color, color pattern, fabric, design style, special effects, cleaning code, hem/length, sleeves detail, costume designer, source, date acquired, disposable flag, multiple/qty, D/C fee, rental fee, full measurements (chest, waist, hips, girth, neck, sleeves, inseam, outseam, neck-to-waist, waist-to-hem, waist-to-floor, hat circumference, shoe size, commercial dress size, bra size + custom field)

### Props & Sets (from official Prop/Set Worksheet)
Prop type, item name, group, time period, color(s), material, prop maker, designer, source, when acquired, borrowed-from, due-back date, is-on-loan, dimensions (H/W/D/Weight), functional properties (can paint, can stand on, is functional, remote-controlled, multiple, part of package), package details

### Both
Status, condition, needs-repair + description, OK-to-loan, rental fee, total cost, replacement cost, description, notes, storage location, current location, date entered in DB, photo file name, productions used in, up to 6 photos

---

## Tech Stack

- **Next.js 15** (App Router, Server Components, API Routes)
- **Supabase** (Postgres + Row Level Security + Auth + Storage)
- **Tailwind CSS** (custom theatrical dark theme)
- **TypeScript** (full type coverage)
- **Vercel** (deployment + edge network)

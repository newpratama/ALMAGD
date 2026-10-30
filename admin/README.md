# ALMAGD Admin — New Pratama Booking & Guest System

Web admin panel for ALMAGD (New Pratama) villa and room bookings, guest management, payments, visual room calendar, and manager reporting.

## Prerequisites
- Node.js >= 18
- Docker (for local Supabase development)
- Supabase CLI

---

## 1. Local Development Setup

1. **Install dependencies:**
   ```bash
   cd admin
   npm install
   ```

2. **Start local Supabase:**
   ```bash
   supabase start
   supabase db reset
   ```

3. **Configure environment:**
   Create `.env.local` using the credentials output by `supabase status`:
   ```bash
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`.

5. **Test credentials (Local seed):**
   - Manager: `manager@almagd.test` / `password123`
   - Reception: `reception@almagd.test` / `password123`

---

## 2. Importing Reference Excel Data

To import historical bookings and payments from `New Villa Pratama 1.xlsx`:

- **Dry-run (simulation without database writes):**
  ```bash
  node scripts/import-excel.mjs "../New Villa Pratama 1.xlsx"
  ```
  Generates `scripts/import-report.md`.

- **Commit to database:**
  ```bash
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" node scripts/import-excel.mjs "../New Villa Pratama 1.xlsx" --commit
  ```

---

## 3. Connecting to Supabase Cloud

To connect the application to your production Supabase cloud project:

1. **Link the local repository:**
   ```bash
   supabase link --project-ref <PROJECT_REF>
   ```

2. **Push migrations:**
   ```bash
   supabase db push
   ```

3. **Set environment variables:**
   ```bash
   VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=<PUBLISHABLE_OR_ANON_KEY>
   ```

4. **Create Staff Accounts:**
   In Supabase Dashboard under **Authentication -> Users**, create users with email/password. Then in **Settings -> Staff** in the web admin, link their user UUID to `manager` or `reception`.

---

## 4. Deploying to Cloudflare Pages

1. **Framework Preset:** Vite
2. **Root directory:** `admin`
3. **Build command:** `npm run build`
4. **Build output directory:** `dist`
5. **Environment Variables:**
   - `VITE_SUPABASE_URL`: `https://<PROJECT_REF>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<anon-or-publishable-key>`

---

## 5. Verification & Testing

- Run Vitest suite:
  ```bash
  npx vitest run
  ```
- Strict TypeScript check:
  ```bash
  npx tsc --noEmit
  ```
- Build production bundle:
  ```bash
  npm run build
  ```
- Check for forbidden physical Tailwind classes:
  ```bash
  grep -rnE "\b(ml|mr|pl|pr)-[0-9]|\b(left|right)-[0-9]|text-(left|right)\b" src
  ```

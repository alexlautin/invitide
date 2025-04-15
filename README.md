# Invitide

Invitide is a modern event management platform built with Next.js, Supabase, and AI-powered features. Easily create, manage, and share events with friends, generate AI event descriptions, and track attendance with QR codes.

## Features
- Create and manage events
- AI-generated event descriptions
- RSVP and attendee management
- QR code check-in for event attendance
- User authentication (email/password, GitHub OAuth)
- User profiles with display names
- Video call integration (Jitsi)
- Responsive, modern UI

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm, yarn, or pnpm
- Supabase project (with tables: `events`, `event_attendees`, `profiles`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alexlautin/invitide.git
   cd invitide
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local` and fill in your Supabase and API keys.
   - Required variables:
     - `SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `GOOGLE_API_KEY` (for AI descriptions)
     - `NEXT_PUBLIC_GEMINI_API_KEY` (for Gemini AI)

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `app/` - Next.js app directory (pages, components, API routes)
- `lib/` - Supabase client setup
- `utils/` - Utility functions
- `public/` - Static assets

## Deployment
Deploy easily on [Vercel](https://vercel.com/) or your preferred platform. See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

## License
MIT

---

Made by Alex Lautin, Andy Blumberg, Jake Floch, Saif Farooqi, and Aman Bhayani

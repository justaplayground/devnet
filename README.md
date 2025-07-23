# DevNet

## Project Overview

DevNet is a modern, open-source platform for developers to share knowledge, publish posts, and connect with the community. Built with Vite, React, TypeScript, shadcn-ui, and Tailwind CSS, it features a clean, responsive UI and a robust backend powered by Supabase.

## Features

- 📝 **Post Creation & Feed**: Write, publish, and browse posts with rich content and tags.
- 🔍 **Tag System**: Discover and filter content by popular tags.
- 👤 **User Authentication**: Sign up, sign in, and manage your profile securely (Supabase Auth).
- 🏆 **Admin Dashboard**: Manage users, posts, and platform stats (admin access required).
- 📊 **Engagement**: Like, comment, bookmark, and view post stats.
- ⚡ **Modern UI**: Responsive, accessible, and themeable design inspired by Dev.to.
- 🛡️ **Role-based Access**: Admin and moderator roles for platform management.

## Technologies Used

- [Vite](https://vitejs.dev/) (build tool)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [shadcn-ui](https://ui.shadcn.com/) (UI components)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first CSS)
- [Supabase](https://supabase.com/) (database & auth)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/)

### Installation

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at [http://localhost:8080](http://localhost:8080) by default.

### Project Structure

- `src/` — Main source code
  - `components/` — UI components (including Layout, PostCard, UI primitives)
  - `contexts/` — React context providers (e.g., Auth)
  - `hooks/` — Custom React hooks
  - `integrations/supabase/` — Supabase client and types
  - `lib/` — Utility functions
  - `pages/` — Main page components (Index, Auth, Admin, etc.)
- `public/` — Static assets
- `supabase/` — Supabase config and migrations

### Environment & Configuration

- **Supabase**: The project is pre-configured with a Supabase project. If you wish to use your own, update the credentials in `src/integrations/supabase/client.ts`.
- **Port**: The dev server runs on port 8080 by default (see `vite.config.ts`).
- **Tailwind**: Custom theme and utility classes are defined in `tailwind.config.ts` and `src/index.css`.

### Admin Access
- The admin dashboard is accessible only to users with admin or moderator roles.
- Default admin credentials are seeded in the Supabase migrations (see `supabase/migrations/`).

## Deployment

To build for production:

```sh
npm run build
```

To preview the production build locally:

```sh
npm run preview
```

You can deploy the output in the `dist/` directory to any static hosting provider (e.g., Vercel, Netlify, Cloudflare Pages).

## License

This project is open-source and available under the [MIT License](LICENSE).

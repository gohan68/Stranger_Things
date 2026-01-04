# Stranger Things — The Right Side Up

<div align="center">

**A Fan-Fiction Novel by Sharukesh Gohan**

[![Built with React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?logo=supabase)](https://supabase.com/)

</div>

---

## 📖 About

An interactive fan-fiction novel set in the Stranger Things universe. This web application provides an immersive reading experience with modern features like user comments, reading progress sync, and real-time interactions.

**Features**:
- 📚 Full novel with multiple chapters
- 💬 Community comments (anonymous & authenticated)
- 📊 Reading progress sync across devices
- 🎨 Customizable reader settings (theme, font size, spacing)
- 👤 Google OAuth authentication
- 🛡️ Admin moderation dashboard
- 📄 PDF download

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+) or **Yarn**
- **Supabase Account** (free tier works)
- **Google OAuth Credentials** (optional, for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase database**
   
   Run the SQL migrations in your Supabase project:
   ```bash
   # In Supabase SQL Editor, run in order:
   supabase/schema.sql
   supabase/policies.sql
   supabase/seed.sql (optional - test data)
   ```

5. **Run the development server**
   ```bash
   yarn dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (CDN)
- **Backend**: Supabase (PostgreSQL + Authentication + Realtime)
- **Routing**: React Router 7
- **Icons**: Lucide React

### Project Structure

```
/app
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── comments/     # Comment system
│   └── ui/           # Reusable UI components
├── contexts/         # React contexts (Auth)
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API clients
│   ├── api/          # API functions
│   └── supabase.ts   # Supabase client
├── pages/            # Page components
│   └── admin/        # Admin dashboard
├── docs/             # Documentation
├── public/           # Static assets
└── supabase/         # Database migrations
```

---

## 🎯 Features

### 1. Reading Experience
- **Customizable Settings**: Adjust font size, line height, and theme (dark/light/sepia)
- **Progress Tracking**: Automatically saves reading position
- **Chapter Navigation**: Easy sidebar navigation between chapters
- **Responsive Design**: Works beautifully on all devices

### 2. Comment System
- **Anonymous Comments**: Post without creating an account
- **Authenticated Comments**: Sign in to post with your name
- **Real-time Updates**: See new comments instantly
- **Moderation**: Flag inappropriate comments
- **Rate Limiting**: Protection against spam

### 3. Authentication
- **Google OAuth**: One-click sign-in with Google
- **Guest Mode**: Read and comment without signing in
- **Session Persistence**: Stay logged in across sessions
- **Profile Management**: View and manage your profile

### 4. Admin Dashboard
- **Comment Moderation**: Review flagged comments
- **Bulk Actions**: Approve or delete multiple comments
- **User Management**: View user activity
- **Protected Access**: Only accessible to admin users

### 5. Reading Progress Sync
- **Cross-Device Sync**: Continue reading on any device
- **Automatic Saving**: Progress saved every 5 seconds
- **Conflict Resolution**: Smart handling of multiple devices
- **Offline Support**: Falls back to localStorage when offline

---

## 🔧 Configuration

### Feature Flags

Enable or disable features in `.env`:

```env
VITE_ENABLE_COMMENTS=true          # Comment system
VITE_ENABLE_PROGRESS_SYNC=true     # Progress sync
VITE_ENABLE_NEWSLETTER=false       # Newsletter (not implemented)
```

### Admin Setup

To make a user an admin:

1. Sign in with Google
2. Get your user ID from Supabase Dashboard → Authentication → Users
3. Run in Supabase SQL Editor:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret
7. Add to Supabase Dashboard → Authentication → Providers → Google

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd app
vercel

# Add environment variables in Vercel Dashboard
# Deploy to production
vercel --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd app
netlify init
netlify deploy --prod
```

**See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.**

---

## 🧪 Testing

### Manual Testing
1. Test anonymous commenting
2. Test authenticated commenting
3. Test reading progress sync
4. Test admin dashboard
5. Test PDF download
6. Test responsive design

### Automated Testing
*(To be implemented)*

---

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and architecture
- [API Reference](./docs/API_REFERENCE.md) - API endpoints documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Step-by-step deployment
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Environment Setup](./docs/ENVIRONMENT_SETUP.md) - Environment variables guide
- [Integration Guide](./docs/INTEGRATION_GUIDE.md) - Third-party integrations

---

## 🛡️ Security

- **Row Level Security (RLS)**: All database tables protected
- **Rate Limiting**: Protection against spam and abuse
- **Input Validation**: All user input sanitized
- **Secure Authentication**: Handled by Supabase Auth
- **Environment Variables**: Sensitive data never exposed

---

## 🤝 Contributing

This is a personal fan-fiction project. Contributions are not currently accepted.

---

## 📄 License

This is a non-commercial fan-fiction project based on **Stranger Things** created by the Duffer Brothers. All rights to the Stranger Things universe belong to Netflix and the Duffer Brothers.

This project is for entertainment purposes only and is not monetized.

---

## 🆘 Support

Having issues? Check the [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) or review the logs:

- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Check for failed API requests
- **Supabase Dashboard**: Check database and auth logs

---

## 🙏 Acknowledgments

- **Stranger Things**: Created by the Duffer Brothers
- **Supabase**: Backend infrastructure
- **React**: UI framework
- **Tailwind CSS**: Styling framework
- **Lucide**: Icon library

---

<div align="center">

**Made with ❤️ for Stranger Things fans**

[Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)

</div>

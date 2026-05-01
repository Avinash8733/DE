# Deployment Guide for Voice Email System

This project is a full-stack application with a React frontend and a Node.js/Express backend. Follow these steps to deploy it to production.

## Recommended: "All-in-One" Deployment

The simplest way to deploy is to build the frontend and serve it from the backend. This allows you to host everything as a single service on platforms like **Render**, **Heroku**, or a **VPS**.

### 1. Build the Frontend
Navigate to the frontend directory and create a production build:
```bash
cd voice-email-frontend
npm install
npm run build
```
This creates a `build/` folder in `voice-email-frontend`.

### 2. Configure Backend for Production
Ensure your backend `.env` file has the correct production settings:
```env
PORT=5001
NODE_ENV=production
JWT_SECRET=your_secure_random_secret_key
DB_PATH=./database/voice_email.db
```

### 3. Deploy to Render (Example)
1. Push your code to a GitHub repository.
2. Create a new **Web Service** on [Render](https://render.com/).
3. Connect your repository.
4. Set the following configurations:
   - **Root Directory**: `voice-email-backend`
   - **Build Command**: `npm install && cd ../voice-email-frontend && npm install && npm run build`
   - **Start Command**: `npm start`
5. Add your Environment Variables (`JWT_SECRET`, etc.) in the Render dashboard.

## Alternative: Separate Deployment

### Frontend (Vercel/Netlify)
1. Deploy the `voice-email-frontend` directory.
2. Set `REACT_APP_API_URL` to your backend's URL (e.g., `https://your-api.onrender.com/api`).

### Backend (Render/Fly.io)
1. Deploy the `voice-email-backend` directory.
2. Ensure `CORS_ORIGINS` in your backend `.env` includes your frontend URL.

## Database Note
This project uses **SQLite**. When deploying to cloud platforms like Heroku or Render (without a Disk mount), the database file will be reset every time the server restarts.
- For persistence on Render, use a **Persistent Disk**.
- For production-grade data, consider switching to **PostgreSQL** or **MongoDB**.

## Security Checklist
- [ ] Change `JWT_SECRET` to a long, random string.
- [ ] Set `NODE_ENV=production`.
- [ ] Ensure `CORS_ORIGINS` is not set to `*`.
- [ ] Use HTTPS for all connections.

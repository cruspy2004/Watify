## Render Deployment

This project is prepared for a free Render web service using:

- `render.yaml` for service config
- `backend/server.prod.js` for production startup
- `DATABASE_URL` for Supabase Postgres
- a built React frontend served by Express from the same URL

### Required Render environment variables

- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
- `JWT_SECRET=<long-random-secret>`
- `CLIENT_URL=https://<your-render-domain>.onrender.com`
- `FRONTEND_URL=https://<your-render-domain>.onrender.com`
- `ADMIN_NAME=Portfolio Admin`
- `ADMIN_EMAIL=<your-login-email>`
- `ADMIN_PASSWORD=<your-login-password>`
- `WHATSAPP_AUTO_START=true`

### Notes

- The app will run migrations on startup.
- The admin user is seeded on startup from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
- On the free tier, WhatsApp session persistence may be unreliable after redeploys or cold starts.

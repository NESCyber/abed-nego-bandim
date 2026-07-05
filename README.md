# Dr. Abed-Nego Lamangin Bandim — MP Website
### Full-Stack Web Platform · Bunkpurugu Constituency, Ghana

---

## 📁 Project Structure

```
mp-website/
├── frontend/
│   ├── pages/
│   │   ├── index.html            ← Homepage
│   │   ├── about.html            ← About / Biography
│   │   ├── projects.html         ← Development Projects
│   │   ├── news.html             ← News & Updates
│   │   ├── portal.html           ← Constituency Portal (submit issues/requests)
│   │   ├── gallery.html          ← Media Gallery
│   │   ├── contact.html          ← Contact Page
│   │   ├── admin-login.html      ← Admin Login
│   │   ├── dashboard.html        ← Admin Dashboard
│   │   ├── admin-posts.html      ← Admin: Manage Posts
│   │   ├── admin-projects.html   ← Admin: Manage Projects
│   │   ├── admin-messages.html   ← Admin: Manage Messages
│   │   ├── admin-media.html      ← Admin: Media Manager
│   │   └── admin-users.html      ← Admin: Manage Users
│   ├── css/
│   │   ├── style.css             ← Public website styles
│   │   └── admin.css             ← Admin panel styles
│   └── js/
│       ├── main.js               ← Public shared JS + API helper
│       └── admin.js              ← Admin shared JS + auth helper
│
├── backend/
│   ├── server.js                 ← Express app entry point
│   ├── package.json
│   ├── .env.example              ← Environment variable template
│   ├── config/
│   │   └── db.js                 ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js               ← JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js               ← POST /api/auth/login
│   │   ├── posts.js              ← /api/posts (CRUD)
│   │   ├── projects.js           ← /api/projects (CRUD)
│   │   ├── messages.js           ← /api/messages (CRUD)
│   │   ├── media.js              ← /api/media (upload/delete)
│   │   ├── users.js              ← /api/users (admin only)
│   │   └── dashboard.js          ← /api/dashboard/stats
│   └── uploads/                  ← Uploaded media files (auto-created)
│
└── database/
    └── schema.sql                ← MySQL schema + seed data
```

---

## ⚙️ Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript      |
| Backend   | Node.js + Express.js                 |
| Database  | MySQL (via mysql2/promise)           |
| Auth      | JWT (jsonwebtoken) + bcryptjs        |
| Uploads   | Multer (local disk storage)          |
| Security  | express-rate-limit, CORS             |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ installed
- MySQL 8.0+ installed and running
- A code editor (VS Code recommended)

---

### Step 1 — Set up the Database

Open your MySQL client (MySQL Workbench, TablePlus, or terminal):

```sql
SOURCE /path/to/mp-website/database/schema.sql;
```

This creates the `mp_website` database with all tables and sample data.

Default admin login created by the seed:
- **Email:** `admin@bandim-mp.gh`
- **Password:** `Admin@1234`
- ⚠️ **Change this password immediately after first login.**

---

### Step 2 — Configure the Backend

```bash
cd mp-website/backend

# Copy the environment template
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mp_website
JWT_SECRET=some_long_random_secret_string
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

---

### Step 3 — Install & Run the Backend

```bash
cd mp-website/backend
npm install
npm start
```

You should see:
```
✅  MySQL connected successfully
🚀  Server running on http://localhost:3000
📡  API base: http://localhost:3000/api
```

For development with auto-restart:
```bash
npm run dev
```

---

### Step 4 — Open the Frontend

The frontend is plain HTML — no build step needed.

**Option A: VS Code Live Server (recommended)**
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/pages/index.html` → "Open with Live Server"
3. The site opens at `http://127.0.0.1:5500`

**Option B: Any local HTTP server**
```bash
# Python
cd mp-website/frontend/pages
python3 -m http.server 5500

# Or npx
npx serve mp-website/frontend/pages -p 5500
```

---

### Step 5 — Access the Admin Panel

1. Go to: `http://127.0.0.1:5500/admin-login.html`
2. Login with: `admin@bandim-mp.gh` / `Admin@1234`
3. Change your password via Admin Users page

---

## 🔌 API Reference

### Public Endpoints (no auth required)

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/posts`                   | Get published posts (paginated)|
| GET    | `/api/posts/:id`               | Get single post                |
| GET    | `/api/projects`                | Get projects (filter by cat/status)|
| GET    | `/api/projects/:id`            | Get single project             |
| GET    | `/api/media`                   | Get media gallery              |
| POST   | `/api/messages`                | Submit constituency message    |
| POST   | `/api/auth/login`              | Admin login → returns JWT      |

### Protected Endpoints (Bearer token required)

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/posts/admin/all`         | All posts including drafts     |
| POST   | `/api/posts`                   | Create post                    |
| PUT    | `/api/posts/:id`               | Update post                    |
| DELETE | `/api/posts/:id`               | Delete post                    |
| POST   | `/api/projects`                | Create project                 |
| PUT    | `/api/projects/:id`            | Update project                 |
| DELETE | `/api/projects/:id`            | Delete project                 |
| GET    | `/api/messages`                | Get all messages (admin)       |
| GET    | `/api/messages/:id`            | Get single message             |
| PATCH  | `/api/messages/:id/status`     | Update message status          |
| DELETE | `/api/messages/:id`            | Delete message                 |
| POST   | `/api/media`                   | Upload media file              |
| DELETE | `/api/media/:id`               | Delete media file              |
| GET    | `/api/dashboard/stats`         | Dashboard statistics           |
| GET    | `/api/users`                   | List admin users (super_admin) |
| POST   | `/api/users`                   | Create admin user (super_admin)|
| PUT    | `/api/users/:id`               | Update admin user (super_admin)|
| DELETE | `/api/users/:id`               | Delete admin user (super_admin)|

---

## 🔐 Security Notes

1. **Change the default admin password** immediately after setup
2. **Set a strong JWT_SECRET** — use a random 64+ character string
3. **Update ALLOWED_ORIGINS** in `.env` to match your actual domain in production
4. **Never commit `.env`** to version control — it is listed in `.gitignore`
5. For production, run behind **NGINX** as a reverse proxy with HTTPS/SSL

---

## 🌐 Production Deployment Guide

### Recommended Stack
- **Server:** Ubuntu 22.04 VPS (DigitalOcean, Hostinger, etc.)
- **Process manager:** PM2
- **Reverse proxy:** NGINX
- **SSL:** Let's Encrypt (Certbot)
- **Database:** MySQL on same server or managed RDS

### Deploy Backend with PM2

```bash
npm install -g pm2
cd mp-website/backend
pm2 start server.js --name mp-backend
pm2 save
pm2 startup
```

### Serve Frontend with NGINX

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Public website
    root /var/www/mp-website/frontend/pages;
    index index.html;
    try_files $uri $uri/ /index.html;

    # Proxy API calls to Node backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/mp-website/backend/uploads/;
    }
}
```

---

## 📱 Mobile Optimisation

The frontend is built **mobile-first** with:
- Responsive CSS Grid and Flexbox layouts
- Hamburger navigation menu for small screens
- Touch-friendly button sizes (min 44px tap targets)
- Lazy loading images (`loading="lazy"`)
- Minimal CSS (no heavy frameworks) for fast loading on slow connections

---

## 🗂️ Database Tables

| Table      | Purpose                              |
|------------|--------------------------------------|
| `users`    | Admin panel accounts                 |
| `posts`    | News & update blog posts             |
| `projects` | Development project records          |
| `messages` | Constituency portal submissions      |
| `media`    | Uploaded images and videos           |

---

## 📞 Support

For technical issues, contact the website administrator or developer.

For constituency matters, visit the **Constituency Portal** on the website.

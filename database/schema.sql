-- ============================================================
-- Dr. Abed-Nego Lamangin Bandim MP Website — Database Schema
-- MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS mp_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mp_website;

-- ─────────────────────────────────────────
-- USERS (Admin panel accounts)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,   -- bcrypt hashed
  role         ENUM('super_admin', 'editor') NOT NULL DEFAULT 'editor',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- POSTS (News / Updates)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(300) NOT NULL,
  content      LONGTEXT NOT NULL,
  image_url    VARCHAR(500),
  status       ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  author_id    INT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_posts_status_created (status, created_at)
);

-- ─────────────────────────────────────────
-- PROJECTS (Development / Impact)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(300) NOT NULL,
  description  TEXT NOT NULL,
  category     ENUM('health', 'education', 'infrastructure', 'ict', 'other') NOT NULL DEFAULT 'other',
  location     VARCHAR(300),
  latitude     DECIMAL(10, 8) NULL,
  longitude    DECIMAL(11, 8) NULL,
  status       ENUM('planned', 'ongoing', 'completed') NOT NULL DEFAULT 'planned',
  image_url    VARCHAR(500),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_status (status),
  INDEX idx_projects_category (category)
);

-- ─────────────────────────────────────────
-- MESSAGES (Constituency Portal submissions)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  contact      VARCHAR(255) NOT NULL,   -- phone or email
  category     ENUM('report_issue', 'request_support', 'suggest_idea', 'general') NOT NULL DEFAULT 'general',
  message      TEXT NOT NULL,
  file_url     VARCHAR(500) NULL,
  status       ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_messages_status (status),
  INDEX idx_messages_category (category),
  INDEX idx_messages_created_at (created_at)
);

-- ─────────────────────────────────────────
-- MEDIA (Gallery)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  file_url     VARCHAR(500) NOT NULL,
  type         ENUM('image', 'video') NOT NULL DEFAULT 'image',
  caption      VARCHAR(300),
  uploaded_by  INT,
  uploaded_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- NEWSLETTER SUBSCRIBERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL UNIQUE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- SEED DATA — Default super admin
-- Password: Admin@1234  (change immediately after first login)
-- ─────────────────────────────────────────
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'admin@bandim-mp.gh',
 '$2b$12$KIX/W7W3FSmIZZlVDDTdROq5Y9J.YxkHGUCCqWxrN4VB7cRSuTt6.',
 'super_admin');

-- Sample projects
INSERT INTO projects (title, description, category, location, latitude, longitude, status) VALUES
('Bunkpurugu District Hospital Renovation',
 'Full renovation of the main district hospital including new maternity ward, pharmacy, and medical equipment.',
 'health', 'Bunkpurugu Town', 9.9754, -0.2798, 'ongoing'),
('Community Senior High School ICT Lab',
 'Installation of 40-computer ICT laboratory with internet connectivity for students.',
 'ict', 'Bunkpurugu SHS', 9.9701, -0.2825, 'completed'),
('Rural Feeder Road Construction — Nakpayili',
 'Construction of 12km feeder road connecting Nakpayili to the main highway.',
 'infrastructure', 'Nakpayili', 9.8941, -0.2201, 'ongoing'),
('WASH Programme — Borehole Installation',
 'Installation of 15 boreholes across underserved communities to provide clean drinking water.',
 'health', 'Various Communities', 9.9610, -0.2650, 'completed'),
('Youth Skills Training Centre',
 'Establishment of vocational and skills training centre for youth aged 18–35.',
 'education', 'Bunkpurugu Town', 9.9780, -0.2900, 'planned');

-- Sample posts
INSERT INTO posts (title, content, status, author_id) VALUES
('MP Commissions New ICT Lab at Bunkpurugu SHS',
 'The Member of Parliament for Bunkpurugu Constituency, Dr. Abed-Nego Lamangin Bandim, has commissioned a brand new ICT laboratory at Bunkpurugu Senior High School. The facility, equipped with 40 computers and reliable internet access, will benefit over 800 students annually. Speaking at the commissioning ceremony, Dr. Bandim emphasised the importance of digital literacy for the youth of Bunkpurugu.',
 'published', 1),
('Road Construction Update: Nakpayili Feeder Road Progress',
 'Work on the Nakpayili feeder road is progressing steadily. Contractors have completed 7 of the 12 kilometres. The road, when completed, will significantly reduce travel time and improve access to markets for farmers in the area.',
 'published', 1),
('District Hospital Renovation Begins',
 'The long-awaited renovation of the Bunkpurugu District Hospital has officially commenced. The project, funded through the MP''s Common Fund and government support, will include a new maternity ward, upgraded pharmacy, and modern medical equipment.',
 'published', 1);

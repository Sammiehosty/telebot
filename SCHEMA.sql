-- MySQL Database Schema for TeleBot Manager

CREATE DATABASE IF NOT EXISTS telebot_db;
USE telebot_db;

-- 1. Bot Configuration Table
CREATE TABLE IF NOT EXISTS bot_config (
    id INT PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    bot_name VARCHAR(100) DEFAULT 'TeleNode',
    channel_id VARCHAR(100),
    admin_telegram_id VARCHAR(50),
    welcome_message TEXT,
    success_message TEXT,
    no_message TEXT,
    channel_link VARCHAR(255),
    success_link VARCHAR(255),
    status ENUM('online', 'offline') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. App Users (Admins) Table
CREATE TABLE IF NOT EXISTS app_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'moderator') DEFAULT 'admin',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscribers (Telegram Users) Table
CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status ENUM('active', 'blocked') DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Broadcast History Table
CREATE TABLE IF NOT EXISTS broadcast_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_text TEXT,
    media_url VARCHAR(255),
    media_type VARCHAR(50),
    target_count INT DEFAULT 0,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Messages (Conversations) Table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id VARCHAR(50) NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    message_text TEXT,
    media_url VARCHAR(255),
    media_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    p256dh VARCHAR(255),
    auth VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Admin (Password: admin123 - should be hashed in production)
INSERT INTO app_users (username, password_hash, role) 
VALUES ('admin', 'admin123', 'admin');

-- Initial Bot Config
INSERT IGNORE INTO bot_config (id, bot_token, bot_name, welcome_message, success_message, no_message, channel_link, success_link) 
VALUES (1, '8418339543:AAEtlWmjk7qFeyp3kdu-8xpqX4yrilCfueA', 'TeleNode Bot', 'Are you ready to earn watching ads?', 'Goto www.youtube.com and get started', 'OK. You can also check our telegram group for updates', 'https://t.me/yourchannel', 'https://www.youtube.com');

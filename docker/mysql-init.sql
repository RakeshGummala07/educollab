-- EduCollab Database Initialization
CREATE DATABASE IF NOT EXISTS educollab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE educollab;

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON educollab.* TO 'educollab'@'%';
FLUSH PRIVILEGES;

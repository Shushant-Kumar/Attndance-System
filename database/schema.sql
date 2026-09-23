-- ============================================================
-- AI-Based Smart Attendance System - Database Schema (MySQL 8+)
-- ============================================================
CREATE DATABASE IF NOT EXISTS attendance_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendance_system;

-- ------------------------------------------------------------
-- Table: admins  (teachers / administrators who log in)
-- ------------------------------------------------------------
CREATE TABLE admins (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            ENUM('admin','teacher') NOT NULL DEFAULT 'teacher',
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: students
-- ------------------------------------------------------------
CREATE TABLE students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    roll_number     VARCHAR(50)   NOT NULL UNIQUE,
    full_name       VARCHAR(100)  NOT NULL,
    department      VARCHAR(100)  NOT NULL,
    year            VARCHAR(20)   NOT NULL,
    section         VARCHAR(10)   NOT NULL,
    email           VARCHAR(150)  NULL,
    phone           VARCHAR(20)   NULL,
    photo_path      VARCHAR(255)  NULL,          -- profile/reference photo
    face_encoding   LONGTEXT      NULL,           -- JSON array of averaged 128-d encoding
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dept_year_section (department, year, section)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: face_dataset  (individual captured images + encodings
--                       used to build each student's face profile)
-- ------------------------------------------------------------
CREATE TABLE face_dataset (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    image_path      VARCHAR(255) NOT NULL,
    encoding        LONGTEXT NOT NULL,             -- JSON array, 128-d face encoding
    capture_index   INT NOT NULL,                  -- 1..30
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: attendance
-- ------------------------------------------------------------
CREATE TABLE attendance (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    date            DATE NOT NULL,
    time            TIME NOT NULL,
    status          ENUM('Present','Absent') NOT NULL DEFAULT 'Present',
    confidence      FLOAT NULL,                    -- recognition confidence score
    marked_by       ENUM('AI','Manual') NOT NULL DEFAULT 'AI',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_student_date (student_id, date),   -- prevents duplicate marking
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: logs  (system / security audit log)
-- ------------------------------------------------------------
CREATE TABLE logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    admin_id        INT NULL,
    action          VARCHAR(255) NOT NULL,          -- e.g. 'LOGIN', 'STUDENT_CREATE'
    details         TEXT NULL,
    ip_address      VARCHAR(45) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed: default admin (password = "Admin@123", hashed via bcrypt
-- at application startup script — see backend/app/seed.py)
-- ------------------------------------------------------------

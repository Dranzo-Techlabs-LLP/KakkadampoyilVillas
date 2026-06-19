-- Kakkadampoyil Villas — Admin panel schema (MySQL 8)
-- Run once:  mysql -h 167.86.105.17 -u <DB_USER> -p villas < src/admin-schema.sql
-- Idempotent-ish: uses CREATE TABLE IF NOT EXISTS + INSERT IGNORE seeds.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ───────────────────────────────── roles & permissions
CREATE TABLE IF NOT EXISTS roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  is_system   TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  `key`     VARCHAR(80) NOT NULL UNIQUE,
  label     VARCHAR(120) NOT NULL,
  category  VARCHAR(60) NOT NULL DEFAULT 'General'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id       INT NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── villas
CREATE TABLE IF NOT EXISTS villas (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  slug       VARCHAR(60) NOT NULL UNIQUE,
  name       VARCHAR(120) NOT NULL,
  capacity   INT NOT NULL DEFAULT 0,
  bedrooms   INT NOT NULL DEFAULT 0,
  base_rate  DECIMAL(10,2) NOT NULL DEFAULT 0,
  color      VARCHAR(16) NOT NULL DEFAULT '#1F4D2B',
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── bookings
CREATE TABLE IF NOT EXISTS bookings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  reference     VARCHAR(20) NOT NULL UNIQUE,
  villa_id      INT NOT NULL,
  guest_name    VARCHAR(150) NOT NULL,
  guest_phone   VARCHAR(40) DEFAULT NULL,
  guest_phone2  VARCHAR(40) DEFAULT NULL,
  guest_email   VARCHAR(190) DEFAULT NULL,
  check_in      DATE NOT NULL,
  check_out     DATE NOT NULL,
  adults        INT NOT NULL DEFAULT 1,
  children      INT NOT NULL DEFAULT 0,
  status        ENUM('enquiry','confirmed','checked_in','completed','cancelled') NOT NULL DEFAULT 'enquiry',
  total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  source        VARCHAR(60) DEFAULT 'direct',
  notes         TEXT DEFAULT NULL,
  cancel_reason VARCHAR(255) DEFAULT NULL,
  created_by    INT DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (villa_id)   REFERENCES villas(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_villa_dates (villa_id, check_in, check_out),
  INDEX idx_status (status),
  INDEX idx_check_in (check_in)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── payments (payments + refunds)
CREATE TABLE IF NOT EXISTS payments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  kind       ENUM('payment','refund') NOT NULL DEFAULT 'payment',
  amount     DECIMAL(10,2) NOT NULL,
  method     VARCHAR(40) NOT NULL DEFAULT 'cash',
  reference  VARCHAR(120) DEFAULT NULL,
  note       VARCHAR(255) DEFAULT NULL,
  paid_on    DATE NOT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── expenses
CREATE TABLE IF NOT EXISTS expenses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  villa_id    INT DEFAULT NULL,
  category    VARCHAR(60) NOT NULL DEFAULT 'General',
  amount      DECIMAL(10,2) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  spent_on    DATE NOT NULL,
  created_by  INT DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (villa_id)   REFERENCES villas(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_villa (villa_id),
  INDEX idx_spent_on (spent_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT DEFAULT NULL,
  action     VARCHAR(80) NOT NULL,
  entity     VARCHAR(60) NOT NULL,
  entity_id  INT DEFAULT NULL,
  detail     TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────────────────────────────── seed permissions
INSERT IGNORE INTO permissions (`key`, label, category) VALUES
  ('dashboard.view',   'View dashboard',          'Dashboard'),
  ('calendar.view',    'View booking calendar',   'Calendar'),
  ('bookings.view',    'View bookings',           'Bookings'),
  ('bookings.manage',  'Create / edit bookings',  'Bookings'),
  ('bookings.cancel',  'Cancel bookings',         'Bookings'),
  ('payments.view',    'View payments',           'Accounting'),
  ('payments.manage',  'Record payments / refunds','Accounting'),
  ('expenses.view',    'View expenses',           'Accounting'),
  ('expenses.manage',  'Add / edit expenses',     'Accounting'),
  ('accounting.view',  'View revenue & accounting','Accounting'),
  ('reports.view',     'View & export reports',   'Reports'),
  ('villas.view',      'View villas',             'Villas'),
  ('villas.manage',    'Edit villa settings',     'Villas'),
  ('users.view',       'View users',              'Administration'),
  ('users.manage',     'Add / edit users & rights','Administration');

-- ───────────────────────────────── seed roles
INSERT IGNORE INTO roles (name, description, is_system) VALUES
  ('Administrator', 'Full access to every feature', 1),
  ('Manager',       'Bookings, calendar, accounting & reports', 1),
  ('Front Desk',    'Bookings & calendar only', 1);

-- Administrator → all permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Administrator';

-- Manager → everything except user administration & villa edit
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.`key` IN ('dashboard.view','calendar.view','bookings.view','bookings.manage',
                 'bookings.cancel','payments.view','payments.manage','expenses.view',
                 'expenses.manage','accounting.view','reports.view','villas.view')
WHERE r.name = 'Manager';

-- Front Desk → bookings + calendar only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
  ON p.`key` IN ('dashboard.view','calendar.view','bookings.view','bookings.manage')
WHERE r.name = 'Front Desk';

-- ───────────────────────────────── seed villas
INSERT IGNORE INTO villas (slug, name, capacity, bedrooms, base_rate, color) VALUES
  ('lux-villa',     'Lux Villa',     9, 3, 0, '#1F4D2B'),
  ('fortune-villa', 'Fortune Villa', 9, 3, 0, '#6B4226'),
  ('munnas-villa',  'Munnas Villa', 18, 3, 0, '#C99B5C');

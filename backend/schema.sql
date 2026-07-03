CREATE DATABASE IF NOT EXISTS blacksushi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE blacksushi;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(120) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(120) NOT NULL,
  description TEXT NULL,
  price INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  ingredients JSON NULL,
  allows_notes TINYINT(1) NOT NULL DEFAULT 0,
  allows_protein_change TINYINT(1) NOT NULL DEFAULT 0,
  available_extras JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS extras (
  id VARCHAR(120) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  price INT NOT NULL,
  type ENUM('extra', 'proteinChange') NOT NULL DEFAULT 'extra',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables_config (
  id INT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(120) PRIMARY KEY,
  total INT NOT NULL,
  order_type ENUM('local', 'retiro', 'delivery') NOT NULL,
  order_channel ENUM('mesa', 'retiro', 'delivery', 'uber_eats', 'pedidos_ya', 'rappi') NOT NULL,
  delivery_fee INT NULL DEFAULT 0,
  chopsticks_count INT NULL DEFAULT 0,
  table_number INT NULL,
  customer_name VARCHAR(180) NULL,
  status ENUM('pendiente', 'en_preparacion', 'listo', 'entregado') NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  uid VARCHAR(120) PRIMARY KEY,
  order_id VARCHAR(120) NOT NULL,
  product_id VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  quantity INT NOT NULL,
  unit_price INT NOT NULL,
  subtotal INT NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_item_extras (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_item_uid VARCHAR(120) NOT NULL,
  extra_id VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  price INT NOT NULL,
  type ENUM('extra', 'proteinChange') NOT NULL DEFAULT 'extra',
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_item_extras_item
    FOREIGN KEY (order_item_uid) REFERENCES order_items(uid)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_item_sauces (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_item_uid VARCHAR(120) NOT NULL,
  name ENUM('Soya', 'Agridulce', 'Acevichada') NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_item_sauces_item
    FOREIGN KEY (order_item_uid) REFERENCES order_items(uid)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  amount INT NOT NULL,
  notes TEXT NULL,
  expense_date DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

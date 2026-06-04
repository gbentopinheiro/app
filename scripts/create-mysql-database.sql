CREATE DATABASE IF NOT EXISTS bentix_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'bentix_app'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON bentix_app.* TO 'bentix_app'@'localhost';
FLUSH PRIVILEGES;

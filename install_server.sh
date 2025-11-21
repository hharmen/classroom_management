#!/bin/bash

set -e

echo "=== Установка сервера управления ==="

if [ "$EUID" -ne 0 ]; then
    echo "Ошибка: запустите как root."
    exit 1
fi

echo "Обновляю пакеты..."
apt update -y

echo "Устанавливаю ansible и sqlite..."
apt install -y ansible sqlite3

echo ""

APP_NAME="myserver"
APP_DIR="/opt/$APP_NAME"
DB_FILE="$APP_DIR/computers.db"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"

echo ">>> Установка сервиса $APP_NAME"

# --- 1. Создаём каталог приложения ---
echo ">>> Создаю директорию $APP_DIR"
sudo mkdir -p "$APP_DIR"

# --- 2. Копируем бинарник сервера ---
if [ ! -f "./server" ]; then
    echo "Ошибка: бинарник 'server' не найден рядом с install.sh!"
    exit 1
fi

echo ">>> Копирую бинарник в $APP_DIR"
sudo cp ./server "$APP_DIR/server"
sudo chmod +x "$APP_DIR/server"

if [ ! -d "./ansible" ]; then
    echo "Ошибка: папка 'ansible' не найдена рядом с install.sh"
    exit 1
else
    echo ">>> Копирую папку ansible в $APP_DIR"
    sudo cp -r ./ansible "$APP_DIR/ansible"
fi


# --- 3. Создаём SQLite базу ---
echo ">>> Создаю базу данных $DB_FILE"
sudo bash -c "cat > $APP_DIR/install_db.sql" <<EOF
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS computers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    room_name TEXT,
    computer_name TEXT,
    ip TEXT,
    last_seen DATETIME,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_computer_unique
ON computers (room_id, computer_name);
EOF

sudo sqlite3 "$DB_FILE" < "$APP_DIR/install_db.sql"

echo ">>> База данных создана."

# --- 4. Создаём systemd-сервис ---
echo ">>> Создаю systemd сервис $SERVICE_FILE"

sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=$APP_NAME Service
After=network.target

[Service]
Type=simple
ExecStart=$APP_DIR/server
WorkingDirectory=$APP_DIR
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# --- 5. Активируем сервис ---
echo ">>> Активирую systemd"
sudo systemctl daemon-reload
sudo systemctl enable "$APP_NAME"
sudo systemctl restart "$APP_NAME"

echo ">>> Установка завершена!"

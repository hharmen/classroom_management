

echo "=== Установка агента ==="


read -p "Введите RoomID: " ROOM_ID
read -p "Введите ComputerID: " COMPUTER_ID
read -p "Введите Ip сервера: " SERVER_URL
read -p "Введите Port для подключения к серверу: " SERVER_PORT



if [ ! -f ./computer-agent.go ]; then
    echo "❌ Файл 'computer-agent.go' не найден!"
    exit 1
fi

go build ./computer-agent.go

sudo mkdir -p /etc/computer-agent
sudo mkdir -p /var/log/computer-agent


sudo bash -c "cat > /etc/computer-agent/config.json" <<EOF
{
    "room_id": "$ROOM_ID",
    "computer_id": "$COMPUTER_ID",
    "server_url": "$SERVER_URL",
    "server_port": "$SERVER_PORT"
}
EOF

echo "Создан: /etc/computer-agent/config.json"


sudo cp -f computer-agent /usr/local/bin/computer-agent
sudo chmod +x /usr/local/bin/computer-agent


sudo bash -c "cat > /etc/systemd/system/computer-agent.service" <<EOF
[Unit]
Description=Classroom Computer Agent
After=network-online.target

[Service]
ExecStart=/usr/local/bin/computer-agent
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF


sudo systemctl daemon-reload
sudo systemctl enable computer-agent
sudo systemctl restart computer-agent

echo "Все логи по адресу /var/log/computer-agent/agent.log"
echo "=== Агент установлен и запущен ==="

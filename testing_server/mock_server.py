from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)

TEST_DATA_FILE = 'test_data.json'

@app.route('/get_rooms', methods=['GET'])
def get_rooms():
    data = [
        {
            "id": 1,
            "name": "Комната A",
            "code": "A123",
            "expanded": False,
            "computers": [
                {
                    "id": 101,
                    "name": "PC-A1",
                    "ip": "192.168.0.101",
                    "status": "online",
                    "expanded": False,
                    "lastActive": "2025-11-20 16:00",
                    "files": [
                        {
                            "name": "Документ.pdf",
                            "type": "PDF документ",
                            "size": "1.2MB",
                            "status": "uploaded"
                        }
                    ]
                },
                {
                    "id": 102,
                    "name": "PC-A2",
                    "ip": "192.168.0.102",
                    "status": "online",
                    "expanded": False,
                    "lastActive": "2025-11-19 12:00",
                    "files": []
                }
            ]
        },
        {
            "id": 2,
            "name": "Комната B",
            "code": "B456",
            "expanded": False,
            "computers": [
                {
                    "id": 201,
                    "name": "PC-B1",
                    "ip": "192.168.0.201",
                    "status": "online",
                    "expanded": False,
                    "lastActive": "2025-11-20 15:45",
                    "files": []
                }
            ]
        }
    ]
    
    return jsonify(data), 200

@app.route('/get_apps', methods=['GET'])
def get_apps():
    data = [
        {
            "id": 1,
            "name": "Notepad++",
            "version": "8.5",
            "description": "Текстовый редактор для программистов",
            "size": "5 MB",
            "icon": "fas fa-file-alt",
            "selected": False
        },
        {
            "id": 2,
            "name": "VLC Media Player",
            "version": "3.0.18",
            "description": "Медиа-плеер с поддержкой всех форматов",
            "size": "40 MB",
            "icon": "fas fa-play-circle",
            "selected": False
        },
        {
            "id": 3,
            "name": "Google Chrome",
            "version": "118.0",
            "description": "Браузер от Google",
            "size": "120 MB",
            "icon": "fab fa-chrome",
            "selected": False
        },
        {
            "id": 4,
            "name": "7-Zip",
            "version": "23.01",
            "description": "Архиватор с высокой степенью сжатия",
            "size": "2 MB",
            "icon": "fas fa-file-archive",
            "selected": False
        },
        {
            "id": 5,
            "name": "Adobe Reader",
            "version": "2023.006",
            "description": "Программа для просмотра PDF файлов",
            "size": "350 MB",
            "icon": "fas fa-file-pdf",
            "selected": False
        },
        {
            "id": 6,
            "name": "Telegram",
            "version": "4.11",
            "description": "Мессенджер с облачным хранением",
            "size": "80 MB",
            "icon": "fab fa-telegram",
            "selected": False
        },
        {
            "id": 7,
            "name": "Zoom",
            "version": "5.17.11",
            "description": "Видеоконференции и онлайн встречи",
            "size": "200 MB",
            "icon": "fas fa-video",
            "selected": False
        },
        {
            "id": 8,
            "name": "WinRAR",
            "version": "6.24",
            "description": "Архиватор с поддержкой RAR формата",
            "size": "4 MB",
            "icon": "fas fa-compress-alt",
            "selected": False
        },
        {
            "id": 9,
            "name": "Visual Studio Code",
            "version": "1.84",
            "description": "Редактор кода от Microsoft",
            "size": "85 MB",
            "icon": "fas fa-code",
            "selected": False
        }
    ]

    return jsonify(data), 200

@app.route('/receive_selected', methods=['POST'])
def receive_selected():
    data = request.get_json()

    try:
        with open(TEST_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        computers_count = len(data.get('computers', []))
        apps_count = len(data.get('apps', []))
        
    except Exception as e:
        return jsonify({"error": f"Не удалось сохранить данные: {e}"}), 500

    return jsonify({
        "message": "Данные получены удалённым сервером",
        "saved_to_file": TEST_DATA_FILE,
        "computers_count": len(data.get('computers', [])),
        "apps_count": len(data.get('apps', []))
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "server": "mock_server",
        "endpoints": {
            "/get_rooms": "GET - получить список комнат",
            "/get_apps": "GET - получить список приложений",
            "/receive_selected": "POST - принять selected.json",
            "/health": "GET - проверка статуса"
        }
    }), 200

@app.route('/update_apps', methods=['POST'])
def update_apps():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Нет данных"}), 400
    
    try:
        with open('server_apps.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        pass
    
    return jsonify({
        "message": f"Список приложений обновлен ({len(data)} приложений)",
        "status": "success"
    }), 200

@app.route('/update_rooms', methods=['POST'])
def update_rooms():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Нет данных"}), 400
    
    try:
        with open('server_rooms.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        pass
    
    return jsonify({
        "message": f"Список комнат обновлен ({len(data)} комнат)",
        "status": "success"
    }), 200

if __name__ == '__main__':
    print("mock_server запущен на http://127.0.0.2:6000")
    app.run(host='127.0.0.2', port=6000, debug=True)
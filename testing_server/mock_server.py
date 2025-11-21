from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)

TEST_DATA_FILE = 'test_data.json'

# ---------------------------
#   1. ОТДАТЬ ДАННЫЕ rooms.json
# ---------------------------

@app.route('/get_rooms', methods=['GET'])
def get_rooms():
    """
    Этот метод возвращает данные комнат.
    Формат строго соответствует rooms.json, который ты используешь в проекте.
    """

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
                    "status": "offline",
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
                    "files": [
                    ]
                }
            ]
        }
    ]

    print("➡ Отправлены данные rooms.json клиенту")
    return jsonify(data), 200


# ---------------------------
#   2. ПРИНЯТЬ selected.json И СОХРАНИТЬ В test_data.json
# ---------------------------

@app.route('/receive_selected', methods=['POST'])
def receive_selected():
    """
    Этот метод принимает данные selected.json и сохраняет их в test_data.json
    """

    data = request.get_json()

    print("\n📥 ПОЛУЧЕНЫ selected.json от клиента:")
    print(json.dumps(data, ensure_ascii=False, indent=2))

    # СОХРАНЯЕМ ДАННЫЕ В ФАЙЛ ДЛЯ ПРОВЕРКИ
    try:
        with open(TEST_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Данные успешно сохранены в {TEST_DATA_FILE}")
        
        # Выводим информацию о сохраненных данных
        computers_count = len(data.get('computers', []))
        apps_count = len(data.get('apps', []))
        print(f"📊 Сохранено: {computers_count} компьютеров, {apps_count} приложений")
        
    except Exception as e:
        print(f"❌ Ошибка сохранения в {TEST_DATA_FILE}: {e}")
        return jsonify({"error": f"Не удалось сохранить данные: {e}"}), 500

    return jsonify({
        "message": "Данные получены удалённым сервером",
        "saved_to_file": TEST_DATA_FILE,
        "computers_count": len(data.get('computers', [])),
        "apps_count": len(data.get('apps', []))
    }), 200


# ---------------------------
#   3. Запуск сервера
# ---------------------------

if __name__ == '__main__':
    print("🚀 mock_server запущен на http://127.0.0.2:6000")
    print("📁 Полученные данные будут сохраняться в test_data.json")
    print("\nОжидание запросов...\n")
    app.run(host='127.0.0.2', port=6000, debug=True)
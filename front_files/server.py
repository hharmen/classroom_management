from flask import Flask, request, jsonify, send_from_directory
import json
import os
import requests

app = Flask(__name__, static_folder='.', static_url_path='')

ROOMS_FILE = 'rooms.json'
APPS_FILE = 'apps.json'
SELECTED_FILE = 'selected.json'

# 🔥 КОНФИГУРИРУЕМЫЙ АДРЕС УДАЛЕННОГО СЕРВЕРА
# Можете изменить этот адрес на любой другой
REMOTE_SERVER_URL = "http://127.0.0.2:6000"  # Измените на нужный IP/адрес
# Примеры:
# REMOTE_SERVER_URL = "http://192.168.1.100:6000"
# REMOTE_SERVER_URL = "http://example.com:6000"
# REMOTE_SERVER_URL = "http://10.0.0.5:6000"


# --------------------------
#  СТАТИЧЕСКИЕ ФАЙЛЫ
# --------------------------

@app.route('/')
def index():
    return send_from_directory('.', 'Art.html')


@app.route('/art2')
def art2():
    return send_from_directory('.', 'Art2.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


# --------------------------
#  API: rooms.json
# --------------------------

@app.route('/rooms', methods=['GET'])
def get_rooms():
    if not os.path.exists(ROOMS_FILE):
        return jsonify([])

    with open(ROOMS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)


# 🔥 НОВЫЙ МАРШРУТ — ОБНОВЛЕНИЕ rooms.json ЛОКАЛЬНО
@app.route('/update_rooms', methods=['POST'])
def update_rooms():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Нет данных"}), 400

    with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify({"message": "rooms.json обновлён"}), 200


# --------------------------
#  API: selected.json
# --------------------------

@app.route('/save_selected', methods=['POST'])
def save_selected():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Нет данных"}), 400

    # Сохраняем локально
    with open(SELECTED_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 🔥 ОТПРАВЛЯЕМ ДАННЫЕ НА УДАЛЕННЫЙ СЕРВЕР
    try:
        print(f"📤 Отправка данных на удаленный сервер: {REMOTE_SERVER_URL}")
        response = requests.post(
            f'{REMOTE_SERVER_URL}/receive_selected', 
            json=data,
            timeout=10
        )
        response.raise_for_status()
        
        remote_result = response.json()
        print(f"✅ Данные успешно отправлены на удаленный сервер: {remote_result.get('message', '')}")
        
        return jsonify({
            "message": "selected.json сохранён и отправлен на удаленный сервер",
            "remote_response": remote_result,
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Не удалось подключиться к удаленному серверу {REMOTE_SERVER_URL}"
        print(f"❌ {error_msg}")
        return jsonify({
            "message": "selected.json сохранён локально, но не отправлен на удаленный сервер",
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 200
    except Exception as e:
        error_msg = f"Ошибка отправки на удаленный сервер {REMOTE_SERVER_URL}: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({
            "message": "selected.json сохранён локально, но ошибка отправки на удаленный сервер",
            "error": str(e),
            "remote_server": REMOTE_SERVER_URL
        }), 200


# --------------------------
#  🔥 МАРШРУТ: Синхронизация через proxy
# --------------------------

@app.route('/sync_rooms', methods=['GET', 'POST'])
def sync_rooms():
    """Прокси для синхронизации с удаленным сервером"""
    try:
        print(f"🔄 Синхронизация с удаленным сервером: {REMOTE_SERVER_URL}")
        
        # Получаем данные с удаленного сервера
        response = requests.get(f'{REMOTE_SERVER_URL}/get_rooms', timeout=10)
        response.raise_for_status()
        remote_data = response.json()
        
        print(f"✅ Получены данные с удаленного сервера: {len(remote_data)} комнат")
        
        # Сохраняем локально
        with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(remote_data, f, ensure_ascii=False, indent=2)
            
        print("✅ Данные успешно сохранены в rooms.json")
        
        return jsonify({
            "message": f"Данные успешно синхронизированы. Получено {len(remote_data)} комнат",
            "rooms_count": len(remote_data),
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Не удалось подключиться к удаленному серверу {REMOTE_SERVER_URL}. Убедитесь, что сервер запущен."
        print(f"❌ {error_msg}")
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500
    except requests.exceptions.Timeout:
        error_msg = f"Таймаут подключения к удаленному серверу {REMOTE_SERVER_URL}."
        print(f"❌ {error_msg}")
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500
    except Exception as e:
        error_msg = f"Ошибка синхронизации с {REMOTE_SERVER_URL}: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500


# --------------------------
#  🔥 МАРШРУТ: Отправка selected.json через proxy
# --------------------------

@app.route('/sync_selected', methods=['POST'])
def sync_selected():
    """Прокси для отправки selected.json на удаленный сервер"""
    try:
        print(f"📤 Отправка selected.json на удаленный сервер: {REMOTE_SERVER_URL}")
        
        # Читаем локальный selected.json
        if not os.path.exists(SELECTED_FILE):
            return jsonify({"error": "selected.json не найден"}), 404
            
        with open(SELECTED_FILE, 'r', encoding='utf-8') as f:
            selected_data = json.load(f)
        
        # Отправляем на удаленный сервер
        response = requests.post(
            f'{REMOTE_SERVER_URL}/receive_selected', 
            json=selected_data,
            timeout=10
        )
        response.raise_for_status()
        
        remote_result = response.json()
        print(f"✅ selected.json успешно отправлен на удаленный сервер {REMOTE_SERVER_URL}")
        
        return jsonify({
            "message": "selected.json успешно отправлен на удаленный сервер",
            "remote_response": remote_result,
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except Exception as e:
        error_msg = f"Ошибка отправки selected.json на {REMOTE_SERVER_URL}: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500


# --------------------------
#  🔥 МАРШРУТ: Информация о конфигурации
# --------------------------

@app.route('/server_info', methods=['GET'])
def server_info():
    """Возвращает информацию о настройках сервера"""
    return jsonify({
        "local_server": "http://localhost:5000",
        "remote_server": REMOTE_SERVER_URL,
        "endpoints": {
            "sync_rooms": "/sync_rooms",
            "sync_selected": "/sync_selected", 
            "save_selected": "/save_selected",
            "get_rooms": "/rooms"
        }
    }), 200


# --------------------------
#  Запуск сервера
# --------------------------

if __name__ == '__main__':
    print("🚀 Основной сервер запущен на http://localhost:5000")
    print(f"📡 Удаленный сервер: {REMOTE_SERVER_URL}")
    print("\n🔧 Чтобы изменить адрес удаленного сервера, отредактируйте переменную REMOTE_SERVER_URL в server.py")
    print("\n📡 Доступные методы:")
    print("   GET  /server_info     - информация о настройках сервера")
    print("   POST /sync_rooms      - синхронизация комнат с удаленным сервером")
    print("   POST /sync_selected   - отправка selected.json на удаленный сервер")
    print("   POST /save_selected   - сохраняет локально И отправляет на удаленный сервер")
    print("\nПримеры адресов для REMOTE_SERVER_URL:")
    print("   http://127.0.0.1:6000")
    print("   http://192.168.1.100:6000") 
    print("   http://10.0.0.5:6000")
    print("   http://example.com:6000")
    app.run(port=5000, debug=True)
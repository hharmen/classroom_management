from flask import Flask, request, jsonify, send_from_directory
import json
import os
import requests  # Добавлен импорт requests

app = Flask(__name__, static_folder='.', static_url_path='')

ROOMS_FILE = 'rooms.json'
APPS_FILE = 'apps.json'
SELECTED_FILE = 'selected.json'

REMOTE_SERVER_URL = "http://127.0.0.1:6000"  # URL mock сервера


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
        print("📤 Отправка данных на удаленный сервер...")
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
            "remote_response": remote_result
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = "Не удалось подключиться к удаленному серверу"
        print(f"❌ {error_msg}")
        return jsonify({
            "message": "selected.json сохранён локально, но не отправлен на удаленный сервер",
            "error": error_msg
        }), 200
    except Exception as e:
        error_msg = f"Ошибка отправки на удаленный сервер: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({
            "message": "selected.json сохранён локально, но ошибка отправки на удаленный сервер",
            "error": str(e)
        }), 200


# --------------------------
#  🔥 МАРШРУТ: Синхронизация через proxy
# --------------------------

@app.route('/sync_rooms', methods=['GET', 'POST'])
def sync_rooms():
    """Прокси для синхронизации с удаленным сервером"""
    try:
        print("🔄 Синхронизация с удаленным сервером...")
        
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
            "rooms_count": len(remote_data)
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = "Не удалось подключиться к удаленному серверу. Убедитесь, что mock_server.py запущен на порту 6000."
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500
    except requests.exceptions.Timeout:
        error_msg = "Таймаут подключения к удаленному серверу."
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500
    except Exception as e:
        error_msg = f"Ошибка синхронизации: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500


# --------------------------
#  🔥 МАРШРУТ: Отправка selected.json через proxy
# --------------------------

@app.route('/sync_selected', methods=['POST'])
def sync_selected():
    """Прокси для отправки selected.json на удаленный сервер"""
    try:
        print("📤 Отправка selected.json на удаленный сервер...")
        
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
        print("✅ selected.json успешно отправлен на удаленный сервер")
        
        return jsonify({
            "message": "selected.json успешно отправлен на удаленный сервер",
            "remote_response": remote_result
        }), 200
        
    except Exception as e:
        error_msg = f"Ошибка отправки selected.json: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500


# --------------------------
#  Запуск сервера
# --------------------------

if __name__ == '__main__':
    print("🚀 Основной сервер запущен на http://localhost:5000")
    print("📡 Прокси-маршруты доступны:")
    print("   GET/POST /sync_rooms - синхронизация комнат")
    print("   POST /sync_selected - отправка selected.json")
    print("   POST /save_selected - сохраняет локально И отправляет на удаленный сервер")
    app.run(port=5000, debug=True)
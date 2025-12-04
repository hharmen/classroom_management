from flask import Flask, request, jsonify, send_from_directory
import json
import os
import requests

app = Flask(__name__, static_folder='.', static_url_path='')

ROOMS_FILE = 'rooms.json'
APPS_FILE = 'apps.json'
SELECTED_FILE = 'selected.json'

REMOTE_SERVER_URL = ""

@app.route('/')
def index():
    return send_from_directory('.', 'Art.html')

@app.route('/art2')
def art2():
    return send_from_directory('.', 'Art2.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/rooms', methods=['GET'])
def get_rooms():
    if not os.path.exists(ROOMS_FILE):
        return jsonify([])
    with open(ROOMS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/apps', methods=['GET'])
def get_apps():
    if not os.path.exists(APPS_FILE):
        return jsonify([])
    with open(APPS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/update_rooms', methods=['POST'])
def update_rooms():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Нет данных"}), 400
    with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"message": "rooms.json обновлён"}), 200

@app.route('/update_apps', methods=['POST'])
def update_apps():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Нет данных"}), 400
    with open(APPS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"message": "apps.json обновлён"}), 200

@app.route('/save_selected', methods=['POST'])
def save_selected():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Нет данных"}), 400

    with open(SELECTED_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    if not REMOTE_SERVER_URL:
        return jsonify({
            "message": "selected.json сохранён локально (удаленный сервер не настроен)",
            "remote_server": "не настроен"
        }), 200

    try:
        response = requests.post(
            f'{REMOTE_SERVER_URL}/receive_selected', 
            json=data,
            timeout=10
        )
        response.raise_for_status()
        
        remote_result = response.json()
        
        return jsonify({
            "message": "selected.json сохранён и отправлен на удаленный сервер",
            "remote_response": remote_result,
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Не удалось подключиться к удаленному серверу {REMOTE_SERVER_URL}"
        return jsonify({
            "message": "selected.json сохранён локально, но не отправлен на удаленный сервер",
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 200
    except Exception as e:
        error_msg = f"Ошибка отправки на удаленный сервер {REMOTE_SERVER_URL}: {str(e)}"
        return jsonify({
            "message": "selected.json сохранён локально, но ошибка отправки на удаленный сервер",
            "error": str(e),
            "remote_server": REMOTE_SERVER_URL
        }), 200

@app.route('/sync_all', methods=['GET', 'POST'])
def sync_all():
    if not REMOTE_SERVER_URL:
        return jsonify({
            "error": "Удаленный сервер не настроен",
            "remote_server": "не настроен"
        }), 400

    try:
        rooms_response = requests.get(f'{REMOTE_SERVER_URL}/get_rooms', timeout=10)
        rooms_response.raise_for_status()
        remote_rooms = rooms_response.json()
        
        with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(remote_rooms, f, ensure_ascii=False, indent=2)
        
        apps_response = requests.get(f'{REMOTE_SERVER_URL}/get_apps', timeout=10)
        apps_response.raise_for_status()
        remote_apps = apps_response.json()
        
        with open(APPS_FILE, 'w', encoding='utf-8') as f:
            json.dump(remote_apps, f, ensure_ascii=False, indent=2)
            
        return jsonify({
            "message": f"Данные успешно синхронизированы. Комнат: {len(remote_rooms)}, Приложений: {len(remote_apps)}",
            "rooms_count": len(remote_rooms),
            "apps_count": len(remote_apps),
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Не удалось подключиться к удаленному серверу {REMOTE_SERVER_URL}."
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500
    except requests.exceptions.Timeout:
        error_msg = f"Таймаут подключения к удаленному серверу {REMOTE_SERVER_URL}."
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500
    except Exception as e:
        error_msg = f"Ошибка синхронизации с {REMOTE_SERVER_URL}: {str(e)}"
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500

@app.route('/sync_rooms', methods=['GET', 'POST'])
def sync_rooms():
    if not REMOTE_SERVER_URL:
        return jsonify({
            "error": "Удаленный сервер не настроен",
            "remote_server": "не настроен"
        }), 400

    try:
        response = requests.get(f'{REMOTE_SERVER_URL}/get_rooms', timeout=10)
        response.raise_for_status()
        remote_data = response.json()
        
        with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(remote_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "message": f"Данные успешно синхронизированы. Получено {len(remote_data)} комнат",
            "rooms_count": len(remote_data),
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Не удалось подключиться к удаленному серверу {REMOTE_SERVER_URL}."
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500
    except requests.exceptions.Timeout:
        error_msg = f"Таймаут подключения к удаленному серверу {REMOTE_SERVER_URL}."
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500
    except Exception as e:
        error_msg = f"Ошибка синхронизации с {REMOTE_SERVER_URL}: {str(e)}"
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500

@app.route('/sync_selected', methods=['POST'])
def sync_selected():
    if not REMOTE_SERVER_URL:
        return jsonify({
            "error": "Удаленный сервер не настроен",
            "remote_server": "не настроен"
        }), 400

    try:
        if not os.path.exists(SELECTED_FILE):
            return jsonify({"error": "selected.json не найден"}), 404
            
        with open(SELECTED_FILE, 'r', encoding='utf-8') as f:
            selected_data = json.load(f)

        response = requests.post(
            f'{REMOTE_SERVER_URL}/receive_selected', 
            json=selected_data,
            timeout=10
        )
        response.raise_for_status()
        
        remote_result = response.json()
        
        return jsonify({
            "message": "selected.json успешно отправлен на удаленный сервер",
            "remote_response": remote_result,
            "remote_server": REMOTE_SERVER_URL
        }), 200
        
    except Exception as e:
        error_msg = f"Ошибка отправки selected.json на {REMOTE_SERVER_URL}: {str(e)}"
        return jsonify({
            "error": error_msg,
            "remote_server": REMOTE_SERVER_URL
        }), 500

@app.route('/server_info', methods=['GET'])
def server_info():
    return jsonify({
        "local_server": "http://localhost:5000",
        "remote_server": REMOTE_SERVER_URL if REMOTE_SERVER_URL else "не настроен",
        "endpoints": {
            "sync_all": "/sync_all",
            "sync_rooms": "/sync_rooms",
            "sync_selected": "/sync_selected", 
            "save_selected": "/save_selected",
            "get_rooms": "/rooms",
            "get_apps": "/apps"
        }
    }), 200

if __name__ == '__main__':
    print("=" * 50)
    print("НАСТРОЙКА УДАЛЕННОГО СЕРВЕРА")
    print("=" * 50)
    
    remote_ip = input("Введите IP адрес удаленного сервера: ").strip()
    remote_port = input("Введите порт удаленного сервера: ").strip()
    
    REMOTE_SERVER_URL = f"http://{remote_ip}:{remote_port}"
    
    print("=" * 50)
    print(f"Основной сервер запущен на http://localhost:5000")
    print(f"Удаленный сервер: {REMOTE_SERVER_URL}")
    print(f"Файлы сервера в: {os.getcwd()}")
    print("=" * 50)
    
    app.run(port=5000, debug=False)
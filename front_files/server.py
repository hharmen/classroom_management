from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'Art.html')

@app.route('/art2')
def art2():
    return send_from_directory('.', 'Art2.html')

@app.route('/rooms.json')
def rooms():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rooms.json')
    return send_from_directory(os.path.dirname(path), 'rooms.json')

@app.route('/apps.json')
def apps():
    return send_from_directory('.', 'apps.json')

@app.route('/save_selected', methods=['POST'])
def save_selected():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Нет данных для сохранения"}), 400
    
    with open('selected.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return jsonify({"message": "Выбор сохранён в selected.json"}), 200

@app.route('/selected.json')
def get_selected():
    if os.path.exists('selected.json'):
        return send_from_directory('.', 'selected.json')
    else:
        return jsonify({"message": "Файл selected.json ещё не создан"}), 404

if __name__ == '__main__':
    app.run(debug=True)

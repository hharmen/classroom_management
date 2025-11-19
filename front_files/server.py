from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# Разрешаем отдавать файлы напрямую из папки проекта
@app.route('/')
def index():
    return app.send_static_file("register.html")


# Сохранение выбранных пользователей
@app.route("/save-users", methods=["POST"])
def save_users():
    data = request.json
    with open("selected_users.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return jsonify({"status": "ok"})


# Сохранение выбранных файлов
@app.route("/save-files", methods=["POST"])
def save_files():
    data = request.json
    with open("selected_files.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return jsonify({"status": "ok"})


# Сервер отдаёт файлы из текущей директории
@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)


if __name__ == "__main__":
    app.run(port=8000, debug=True)

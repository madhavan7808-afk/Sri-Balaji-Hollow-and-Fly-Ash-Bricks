from flask import Flask, request, send_from_directory, jsonify
import os
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'images')
ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT


@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'no files part in request'}), 400
    files = request.files.getlist('files')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    saved = []
    for f in files:
        if f and allowed_file(f.filename):
            filename = secure_filename(f.filename)
            dest = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            f.save(dest)
            saved.append(filename)
    return jsonify({'saved': saved})


@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(BASE_DIR, path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5500))
    print(f'Starting Sri Balaji Bricks server on http://127.0.0.1:{port}')
    app.run(host='127.0.0.1', port=port, debug=True)

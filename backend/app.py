from flask import Flask, render_template, request, send_file, jsonify
import cv2
import numpy as np
import os
import io

app = Flask(__name__, 
            template_folder="../frontend", 
            static_folder="../frontend",
            static_url_path="")

# Use absolute path for upload folder in project root
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/process", methods=["POST"])
def process():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        filter_type = request.form.get('filter', 'grayscale')
        
        # Convert image to OpenCV format
        npimg = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Apply chosen filter
        if filter_type == "grayscale":
            processed_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        elif filter_type == "hsv":
            processed_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        else:
            return jsonify({"error": "Invalid filter"}), 400

        # Save to memory buffer instead of disk
        is_success, buffer = cv2.imencode(".png", processed_img)
        if not is_success:
            raise ValueError("Could not process image")

        mem_file = io.BytesIO(buffer)
        mem_file.seek(0)
        
        return send_file(
            mem_file,
            mimetype="image/png",
            as_attachment=True,
            download_name="processed_image.png"
        )
        
    except Exception as e:
        app.logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
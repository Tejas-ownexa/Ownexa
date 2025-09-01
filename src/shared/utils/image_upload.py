import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from PIL import Image
import io

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_image(file, folder='properties'):
    """Save uploaded image and return the file path"""
    if file and allowed_file(file.filename):
        # Create a unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Create folder path
        folder_path = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Full file path
        file_path = os.path.join(folder_path, unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Return the relative path for database storage
        return os.path.join(folder, unique_filename)
    
    return None

def resize_image(file_path, max_size=(800, 600)):
    """Resize image to optimize storage and loading"""
    try:
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize if larger than max_size
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                img.save(file_path, 'JPEG', quality=85, optimize=True)
    except Exception as e:
        print(f"Error resizing image {file_path}: {e}")

def delete_image(image_path):
    """Delete image file from storage"""
    if image_path:
        try:
            full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_path)
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
        except Exception as e:
            print(f"Error deleting image {image_path}: {e}")
    return False

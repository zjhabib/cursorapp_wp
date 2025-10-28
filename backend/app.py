from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from boxsdk import CCGAuth, Client
from boxsdk.exception import BoxAPIException
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================

# CCG App Configuration
CLIENT_ID = 'inx9reyb2fcpakvkigflo2s3pdiae82g'
CLIENT_SECRET = 'MpTLO46U43Qcb0rFUGhedW82BEZn6SvM'
ENTERPRISE_ID = 'YOUR_ENTERPRISE_ID_HERE'  # Add your Box Enterprise ID

# Folder IDs for different sections
FOLDER_IDS = {
    'root': '0',  # Root folder - UPDATE if you want a specific folder
    'documents': 'YOUR_DOCUMENTS_FOLDER_ID_HERE',  # Add specific folder ID for documents section
    'client_portal': 'YOUR_CLIENT_PORTAL_FOLDER_ID_HERE',  # Add specific folder ID for client portal
    'forms': 'YOUR_FORMS_FOLDER_ID_HERE'  # Add specific folder ID for forms section
}

# Metadata Template Configuration
# Format: 'scope.templateKey' (e.g., 'enterprise_123456.wealthPortal')
METADATA_TEMPLATES = {
    'wealth_documents': 'YOUR_METADATA_TEMPLATE_HERE',  # e.g., 'enterprise_123456.wealthDocuments'
    'client_info': 'YOUR_CLIENT_INFO_TEMPLATE_HERE'  # e.g., 'enterprise_123456.clientInfo'
}

# Form URL - Add your Box Form URL here
FORM_URL = 'YOUR_BOX_FORM_URL_HERE'  # e.g., 'https://app.box.com/forms/YOUR_FORM_ID'

# ============================================
# END CONFIGURATION
# ============================================

def get_box_client():
    """Create and return a Box client using CCG authentication."""
    try:
        # Create CCG auth with enterprise subject
        auth = CCGAuth(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            enterprise_id=ENTERPRISE_ID
        )

        # Get an enterprise access token
        access_token = auth.authenticate_instance()

        # Create and return client
        client = Client(auth)
        return client
    except Exception as e:
        print(f"Error creating Box client: {str(e)}")
        raise

@app.route('/')
def index():
    """Serve the main index.html"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/token', methods=['POST'])
def get_token():
    """Generate a downscoped token for Box UI Elements."""
    try:
        data = request.json
        folder_id = data.get('folder_id', '0')
        scopes = data.get('scopes', ['root_readwrite', 'item_preview', 'item_upload', 'item_share', 'item_download'])

        client = get_box_client()

        # Create a downscoped token
        # Note: Adjust scopes based on your needs
        token_info = client.auth.authenticate_instance()

        return jsonify({
            'access_token': token_info.access_token,
            'expires_in': 3600
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['GET'])
def get_config():
    """Return configuration for the frontend."""
    return jsonify({
        'folder_ids': FOLDER_IDS,
        'metadata_templates': METADATA_TEMPLATES,
        'form_url': FORM_URL,
        'client_id': CLIENT_ID
    })

@app.route('/api/upload-callback', methods=['POST'])
def upload_callback():
    """
    Handle file upload callbacks and apply metadata automatically.
    This endpoint is called after a file is uploaded via Box UI Elements.
    """
    try:
        data = request.json
        file_id = data.get('file_id')
        file_name = data.get('file_name')
        folder_id = data.get('folder_id')

        if not file_id:
            return jsonify({'error': 'No file_id provided'}), 400

        client = get_box_client()
        file = client.file(file_id)

        # ============================================
        # AUTOMATIC METADATA EXTRACTION
        # ============================================
        # Add your metadata extraction logic here
        # This is where you can analyze the file and extract metadata

        # Example: Extract basic file information
        file_info = file.get()

        # Prepare metadata based on file type and content
        metadata = {
            'uploadDate': datetime.now().isoformat(),
            'fileName': file_name,
            'fileType': file_info.name.split('.')[-1] if '.' in file_info.name else 'unknown',
            # Add more fields based on your metadata template
        }

        # Apply metadata to the file
        # Uncomment and update with your actual template
        # template = METADATA_TEMPLATES.get('wealth_documents')
        # if template:
        #     scope, template_key = template.split('.')
        #     try:
        #         file.metadata(scope=scope, template=template_key).create(metadata)
        #     except BoxAPIException as e:
        #         if e.status == 409:  # Metadata already exists, update it
        #             file.metadata(scope=scope, template=template_key).update(metadata)

        return jsonify({
            'success': True,
            'file_id': file_id,
            'metadata_applied': metadata
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>/metadata', methods=['GET'])
def get_file_metadata(file_id):
    """Get metadata for a specific file."""
    try:
        client = get_box_client()
        file = client.file(file_id)

        # Get all metadata instances on the file
        metadata_instances = file.get().metadata()

        return jsonify({
            'file_id': file_id,
            'metadata': metadata_instances
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders/<folder_id>/metadata', methods=['GET'])
def get_folder_metadata(folder_id):
    """Get metadata for all files in a folder."""
    try:
        client = get_box_client()
        folder = client.folder(folder_id)

        items = folder.get_items()
        metadata_list = []

        for item in items:
            if item.type == 'file':
                try:
                    metadata_instances = item.metadata()
                    metadata_list.append({
                        'file_id': item.id,
                        'file_name': item.name,
                        'metadata': metadata_instances
                    })
                except:
                    pass

        return jsonify({
            'folder_id': folder_id,
            'items': metadata_list
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

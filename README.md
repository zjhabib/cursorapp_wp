# Wealth Portal - Box Demo Application

A comprehensive wealth management portal demo built with Box UI Elements and Python Flask backend. This application demonstrates various Box features including Content Explorer, Metadata View, Content Picker, and Box Forms integration.

## Features

- **Home Page**: Content Explorer viewing root folder with file management capabilities
- **Documents Page**: Document management with metadata view and automatic metadata extraction
- **Client Portal**: Shared workspace between clients and advisors
- **Forms Page**: Box Forms integration with Content Picker for document uploads
- **Reports Page**: Financial reports archive with preview capabilities
- **Sign-in Page**: Professional authentication UI (demo only)

## Architecture

```
cursorapp_wp/
├── backend/
│   ├── app.py              # Flask application with Box SDK
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
└── frontend/
    ├── index.html          # Home page (Content Explorer)
    ├── documents.html      # Documents with Metadata View
    ├── client-portal.html  # Client collaboration workspace
    ├── forms.html          # Box Forms integration
    ├── reports.html        # Reports archive
    ├── signin.html         # Sign-in page
    ├── scripts/            # JavaScript files
    │   ├── main.js
    │   ├── documents.js
    │   ├── forms.js
    │   └── signin.js
    └── styles/             # CSS files
        ├── main.css
        ├── documents.css
        ├── forms.css
        └── signin.css
```

## Prerequisites

- Python 3.8 or higher
- Box account with admin access
- Box CCG (Client Credentials Grant) application

## Setup Instructions

### 1. Box Configuration

#### Create a Box CCG Application

1. Go to [Box Developer Console](https://app.box.com/developers/console)
2. Click "Create New App"
3. Select "Custom App" and click "Next"
4. Choose "OAuth 2.0 with Client Credentials Grant (CCG)" authentication method
5. Name your app (e.g., "Wealth Portal Demo")
6. Click "Create App"

#### Configure Application

1. In your app's configuration:
   - **Application Scopes**: Enable the following:
     - Read and write all files and folders
     - Manage users
     - Manage enterprise properties
   - **Application Access**: Select "App + Enterprise Access"
   - **Advanced Features**: Enable:
     - Generate user access tokens
     - Perform actions as users
2. Save your changes
3. Copy your **Client ID** and **Client Secret**

#### Get Enterprise ID

1. Go to [Admin Console](https://app.box.com/master/settings/account)
2. Navigate to "Account & Billing"
3. Your Enterprise ID is displayed at the top

#### Authorize Application

1. In your app settings, go to "Authorization" tab
2. Click "Submit App" to authorize it in your enterprise
3. As an admin, approve the app in Admin Console > Apps > Custom Apps Manager

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `backend/app.py` and update the configuration section:

```python
# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================

# CCG App Configuration
CLIENT_ID = 'YOUR_CLIENT_ID_HERE'              # Your Box app client ID
CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'      # Your Box app client secret
ENTERPRISE_ID = 'YOUR_ENTERPRISE_ID_HERE'      # Your Box enterprise ID

# Folder IDs for different sections
FOLDER_IDS = {
    'root': '0',                                      # Root folder
    'documents': 'YOUR_DOCUMENTS_FOLDER_ID_HERE',     # Documents page folder
    'client_portal': 'YOUR_CLIENT_PORTAL_FOLDER_ID_HERE',  # Client portal folder
    'forms': 'YOUR_FORMS_FOLDER_ID_HERE'              # Forms page folder
}

# Metadata Template Configuration
# Format: 'scope.templateKey' (e.g., 'enterprise_123456.wealthPortal')
METADATA_TEMPLATES = {
    'wealth_documents': 'YOUR_METADATA_TEMPLATE_HERE',  # Wealth documents template
    'client_info': 'YOUR_CLIENT_INFO_TEMPLATE_HERE'     # Client info template
}

# Form URL - Add your Box Form URL here
FORM_URL = 'YOUR_BOX_FORM_URL_HERE'  # Box Form URL
```

### 3. Box Folder Setup

#### Create Folders in Box

1. Log in to Box at [box.com](https://app.box.com)
2. Create the following folder structure:
   ```
   Wealth Portal/
   ├── Documents/
   ├── Client Portal/
   ├── Forms/
   └── Reports/
   ```

#### Get Folder IDs

1. Navigate to each folder in Box
2. Look at the URL: `https://app.box.com/folder/FOLDER_ID`
3. Copy the FOLDER_ID for each folder
4. Update these IDs in `backend/app.py` in the `FOLDER_IDS` dictionary

### 4. Metadata Templates (Optional but Recommended)

#### Create Metadata Templates

1. Go to [Admin Console](https://app.box.com/master) > Content > Metadata
2. Click "Create New Template"
3. Create a template for wealth documents with fields like:
   - Document Type (enum: Statement, Report, Tax Document, etc.)
   - Client Name (string)
   - Date (date)
   - Category (enum: Financial, Legal, Tax, etc.)
   - Status (enum: Draft, Final, Archived)

#### Get Template Keys

1. After creating templates, note the template key
2. Template key format: `enterprise_ENTERPRISEID.templateKey`
3. Update these in `backend/app.py` in the `METADATA_TEMPLATES` dictionary

#### Configure Automatic Metadata Extraction

In `backend/app.py`, update the `upload_callback` function around line 115:

```python
# Prepare metadata based on file type and content
metadata = {
    'uploadDate': datetime.now().isoformat(),
    'fileName': file_name,
    'fileType': file_info.name.split('.')[-1] if '.' in file_info.name else 'unknown',
    # ADD YOUR CUSTOM FIELDS HERE based on your metadata template
    'documentType': 'Financial Statement',  # Example
    'category': 'Financial',                # Example
    'status': 'Draft'                       # Example
}

# Apply metadata to the file
template = METADATA_TEMPLATES.get('wealth_documents')
if template:
    scope, template_key = template.split('.')
    try:
        file.metadata(scope=scope, template=template_key).create(metadata)
    except BoxAPIException as e:
        if e.status == 409:  # Metadata already exists, update it
            file.metadata(scope=scope, template=template_key).update(metadata)
```

### 5. Box Forms Setup (Optional)

#### Create a Box Form

1. Go to [Box Forms](https://app.box.com/forms)
2. Click "Create Form"
3. Design your form (e.g., Client Information Form)
4. Publish the form
5. Copy the form URL
6. Update `FORM_URL` in `backend/app.py`

### 6. Run the Application

#### Start the Backend Server

```bash
cd backend
python app.py
```

The server will start on `http://localhost:5000`

#### Open the Frontend

Open your web browser and navigate to:
```
http://localhost:5000
```

Or directly open the signin page:
```
http://localhost:5000/signin.html
```

## Usage Guide

### Navigation

The application has a persistent sidebar with navigation to all pages:
- **Home**: Browse all documents in the root folder
- **Documents**: View documents with metadata
- **Client Portal**: Shared workspace
- **Forms**: Complete forms and upload documents
- **Reports**: View financial reports

### Home Page

- Browse files and folders using Box Content Explorer
- Upload files (will automatically extract metadata)
- Preview, download, share files
- Create folders
- All standard Box UI Element features available

### Documents Page

- View documents organized by category
- Select a file to view its metadata in the side panel
- Metadata View shows all metadata instances on files
- Upload files with automatic metadata extraction
- Filter by document category

### Client Portal Page

- Shared workspace between clients and advisors
- View client information
- Browse shared documents
- Upload and collaborate on files

### Forms Page

- View available forms to complete
- Click "Start Form" to open a Box Form
- Upload supporting documents using Content Picker
- View form submission history

### Reports Page

- Browse financial reports
- Preview and download reports
- Generate new reports (placeholder feature)

## Configuration Reference

### Where to Add Configuration

All configuration is centralized in `backend/app.py` at the top of the file:

```python
# Lines 20-40: Box CCG App credentials
CLIENT_ID = 'YOUR_CLIENT_ID_HERE'
CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'
ENTERPRISE_ID = 'YOUR_ENTERPRISE_ID_HERE'

# Lines 42-48: Folder IDs
FOLDER_IDS = {
    'root': '0',
    'documents': 'YOUR_DOCUMENTS_FOLDER_ID_HERE',
    'client_portal': 'YOUR_CLIENT_PORTAL_FOLDER_ID_HERE',
    'forms': 'YOUR_FORMS_FOLDER_ID_HERE'
}

# Lines 50-55: Metadata Templates
METADATA_TEMPLATES = {
    'wealth_documents': 'YOUR_METADATA_TEMPLATE_HERE',
    'client_info': 'YOUR_CLIENT_INFO_TEMPLATE_HERE'
}

# Lines 57-59: Box Form URL
FORM_URL = 'YOUR_BOX_FORM_URL_HERE'
```

### Metadata Extraction Configuration

To customize automatic metadata extraction, edit `backend/app.py` lines 115-145 in the `upload_callback` function.

## Box UI Elements Used

### Content Explorer
- **Where**: Home page, Documents page, Client Portal page, Reports page
- **Features**: File browsing, upload, preview, download, share, folder creation
- **Documentation**: [Box Content Explorer](https://developer.box.com/guides/embed/ui-elements/explorer/)

### Metadata Sidebar
- **Where**: Documents page
- **Features**: View and edit file metadata, activity feed, versions
- **Documentation**: [Box Metadata Sidebar](https://developer.box.com/guides/embed/ui-elements/sidebar/)

### Content Picker
- **Where**: Forms page
- **Features**: File selection and upload
- **Documentation**: [Box Content Picker](https://developer.box.com/guides/embed/ui-elements/picker/)

## Customization

### Branding

Update colors and branding in `frontend/styles/main.css`:

```css
:root {
    --primary-color: #0061D5;      /* Main brand color */
    --primary-dark: #0052b4;       /* Darker shade */
    --secondary-color: #667eea;     /* Secondary brand color */
    /* ... */
}
```

### Adding More Pages

1. Create new HTML file in `frontend/`
2. Create corresponding CSS in `frontend/styles/`
3. Create corresponding JS in `frontend/scripts/`
4. Add navigation link in sidebar
5. Add route in `backend/app.py` if needed

### Adding More Metadata Fields

1. Update your Box metadata template
2. Modify the `upload_callback` function in `backend/app.py`
3. Update the metadata display in `documents.js`

## Troubleshooting

### "Failed to initialize the application"

- Check that all configuration values are set in `backend/app.py`
- Verify your Box app is authorized in Admin Console
- Ensure your Enterprise ID is correct

### "Failed to get access token"

- Verify Client ID and Client Secret are correct
- Check that CCG authentication is enabled for your app
- Ensure app has proper scopes enabled

### Folder not loading

- Verify folder IDs are correct
- Check folder permissions
- Ensure the app user has access to the folders

### Metadata not appearing

- Check that metadata templates are created
- Verify template keys are in the correct format
- Ensure files have metadata applied

### Forms not loading

- Verify Box Form URL is correct
- Check that the form is published
- Ensure the form URL is publicly accessible or user has access

## Demo Tips for Sales Engineers

1. **Before the Demo**:
   - Pre-populate folders with sample documents
   - Apply metadata to some files
   - Create realistic folder structure
   - Test all features

2. **During the Demo**:
   - Start with sign-in page to show the UI
   - Walk through each page explaining the use case
   - Demonstrate file upload with automatic metadata
   - Show metadata view and filtering
   - Demonstrate collaboration features
   - Show Box Forms integration

3. **Key Talking Points**:
   - Secure document management for sensitive financial data
   - Automatic metadata extraction and classification
   - Seamless collaboration between clients and advisors
   - Digital forms to replace paper processes
   - All data stays in Box for compliance and security

## Security Notes

- This is a demo application for sales purposes
- In production, implement proper authentication
- Never commit credentials to version control
- Use environment variables for sensitive data
- Implement proper error handling and logging
- Add rate limiting and security headers

## Support

For issues or questions:
- Box Developer Documentation: https://developer.box.com
- Box Developer Community: https://community.box.com/
- Box Support: https://support.box.com/

## License

This is a demo application for Box sales purposes. Customize and use as needed for your demos.

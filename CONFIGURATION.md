# Wealth Portal Configuration Guide

This guide provides detailed step-by-step instructions for configuring the Wealth Portal demo application.

## Quick Configuration Checklist

Before running the application, you need:

- [ ] Box CCG Application created and authorized
- [ ] Enterprise ID
- [ ] Folder IDs for each section
- [ ] (Optional) Metadata templates created
- [ ] (Optional) Box Form created
- [ ] Backend configuration updated

## Configuration Locations

All configuration is done in **ONE FILE**: `backend/app.py` (lines 12-40)

```python
# backend/app.py

# Line 17: Add your Box app Client ID (already filled in)
CLIENT_ID = 'inx9reyb2fcpakvkigflo2s3pdiae82g'

# Line 18: Add your Box app Client Secret (already filled in)
CLIENT_SECRET = 'MpTLO46U43Qcb0rFUGhedW82BEZn6SvM'

# Line 19: ADD YOUR ENTERPRISE ID HERE
ENTERPRISE_ID = 'YOUR_ENTERPRISE_ID_HERE'

# Lines 22-27: ADD YOUR FOLDER IDs HERE
FOLDER_IDS = {
    'root': '0',  # Can keep as '0' for root folder
    'documents': 'YOUR_DOCUMENTS_FOLDER_ID_HERE',
    'client_portal': 'YOUR_CLIENT_PORTAL_FOLDER_ID_HERE',
    'forms': 'YOUR_FORMS_FOLDER_ID_HERE'
}

# Lines 31-34: ADD YOUR METADATA TEMPLATE KEYS HERE (Optional)
METADATA_TEMPLATES = {
    'wealth_documents': 'YOUR_METADATA_TEMPLATE_HERE',
    'client_info': 'YOUR_CLIENT_INFO_TEMPLATE_HERE'
}

# Line 37: ADD YOUR BOX FORM URL HERE (Optional)
FORM_URL = 'YOUR_BOX_FORM_URL_HERE'
```

## Step-by-Step Configuration

### Step 1: Get Your Enterprise ID

**Method 1: From Admin Console**
1. Go to https://app.box.com/master/settings/account
2. Navigate to "Account & Billing"
3. Your Enterprise ID is displayed near the top
4. Copy the Enterprise ID

**Method 2: From Developer Console**
1. Go to your app in https://app.box.com/developers/console
2. Click on your app
3. The Enterprise ID may be shown in the app settings

**Update Configuration:**
```python
ENTERPRISE_ID = '1234567890'  # Replace with your actual Enterprise ID
```

### Step 2: Get Folder IDs

#### Option A: Get IDs from Box Web App

1. Log in to Box at https://app.box.com
2. Navigate to the folder you want to use
3. Look at the URL in your browser:
   ```
   https://app.box.com/folder/123456789
                              ^^^^^^^^^
                              This is the Folder ID
   ```
4. Copy the Folder ID

#### Option B: Use Root Folder (Folder ID = '0')

If you want to use the root "All Files" folder, you can use '0' as the folder ID.

#### Create Recommended Folder Structure

1. Create a folder called "Wealth Portal"
2. Inside it, create:
   - Documents
   - Client Portal
   - Forms
   - Reports
3. Get the ID for each folder

**Update Configuration:**
```python
FOLDER_IDS = {
    'root': '0',  # or a specific folder ID
    'documents': '234567890',  # Documents folder ID
    'client_portal': '345678901',  # Client Portal folder ID
    'forms': '456789012'  # Forms folder ID
}
```

### Step 3: Create and Configure Metadata Templates (Optional)

#### Create a Metadata Template

1. Go to https://app.box.com/master
2. Navigate to **Content** > **Metadata**
3. Click **"Create New Template"**
4. Fill in template details:
   - **Template Name**: Wealth Documents
   - **Template Key**: wealthDocuments (will be auto-generated)
5. Add fields:

   | Field Name | Type | Options |
   |------------|------|---------|
   | Document Type | Multi-Select | Financial Statement, Tax Document, Report, Legal Document, Other |
   | Client Name | Text | - |
   | Date | Date | - |
   | Category | Multi-Select | Financial, Legal, Tax, Investment, Insurance |
   | Status | Multi-Select | Draft, Final, Archived |
   | Year | Number | - |
   | Confidential | Multi-Select | Yes, No |

6. Click **Save**

#### Get the Template Key

After creating the template:
1. The template key is shown in the template details
2. Format: `enterprise_ENTERPRISEID.templateKey`
3. Example: `enterprise_1234567890.wealthDocuments`

**Update Configuration:**
```python
METADATA_TEMPLATES = {
    'wealth_documents': 'enterprise_1234567890.wealthDocuments',
    'client_info': 'enterprise_1234567890.clientInfo'
}
```

#### Configure Automatic Metadata (Optional)

To customize what metadata is automatically applied on upload, edit `backend/app.py` around line 115:

```python
def upload_callback():
    # ... existing code ...

    # Prepare metadata based on file type and content
    metadata = {
        'uploadDate': datetime.now().isoformat(),
        'fileName': file_name,
        'fileType': file_info.name.split('.')[-1] if '.' in file_info.name else 'unknown',

        # ADD YOUR CUSTOM METADATA FIELDS HERE
        # Make sure these match your template fields exactly
        'documentType': ['Financial Statement'],  # Array for multi-select
        'clientName': 'John Doe',  # String for text fields
        'category': ['Financial'],  # Array for multi-select
        'status': ['Draft'],  # Array for multi-select
        'year': 2024,  # Number
        'confidential': ['Yes']  # Array for multi-select
    }

    # Apply metadata to the file
    template = METADATA_TEMPLATES.get('wealth_documents')
    if template and template != 'YOUR_METADATA_TEMPLATE_HERE':
        scope, template_key = template.split('.')
        try:
            file.metadata(scope=scope, template=template_key).create(metadata)
        except BoxAPIException as e:
            if e.status == 409:  # Metadata already exists, update it
                file.metadata(scope=scope, template=template_key).update(metadata)
```

### Step 4: Create a Box Form (Optional)

#### Create a Form

1. Go to https://app.box.com/forms or click **Create** > **Form** in Box
2. Click **"Create Form"**
3. Design your form:
   - **Form Name**: Client Information Update
   - Add fields like:
     - Full Name (Text)
     - Email (Email)
     - Phone (Text)
     - Address (Text Area)
     - Account Number (Text)
     - Preferred Contact Method (Multiple Choice)
4. Configure where responses should be saved
5. Click **Publish**

#### Get the Form URL

1. After publishing, click **Share**
2. Copy the public link
3. Example: `https://app.box.com/f/12345abcde`

**Update Configuration:**
```python
FORM_URL = 'https://app.box.com/f/12345abcde'
```

### Step 5: Verify Your Configuration

Your final configuration should look like this:

```python
# backend/app.py

CLIENT_ID = 'inx9reyb2fcpakvkigflo2s3pdiae82g'
CLIENT_SECRET = 'MpTLO46U43Qcb0rFUGhedW82BEZn6SvM'
ENTERPRISE_ID = '1234567890'  # ✓ Your actual Enterprise ID

FOLDER_IDS = {
    'root': '0',
    'documents': '234567890',  # ✓ Your folder IDs
    'client_portal': '345678901',
    'forms': '456789012'
}

METADATA_TEMPLATES = {
    'wealth_documents': 'enterprise_1234567890.wealthDocuments',  # ✓ Your template keys
    'client_info': 'enterprise_1234567890.clientInfo'
}

FORM_URL = 'https://app.box.com/f/12345abcde'  # ✓ Your Box Form URL
```

## Testing Your Configuration

### Test 1: Start the Server

```bash
cd backend
python app.py
```

You should see:
```
* Running on http://127.0.0.1:5000
```

If you see errors about authentication, check your Enterprise ID and credentials.

### Test 2: Access the Configuration Endpoint

Open a browser and go to:
```
http://localhost:5000/api/config
```

You should see your configuration as JSON. If you see errors, check your Enterprise ID.

### Test 3: Get a Token

```bash
curl -X POST http://localhost:5000/api/token \
  -H "Content-Type: application/json" \
  -d '{"folder_id": "0"}'
```

If successful, you'll get an access token. If not, check your Box app authorization.

### Test 4: Open the Application

Go to: http://localhost:5000

You should see the sign-in page. Click through to test each page.

## Common Issues and Solutions

### Issue: "Authentication Error"

**Solution:**
- Verify Enterprise ID is correct
- Check that Box app is authorized in Admin Console
- Ensure Client ID and Client Secret are correct

### Issue: "Folder not found" or empty Content Explorer

**Solution:**
- Verify folder IDs are correct
- Check that the app user has access to the folders
- Try using '0' as the folder ID to access the root folder

### Issue: "Metadata not appearing"

**Solution:**
- Check that metadata template keys are correct
- Verify format: `enterprise_ENTERPRISEID.templateKey`
- Ensure the template exists and is active
- Check that files actually have metadata applied

### Issue: "Form not loading"

**Solution:**
- Verify the Form URL is correct and the form is published
- Check that the form is publicly accessible or user has access
- Try opening the form URL directly in a browser

### Issue: "CORS errors in browser console"

**Solution:**
- Make sure you're accessing the app through the Flask server (http://localhost:5000)
- Don't open the HTML files directly in the browser

## Minimum Required Configuration

To run the app with minimal setup:

```python
CLIENT_ID = 'inx9reyb2fcpakvkigflo2s3pdiae82g'  # ✓ Already configured
CLIENT_SECRET = 'MpTLO46U43Qcb0rFUGhedW82BEZn6SvM'  # ✓ Already configured
ENTERPRISE_ID = 'YOUR_ENTERPRISE_ID_HERE'  # ✗ MUST BE UPDATED

# Can use root folder for all sections
FOLDER_IDS = {
    'root': '0',
    'documents': '0',
    'client_portal': '0',
    'forms': '0'
}

# Optional - can leave as is
METADATA_TEMPLATES = {
    'wealth_documents': 'YOUR_METADATA_TEMPLATE_HERE',
    'client_info': 'YOUR_CLIENT_INFO_TEMPLATE_HERE'
}

# Optional - can leave as is
FORM_URL = 'YOUR_BOX_FORM_URL_HERE'
```

With this minimal configuration, the app will work but:
- All pages will show the same root folder
- Metadata features won't work
- Forms page will show an alert instead of loading a form

## Next Steps After Configuration

1. **Test all pages**: Click through each page to ensure they load
2. **Upload a test file**: Test the automatic metadata extraction
3. **Customize branding**: Update colors and logos in the CSS files
4. **Prepare demo data**: Add sample files and folders
5. **Practice the demo**: Walk through the key features

## Support

If you encounter issues:
- Check the browser console for error messages
- Check the Python console for backend errors
- Review the Box Developer documentation: https://developer.box.com
- Contact Box support or your Box Solutions Engineer

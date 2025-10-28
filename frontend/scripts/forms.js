// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

let config = null;
let accessToken = null;
let contentPicker = null;

// Initialize the application
async function init() {
    try {
        // Load configuration
        config = await loadConfig();

        // Get access token
        accessToken = await getAccessToken(config.folder_ids.forms);

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize the application. Please check your configuration.');
    }
}

// Load configuration from backend
async function loadConfig() {
    const response = await fetch(`${API_BASE_URL}/config`);
    if (!response.ok) {
        throw new Error('Failed to load configuration');
    }
    return await response.json();
}

// Get access token from backend
async function getAccessToken(folderId = '0') {
    const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            folder_id: folderId,
            scopes: ['root_readwrite', 'item_preview', 'item_upload', 'item_share', 'item_download']
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

// Open Box Form
function openForm(formType) {
    // ============================================
    // CONFIGURATION: Add your Box Form URL here
    // ============================================
    let formUrl = config.form_url;

    // Check if form URL is configured
    if (!formUrl || formUrl === 'YOUR_BOX_FORM_URL_HERE') {
        alert('Box Form URL is not configured. Please add your Box Form URL in the backend configuration (backend/app.py).\n\nYou can create a Box Form at: https://app.box.com/forms');
        return;
    }

    // You can have different forms for different types
    // For now, using the same form URL for all
    const formTitles = {
        'client-info': 'Client Information Update',
        'financial-goals': 'Financial Goals Assessment',
        'tax-info': 'W-9 Tax Form'
    };

    // Show form embed section
    const formsGrid = document.querySelector('.forms-grid');
    const formEmbedSection = document.getElementById('formEmbedSection');
    const formTitle = document.getElementById('formTitle');
    const formIframe = document.getElementById('formIframe');

    formsGrid.style.display = 'none';
    formEmbedSection.style.display = 'block';

    formTitle.textContent = formTitles[formType] || 'Form';
    formIframe.src = formUrl;

    // Track form opened
    console.log('Form opened:', formType);
}

// Close form embed
function closeFormEmbed() {
    const formsGrid = document.querySelector('.forms-grid');
    const formEmbedSection = document.getElementById('formEmbedSection');
    const formIframe = document.getElementById('formIframe');

    formsGrid.style.display = 'grid';
    formEmbedSection.style.display = 'none';
    formIframe.src = '';
}

// Open document upload modal with Content Picker
function openDocumentUpload() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'flex';

    // Initialize Box Content Picker
    initContentPicker();
}

// Initialize Box Content Picker
function initContentPicker() {
    // ============================================
    // CONFIGURATION: Update folder ID here
    // ============================================
    const FOLDER_ID = config.folder_ids.forms; // Forms folder for uploads

    contentPicker = new Box.ContentPicker();

    contentPicker.show(FOLDER_ID, accessToken, {
        container: '#content-picker',
        logoUrl: '',
        maxSelectable: 10,
        canUpload: true,
        canSetShareAccess: false,
        canCreateNewFolder: false,
        chooseButtonLabel: 'Upload to Forms',
        cancelButtonLabel: 'Cancel'
    });

    // Listen to choose event
    contentPicker.addListener('choose', (files) => {
        console.log('Files selected:', files);
        handleFilesChosen(files);
    });

    // Listen to cancel event
    contentPicker.addListener('cancel', () => {
        closeUploadModal();
    });
}

// Handle files chosen
async function handleFilesChosen(files) {
    console.log('Files chosen for upload:', files);

    // Process each file
    for (const file of files) {
        try {
            // Call backend to apply metadata
            const response = await fetch(`${API_BASE_URL}/upload-callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: file.id,
                    file_name: file.name,
                    folder_id: config.folder_ids.forms
                })
            });

            if (response.ok) {
                console.log('Metadata applied to:', file.name);
            }
        } catch (error) {
            console.error('Error processing file:', error);
        }
    }

    showNotification(`${files.length} file(s) uploaded successfully!`);
    closeUploadModal();
}

// Close upload modal
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'none';

    // Clear picker
    document.getElementById('content-picker').innerHTML = '';
}

// Show form history
function showFormHistory() {
    // Check if history section already exists
    let historySection = document.querySelector('.history-section');

    if (historySection) {
        historySection.remove();
        return;
    }

    // Create history section
    const mainContent = document.querySelector('.main-content');
    historySection = document.createElement('div');
    historySection.className = 'history-section';
    historySection.innerHTML = `
        <div class="history-header">
            <h2>Form Submission History</h2>
            <button class="btn btn-secondary" onclick="this.closest('.history-section').remove()">Close</button>
        </div>
        <div class="history-list">
            <div class="history-item">
                <div class="history-info">
                    <div class="history-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 17V15C16 13.9391 15.5786 12.9217 14.8284 12.1716C14.0783 11.4214 13.0609 11 12 11H6C4.93913 11 3.92172 11.4214 3.17157 12.1716C2.42143 12.9217 2 13.9391 2 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="history-details">
                        <h4>Client Information Update</h4>
                        <p>Submitted on March 15, 2024</p>
                    </div>
                </div>
                <span class="history-status completed">Completed</span>
            </div>

            <div class="history-item">
                <div class="history-info">
                    <div class="history-icon" style="background: #f57c00;">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="history-details">
                        <h4>W-9 Tax Form</h4>
                        <p>Submitted on February 20, 2024</p>
                    </div>
                </div>
                <span class="history-status completed">Completed</span>
            </div>

            <div class="history-item">
                <div class="history-info">
                    <div class="history-icon" style="background: #388e3c;">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="history-details">
                        <h4>Document Upload Request</h4>
                        <p>Submitted on January 10, 2024</p>
                    </div>
                </div>
                <span class="history-status completed">Completed</span>
            </div>

            <div class="history-item">
                <div class="history-info">
                    <div class="history-icon" style="background: #7b1fa2;">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="history-details">
                        <h4>Financial Goals Assessment</h4>
                        <p>Started on October 5, 2023</p>
                    </div>
                </div>
                <span class="history-status pending">In Progress</span>
            </div>
        </div>
    `;

    mainContent.appendChild(historySection);
}

// Utility functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message) {
    const mainContent = document.querySelector('.main-content');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" stroke-width="2"/>
            <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>${message}</span>
    `;
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'signin.html';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        closeUploadModal();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

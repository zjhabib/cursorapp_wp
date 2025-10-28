// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

let config = null;
let accessToken = null;
let contentExplorer = null;
let metadataSidebar = null;
let selectedFile = null;

// Initialize the application
async function init() {
    try {
        // Load configuration
        config = await loadConfig();

        // Get access token
        accessToken = await getAccessToken(config.folder_ids.documents);

        // Initialize Content Explorer
        initContentExplorer();

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

// Initialize Box Content Explorer
function initContentExplorer() {
    // ============================================
    // CONFIGURATION: Update folder ID here
    // ============================================
    const FOLDER_ID = config.folder_ids.documents; // Documents folder

    contentExplorer = new Box.ContentExplorer();

    contentExplorer.show(FOLDER_ID, accessToken, {
        container: '#content-explorer',
        logoUrl: '',
        canUpload: true,
        canDownload: true,
        canDelete: true,
        canRename: true,
        canShare: true,
        canPreview: true,
        canSetShareAccess: true,
        canCreateNewFolder: true,
        contentPreviewProps: {
            contentSidebarProps: {
                hasActivityFeed: true,
                hasMetadata: true,
                hasSkills: true,
                hasVersions: true,
                detailsSidebarProps: {
                    hasProperties: true,
                    hasNotices: true,
                    hasAccessStats: true,
                    hasClassification: true,
                    hasRetentionPolicy: true,
                    hasVersions: true,
                }
            }
        }
    });

    // Listen to events
    contentExplorer.addListener('select', (items) => {
        console.log('Items selected:', items);
        if (items && items.length > 0 && items[0].type === 'file') {
            selectedFile = items[0];
            showMetadataForFile(items[0]);
        }
    });

    contentExplorer.addListener('upload', (files) => {
        console.log('Files uploaded:', files);
        files.forEach(file => {
            handleFileUpload(file);
        });
    });

    contentExplorer.addListener('preview', (item) => {
        console.log('Previewing item:', item);
    });
}

// Initialize Box Metadata Sidebar
function initMetadataSidebar(fileId) {
    // ============================================
    // CONFIGURATION: Metadata Templates
    // ============================================
    // Update these with your actual metadata template keys
    const metadataTemplates = [];

    if (config.metadata_templates.wealth_documents && config.metadata_templates.wealth_documents !== 'YOUR_METADATA_TEMPLATE_HERE') {
        metadataTemplates.push(config.metadata_templates.wealth_documents);
    }
    if (config.metadata_templates.client_info && config.metadata_templates.client_info !== 'YOUR_CLIENT_INFO_TEMPLATE_HERE') {
        metadataTemplates.push(config.metadata_templates.client_info);
    }

    if (metadataTemplates.length === 0) {
        // Show custom metadata view instead
        showCustomMetadata(fileId);
        return;
    }

    metadataSidebar = new Box.MetadataSidebar();

    metadataSidebar.show(fileId, accessToken, {
        container: '#metadata-sidebar',
        detailsSidebarProps: {
            hasProperties: true,
            hasMetadata: true,
            hasAccessStats: true,
        }
    });
}

// Show custom metadata when Box sidebar is not available
async function showCustomMetadata(fileId) {
    const metadataContent = document.getElementById('metadataContent');
    metadataContent.innerHTML = '<div class="metadata-loading"><div class="spinner"></div></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/files/${fileId}/metadata`);

        if (!response.ok) {
            throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();

        // Display metadata
        let html = `
            <div class="document-preview">
                <div class="preview-header">
                    <div class="file-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H11L16 7V16C16 16.5304 15.7893 17.0391 15.4142 17.4142C15.0391 17.7893 14.5304 18 14 18H6C5.46957 18 4.96086 17.7893 4.58579 17.4142C4.21071 17.0391 4 16.5304 4 16V4Z" stroke="#0061D5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="preview-info">
                        <h5>${selectedFile.name}</h5>
                        <p>${formatFileSize(selectedFile.size)}</p>
                    </div>
                </div>
            </div>
        `;

        if (data.metadata && Object.keys(data.metadata).length > 0) {
            html += '<div class="metadata-section">';
            html += '<h4>Document Metadata</h4>';

            for (const [key, value] of Object.entries(data.metadata)) {
                html += `
                    <div class="metadata-field">
                        <span class="metadata-label">${formatFieldName(key)}</span>
                        <span class="metadata-value">${formatFieldValue(value)}</span>
                    </div>
                `;
            }

            html += '</div>';
        } else {
            html += `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 8C14 7.46957 14.2107 6.96086 14.5858 6.58579C14.9609 6.21071 15.4696 6 16 6H28L38 16V38C38 38.5304 37.7893 39.0391 37.4142 39.4142C37.0391 39.7893 36.5304 40 36 40H16C15.4696 40 14.9609 39.7893 14.5858 39.4142C14.2107 39.0391 14 38.5304 14 38V8Z" stroke="#ccc" stroke-width="2"/>
                        <path d="M20 20H32M20 26H32M20 32H26" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>No metadata available for this document</p>
                    <p style="font-size: 12px; margin-top: 8px;">Metadata will be automatically added on upload</p>
                </div>
            `;
        }

        // Add action buttons
        html += `
            <div class="action-buttons">
                <button class="action-btn" onclick="downloadFile()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 11V3M8 11L5 8M8 11L11 8M2 11V13C2 13.5304 2.21071 14.0391 2.58579 14.4142C2.96086 14.7893 3.46957 15 4 15H12C12.5304 15 13.0391 14.7893 13.4142 14.4142C13.7893 14.0391 14 13.5304 14 13V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Download
                </button>
                <button class="action-btn primary" onclick="previewFile()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 8C1 8 3 3 8 3C13 3 15 8 15 8C15 8 13 13 8 13C3 13 1 8 1 8Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Preview
                </button>
            </div>
        `;

        metadataContent.innerHTML = html;

    } catch (error) {
        console.error('Error fetching metadata:', error);
        metadataContent.innerHTML = `
            <div class="empty-state">
                <p>Failed to load metadata</p>
            </div>
        `;
    }
}

// Handle file upload and apply metadata
async function handleFileUpload(file) {
    try {
        console.log('Processing uploaded file:', file);

        // Call backend to apply metadata
        const response = await fetch(`${API_BASE_URL}/upload-callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_id: file.id,
                file_name: file.name,
                folder_id: file.parent ? file.parent.id : config.folder_ids.documents
            })
        });

        if (!response.ok) {
            console.error('Failed to process upload callback');
            return;
        }

        const result = await response.json();
        console.log('Metadata applied:', result);

        // Show notification
        showNotification('File uploaded successfully with metadata!');

    } catch (error) {
        console.error('Error handling file upload:', error);
    }
}

// Show metadata for selected file
function showMetadataForFile(file) {
    const panel = document.getElementById('metadataPanel');
    const workspace = document.querySelector('.document-workspace');

    panel.style.display = 'flex';
    workspace.classList.add('split-view');

    // Show metadata using Box sidebar or custom view
    initMetadataSidebar(file.id);
}

// Toggle metadata view
function toggleMetadataView() {
    const panel = document.getElementById('metadataPanel');
    const workspace = document.querySelector('.document-workspace');
    const toggleText = document.getElementById('metadataToggleText');

    if (panel.style.display === 'none') {
        if (selectedFile) {
            panel.style.display = 'flex';
            workspace.classList.add('split-view');
            toggleText.textContent = 'Hide Metadata';
            showMetadataForFile(selectedFile);
        } else {
            alert('Please select a file first');
        }
    } else {
        closeMetadataPanel();
    }
}

// Close metadata panel
function closeMetadataPanel() {
    const panel = document.getElementById('metadataPanel');
    const workspace = document.querySelector('.document-workspace');
    const toggleText = document.getElementById('metadataToggleText');

    panel.style.display = 'none';
    workspace.classList.remove('split-view');
    toggleText.textContent = 'Show Metadata';
}

// Filter by category
function filterByCategory(category) {
    console.log('Filter by category:', category);
    // In a real implementation, this would filter the content explorer
    // For now, just show a notification
    showNotification(`Filtering by: ${category.replace('-', ' ')}`);
}

// Set view mode
function setView(mode) {
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');

    console.log('View mode:', mode);
    // Content Explorer view mode would be changed here
}

// Upload document
function uploadDocument() {
    // Trigger the upload functionality in Content Explorer
    alert('Click the upload button in the content explorer to upload documents');
}

// Download file
function downloadFile() {
    if (selectedFile) {
        window.open(`https://app.box.com/file/${selectedFile.id}`, '_blank');
    }
}

// Preview file
function previewFile() {
    if (selectedFile) {
        // The preview should be triggered through Content Explorer
        alert('Use the content explorer to preview files');
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatFieldName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function formatFieldValue(value) {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return value;
}

function showNotification(message) {
    // Simple notification - in production use a proper notification library
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
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

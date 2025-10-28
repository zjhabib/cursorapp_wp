// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

let config = null;
let accessToken = null;

// Initialize the application
async function init() {
    try {
        // Load configuration
        config = await loadConfig();

        // Get access token
        accessToken = await getAccessToken(config.folder_ids.root);

        // Initialize Content Explorer
        initContentExplorer();

        // Load stats
        loadStats();

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
    const FOLDER_ID = config.folder_ids.root; // Change to specific folder ID if needed

    const contentExplorer = new Box.ContentExplorer();

    contentExplorer.show(FOLDER_ID, accessToken, {
        container: '#content-explorer',
        logoUrl: '', // Add your logo URL here if desired
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

    // Listen to upload events for automatic metadata extraction
    contentExplorer.addListener('upload', (files) => {
        console.log('Files uploaded:', files);
        files.forEach(file => {
            handleFileUpload(file);
        });
    });

    // Listen to other events
    contentExplorer.addListener('select', (items) => {
        console.log('Items selected:', items);
    });

    contentExplorer.addListener('navigate', (item) => {
        console.log('Navigated to:', item);
        updateStats(item.id);
    });

    contentExplorer.addListener('delete', (items) => {
        console.log('Items deleted:', items);
        loadStats();
    });

    contentExplorer.addListener('rename', (item) => {
        console.log('Item renamed:', item);
    });

    contentExplorer.addListener('preview', (item) => {
        console.log('Previewing item:', item);
    });
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
                folder_id: file.parent ? file.parent.id : config.folder_ids.root
            })
        });

        if (!response.ok) {
            console.error('Failed to process upload callback');
            return;
        }

        const result = await response.json();
        console.log('Metadata applied:', result);

        // Refresh stats
        loadStats();

    } catch (error) {
        console.error('Error handling file upload:', error);
    }
}

// Load statistics
async function loadStats() {
    // For demo purposes, using placeholder values
    // In production, these would come from Box API
    updateStatsDisplay({
        totalFiles: 127,
        totalFolders: 18,
        sharedItems: 23,
        recentActivity: 12
    });
}

// Update stats from Box API
async function updateStats(folderId) {
    try {
        // This would typically make an API call to get folder stats
        // For now, using placeholder values
        loadStats();
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    document.getElementById('totalFiles').textContent = stats.totalFiles;
    document.getElementById('totalFolders').textContent = stats.totalFolders;
    document.getElementById('sharedItems').textContent = stats.sharedItems;
    document.getElementById('recentActivity').textContent = stats.recentActivity;
}

// Show error message
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

// Show help
function showHelp() {
    alert('Help: This is a demo wealth portal.\n\nFeatures:\n- Browse and manage documents\n- Upload files with automatic metadata\n- View document metadata\n- Fill out forms\n- Collaborate with advisors\n\nFor support, contact your financial advisor.');
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'signin.html';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

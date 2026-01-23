// Add these new functions at the beginning, after your variable declarations:

// ===== NEW FUNCTIONS =====

// Detect PWA mode
function detectPWAMode() {
    // Check if running in standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone ||
        document.referrer.includes('android-app://')) {
        console.log("Running in PWA/installed mode");
        return true;
    }
    return false;
}

// Test camera access
async function testCameraAccess() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera access SUCCESSFUL");
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error("Camera access FAILED:", error);
        return false;
    }
}

// Request camera for PWA
function requestCameraForPWA() {
    if (detectPWAMode() && navigator.platform.match(/iPhone|iPod|iPad/)) {
        // iOS PWA workaround: open in browser
        const shouldOpen = confirm("iOS PWA has camera restrictions. Open in Safari for better camera support?");
        if (shouldOpen) {
            window.open(window.location.href, '_blank');
            return true;
        }
    }
    return false;
}

// ===== EXISTING CODE CONTINUES BELOW =====

// Your existing detectWebView function (update it)
function detectWebView() {
    // Your existing code plus the new PWA detection...
}
// Parking slots simulation
let parkingSlots = Array.from({ length: 25 }, (_, i) => ({
    number: i + 1,
    occupied: false,
    occupiedBy: null,
    occupiedAt: null,
    lecturerName: null
}));

// Parking history simulation
let parkingHistory = [];




// Application state
let currentUser = null;
let scanner = null;
let qrCodeInstance = null;
let isCameraActive = false;
let isWebView = false;

// DOM elements
const pages = {
    welcome: document.getElementById('welcomePage'),
    lecturerSignup: document.getElementById('lecturerSignupPage'),
    lecturerLogin: document.getElementById('lecturerLoginPage'),
    securitySignup: document.getElementById('securitySignupPage'),
    securityLogin: document.getElementById('securityLoginPage'),
    lecturerDashboard: document.getElementById('lecturerDashboard'),
    securityDashboard: document.getElementById('securityDashboard'),
    accountDetails: document.getElementById('accountDetailsPage'),
    aboutSystem: document.getElementById('aboutSystemPage')
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Detect if running in WebView
    detectWebView();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('parkingUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard(currentUser.role);
            updateParkingDisplay();
            updateMenuProfile();
        } catch (e) {
            console.error('Error parsing saved user:', e);
            showPage('welcome');
        }
    } else {
        showPage('welcome');
    }

    // Load parking slots from localStorage if available
    const savedSlots = localStorage.getItem('parkingSlots');
    if (savedSlots) {
        try {
            parkingSlots = JSON.parse(savedSlots);
        } catch (e) {
            console.error('Error parsing parking slots:', e);
        }
    }

    // Load parking history from localStorage if available
    const savedHistory = localStorage.getItem('parkingHistory');
    if (savedHistory) {
        try {
            parkingHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Error parsing parking history:', e);
        }
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Update parking stats
    updateParkingStats();
    
    console.log('App initialized successfully');
});

// Detect if running in WebView
function detectWebView() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('wv') || 
        (userAgent.includes('android') && !userAgent.includes('chrome')) ||
        (userAgent.includes('applewebkit') && !userAgent.includes('safari'))) {
        isWebView = true;
        console.log("Running in WebView - camera may not work");
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("Camera API not available");
        isWebView = true;
    }
}

// Show WebView warning
function showWebViewWarning() {
    const warningElement = document.getElementById('webviewWarning');
    if (warningElement) {
        warningElement.style.display = 'block';
        
        const startScannerBtn = document.getElementById('startScanner');
        if (startScannerBtn) {
            startScannerBtn.disabled = true;
            startScannerBtn.innerHTML = '<i class="fas fa-ban"></i> Camera Not Available';
            startScannerBtn.style.background = '#95a5a6';
        }
        
        const placeholder = document.getElementById('scannerPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }
}

// Open web version
function openWebVersion() {
    alert("For best experience, please open this URL in Chrome/Safari:\n\nhttps://sachintha2new.github.io/PM-test\n\nOr save as PWA (Add to Home Screen)");
    window.open("https://sachintha2new.github.io/PM-test/", "_blank");
}

// Show native app building instructions
function showNativeInstructions() {
    alert("To build a proper APK with camera support:\n\n1. Use Capacitor (Recommended):\n   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera\n\n2. Use Cordova:\n   npm install -g cordova\n   cordova plugin add cordova-plugin-camera\n\n3. Or use React Native/Flutter with WebView\n\nSee documentation for detailed instructions.");
}

// Set up all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Menu and navigation - check if elements exist
    const menuButton = document.getElementById('menuButton');
    if (menuButton) menuButton.addEventListener('click', openMenu);
    
    const closeMenuBtn = document.getElementById('closeMenu');
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    
    const homeButton = document.getElementById('homeButton');
    if (homeButton) homeButton.addEventListener('click', goHome);
    
    // Menu items
    const menuHome = document.getElementById('menuHome');
    if (menuHome) menuHome.addEventListener('click', function(e) {
        e.preventDefault();
        goHome();
        closeMenu();
    });
    
    const menuAccount = document.getElementById('menuAccount');
    if (menuAccount) menuAccount.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentUser) {
            showAccountDetails();
        } else {
            showStatus(document.getElementById('mobileContent'), 'Please login first', 'error');
        }
        closeMenu();
    });
    
    const menuAbout = document.getElementById('menuAbout');
    if (menuAbout) menuAbout.addEventListener('click', function(e) {
        e.preventDefault();
        showPage('aboutSystem');
        closeMenu();
    });
    
    const menuLogout = document.getElementById('menuLogout');
    if (menuLogout) menuLogout.addEventListener('click', function(e) {
        e.preventDefault();
        handleLogout();
        closeMenu();
    });
    
    // Welcome page
    const selectLecturer = document.getElementById('selectLecturer');
    if (selectLecturer) selectLecturer.addEventListener('click', () => showPage('lecturerSignup'));
    
    const selectSecurity = document.getElementById('selectSecurity');
    if (selectSecurity) selectSecurity.addEventListener('click', () => showPage('securitySignup'));
    
    // Lecturer signup page
    const createLecturerAccountBtn = document.getElementById('createLecturerAccount');
    if (createLecturerAccountBtn) createLecturerAccountBtn.addEventListener('click', createLecturerAccount);
    
    const loginAsLecturer = document.getElementById('loginAsLecturer');
    if (loginAsLecturer) loginAsLecturer.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('lecturerLogin');
    });
    
    // Lecturer login page
    const loginLecturerButton = document.getElementById('loginLecturerButton');
    if (loginLecturerButton) loginLecturerButton.addEventListener('click', loginLecturer);
    
    const goToLecturerSignup = document.getElementById('goToLecturerSignupFromLogin');
    if (goToLecturerSignup) goToLecturerSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('lecturerSignup');
    });
    
    // Security signup page
    const createSecurityAccountBtn = document.getElementById('createSecurityAccount');
    if (createSecurityAccountBtn) createSecurityAccountBtn.addEventListener('click', createSecurityAccount);
    
    const loginAsSecurity = document.getElementById('loginAsSecurity');
    if (loginAsSecurity) loginAsSecurity.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('securityLogin');
    });
    
    // Security login page
    const loginSecurityButton = document.getElementById('loginSecurityButton');
    if (loginSecurityButton) loginSecurityButton.addEventListener('click', loginSecurity);
    
    const goToSecuritySignup = document.getElementById('goToSecuritySignupFromLogin');
    if (goToSecuritySignup) goToSecuritySignup.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('securitySignup');
    });
    
    // Lecturer dashboard
    const refreshParking = document.getElementById('refreshParking');
    if (refreshParking) refreshParking.addEventListener('click', updateParkingDisplay);
    
    // Security dashboard
    const startScannerBtn = document.getElementById('startScanner');
    if (startScannerBtn) startScannerBtn.addEventListener('click', startScanner);
    
    const stopScannerBtn = document.getElementById('stopScanner');
    if (stopScannerBtn) stopScannerBtn.addEventListener('click', stopScanner);
    
    const manualScanButton = document.getElementById('manualScanButton');
    if (manualScanButton) manualScanButton.addEventListener('click', handleManualScan);
    
    // Manual QR input - allow Enter key
    const manualQrInput = document.getElementById('manualQrInput');
    if (manualQrInput) manualQrInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleManualScan();
        }
    });
    
    console.log('Event listeners set up successfully');
}

// Open side menu
function openMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (sideMenu) sideMenu.style.left = '0';
    if (menuOverlay) menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close side menu
function closeMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (sideMenu) sideMenu.style.left = '-300px';
    if (menuOverlay) menuOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Go to home page based on user status
function goHome() {
    if (currentUser) {
        showDashboard(currentUser.role);
    } else {
        showPage('welcome');
    }
    closeMenu();
}

// Show specific page
function showPage(pageName) {
    console.log('Showing page:', pageName);
    
    // Hide all pages
    Object.keys(pages).forEach(key => {
        if (pages[key]) {
            pages[key].classList.remove('active');
        }
    });
    
    // Show the requested page
    if (pages[pageName]) {
        pages[pageName].classList.add('active');
    } else {
        console.error('Page not found:', pageName);
        showPage('welcome');
    }
    
    // Clear any status messages
    clearStatusMessages();
    
    // Stop scanner if moving away from security dashboard
    if (pageName !== 'securityDashboard' && scanner && isCameraActive) {
        stopScanner();
    }
    
    // Show WebView warning if on security dashboard and in WebView
    if (pageName === 'securityDashboard' && isWebView) {
        setTimeout(() => {
            showWebViewWarning();
        }, 500);
    }
}

// Show dashboard based on user role
function showDashboard(role) {
    if (role === 'lecturer') {
        showLecturerDashboard();
    } else if (role === 'security') {
        showSecurityDashboard();
    } else {
        showPage('welcome');
    }
}

// Show lecturer dashboard
function showLecturerDashboard() {
    showPage('lecturerDashboard');
    
    if (!currentUser) {
        showPage('welcome');
        return;
    }
    
    // Update user info
    const lecturerWelcome = document.getElementById('lecturerWelcome');
    const lecturerDeptInfo = document.getElementById('lecturerDeptInfo');
    const lecturerAvatar = document.getElementById('lecturerAvatar');
    
    if (lecturerWelcome) lecturerWelcome.textContent = `Welcome, ${currentUser.name}`;
    if (lecturerDeptInfo) lecturerDeptInfo.textContent = `Department: ${currentUser.department}`;
    if (lecturerAvatar) lecturerAvatar.textContent = currentUser.name.charAt(0);
    
    // Generate QR code
    generateQRCode(currentUser.qrCodeId);
    
    // Check if lecturer has an active parking slot
    const activeSlot = parkingSlots.find(slot => slot.occupiedBy === currentUser.qrCodeId);
    
    const lecturerParkingSlot = document.getElementById('lecturerParkingSlot');
    const lecturerSlotNumber = document.getElementById('lecturerSlotNumber');
    const slotTime = document.getElementById('slotTime');
    const slotStatus = document.getElementById('slotStatus');
    
    if (activeSlot) {
        if (lecturerParkingSlot) lecturerParkingSlot.style.display = 'block';
        if (lecturerSlotNumber) lecturerSlotNumber.textContent = activeSlot.number;
        
        if (activeSlot.occupiedAt) {
            const occupiedTime = new Date(activeSlot.occupiedAt);
            if (slotTime) slotTime.textContent = `Occupied since ${occupiedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
        if (slotStatus) slotStatus.textContent = 'Occupied';
    } else {
        if (lecturerParkingSlot) lecturerParkingSlot.style.display = 'none';
        if (lecturerSlotNumber) lecturerSlotNumber.textContent = '-';
        if (slotTime) slotTime.textContent = 'No active parking session';
        if (slotStatus) slotStatus.textContent = 'Not Assigned';
    }
    
    updateParkingDisplay();
}

// Show security dashboard
function showSecurityDashboard() {
    showPage('securityDashboard');
    
    if (!currentUser) {
        showPage('welcome');
        return;
    }
    
    // Update user info
    const securityWelcome = document.getElementById('securityWelcome');
    const securityIdInfo = document.getElementById('securityIdInfo');
    const securityAvatar = document.getElementById('securityAvatar');
    
    if (securityWelcome) securityWelcome.textContent = `Welcome, ${currentUser.name}`;
    if (securityIdInfo) securityIdInfo.textContent = `Security ID: ${currentUser.securityId}`;
    if (securityAvatar) securityAvatar.textContent = currentUser.name.charAt(0);
    
    updateParkingDisplay();
    updateParkingStats();
}

// Show account details
function showAccountDetails() {
    showPage('accountDetails');
    
    if (!currentUser) {
        showStatus(document.getElementById('mobileContent'), 'Please login first', 'error');
        showPage('welcome');
        return;
    }
    
    // Update profile info
    const accountName = document.getElementById('accountName');
    const accountRole = document.getElementById('accountRole');
    const accountAvatar = document.getElementById('accountAvatar');
    
    if (accountName) accountName.textContent = currentUser.name;
    if (accountRole) accountRole.textContent = currentUser.role === 'lecturer' ? 'Lecturer' : 'Security Officer';
    if (accountAvatar) accountAvatar.textContent = currentUser.name.charAt(0);
    
    // Update info section
    const infoName = document.getElementById('infoName');
    const infoRole = document.getElementById('infoRole');
    const infoDepartment = document.getElementById('infoDepartment');
    const infoSecurityId = document.getElementById('infoSecurityId');
    const infoQrCode = document.getElementById('infoQrCode');
    const infoCreated = document.getElementById('infoCreated');
    
    if (infoName) infoName.textContent = currentUser.name;
    if (infoRole) infoRole.textContent = currentUser.role === 'lecturer' ? 'Lecturer' : 'Security Officer';
    if (infoDepartment) infoDepartment.textContent = currentUser.department || '-';
    if (infoSecurityId) infoSecurityId.textContent = currentUser.securityId || '-';
    if (infoQrCode) infoQrCode.textContent = currentUser.qrCodeId || '-';
    if (infoCreated) infoCreated.textContent = currentUser.createdAt ? 
        new Date(currentUser.createdAt).toLocaleDateString() : '-';
    
    // Update parking info
    const activeSlot = parkingSlots.find(slot => slot.occupiedBy === currentUser.qrCodeId);
    const infoCurrentSlot = document.getElementById('infoCurrentSlot');
    if (infoCurrentSlot) infoCurrentSlot.textContent = activeSlot ? `Slot ${activeSlot.number}` : '-';
    
    const userEntries = parkingHistory.filter(p => p.userId === currentUser.id && p.action === 'Entry');
    const userExits = parkingHistory.filter(p => p.userId === currentUser.id && p.action === 'Exit');
    
    const infoLastEntry = document.getElementById('infoLastEntry');
    const infoLastExit = document.getElementById('infoLastExit');
    
    if (userEntries.length > 0) {
        const lastEntry = userEntries[userEntries.length - 1];
        if (infoLastEntry) infoLastEntry.textContent = new Date(lastEntry.timestamp).toLocaleString();
    } else {
        if (infoLastEntry) infoLastEntry.textContent = '-';
    }
    
    if (userExits.length > 0) {
        const lastExit = userExits[userExits.length - 1];
        if (infoLastExit) infoLastExit.textContent = new Date(lastExit.timestamp).toLocaleString();
    } else {
        if (infoLastExit) infoLastExit.textContent = '-';
    }
}

// Update menu profile
function updateMenuProfile() {
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (currentUser) {
        if (profileName) profileName.textContent = currentUser.name;
        if (profileRole) profileRole.textContent = currentUser.role === 'lecturer' ? 'Lecturer' : 'Security Officer';
        if (profileAvatar) profileAvatar.textContent = currentUser.name.charAt(0);
    } else {
        if (profileName) profileName.textContent = 'Guest User';
        if (profileRole) profileRole.textContent = 'Select a role';
        if (profileAvatar) profileAvatar.textContent = 'U';
    }
}

// Create lecturer account
function createLecturerAccount() {
    const name = document.getElementById('lecturerName');
    const department = document.getElementById('lecturerDept');
    const statusElement = document.getElementById('lecturerSignupStatus');
    
    if (!name || !department) {
        showStatus(statusElement, 'Form elements not found', 'error');
        return;
    }
    
    const nameValue = name.value.trim();
    const departmentValue = department.value;
    
    // Validation
    if (!nameValue || !departmentValue) {
        showStatus(statusElement, 'Please fill all fields', 'error');
        return;
    }
    
    // Generate QR code ID
    const qrCodeId = `UOM-LEC-${Date.now().toString().slice(-8)}`;
    
    // Generate unique ID for the user
    const userId = `LEC-${Date.now()}`;
    
    // Create user object
    const user = {
        id: userId,
        name: nameValue,
        department: departmentValue,
        role: 'lecturer',
        qrCodeId: qrCodeId,
        createdAt: new Date().toISOString()
    };
    
    // Save user to localStorage
    const users = JSON.parse(localStorage.getItem('parkingUsers') || '[]');
    users.push(user);
    localStorage.setItem('parkingUsers', JSON.stringify(users));
    
    // Set as current user
    currentUser = user;
    localStorage.setItem('parkingUser', JSON.stringify(currentUser));
    
    // Update menu profile
    updateMenuProfile();
    
    showStatus(statusElement, 'Account created successfully!', 'success');
    
    // Show dashboard after a delay
    setTimeout(() => {
        showLecturerDashboard();
    }, 1500);
}

// Login lecturer
function loginLecturer() {
    const nameInput = document.getElementById('lecturerLoginName');
    const statusElement = document.getElementById('lecturerLoginStatus');
    
    if (!nameInput) {
        showStatus(statusElement, 'Form not found', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    
    // Validation
    if (!name) {
        showStatus(statusElement, 'Please enter your name', 'error');
        return;
    }
    
    // Find user in localStorage
    const users = JSON.parse(localStorage.getItem('parkingUsers') || '[]');
    const user = users.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.role === 'lecturer'
    );
    
    if (user) {
        currentUser = user;
        localStorage.setItem('parkingUser', JSON.stringify(currentUser));
        
        // Update menu profile
        updateMenuProfile();
        
        showStatus(statusElement, 'Login successful!', 'success');
        
        // Show dashboard after a delay
        setTimeout(() => {
            showLecturerDashboard();
        }, 1500);
    } else {
        showStatus(statusElement, 'No account found. Please create an account first.', 'error');
    }
}

// Create security account
function createSecurityAccount() {
    const nameInput = document.getElementById('securityName');
    const securityIdInput = document.getElementById('securityId');
    const statusElement = document.getElementById('securitySignupStatus');
    
    if (!nameInput || !securityIdInput) {
        showStatus(statusElement, 'Form elements not found', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const securityId = securityIdInput.value.trim();
    
    // Validation
    if (!name || !securityId) {
        showStatus(statusElement, 'Please fill all fields', 'error');
        return;
    }
    
    // Generate unique ID for the user
    const userId = `SEC-${Date.now()}`;
    
    // Create user object
    const user = {
        id: userId,
        name: name,
        securityId: securityId,
        role: 'security',
        createdAt: new Date().toISOString()
    };
    
    // Save user to localStorage
    const users = JSON.parse(localStorage.getItem('parkingUsers') || '[]');
    users.push(user);
    localStorage.setItem('parkingUsers', JSON.stringify(users));
    
    // Set as current user
    currentUser = user;
    localStorage.setItem('parkingUser', JSON.stringify(currentUser));
    
    // Update menu profile
    updateMenuProfile();
    
    showStatus(statusElement, 'Account created successfully!', 'success');
    
    // Show dashboard after a delay
    setTimeout(() => {
        showSecurityDashboard();
    }, 1500);
}

// Login security officer
function loginSecurity() {
    const nameInput = document.getElementById('securityLoginName');
    const statusElement = document.getElementById('securityLoginStatus');
    
    if (!nameInput) {
        showStatus(statusElement, 'Form not found', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    
    // Validation
    if (!name) {
        showStatus(statusElement, 'Please enter your name', 'error');
        return;
    }
    
    // Find user in localStorage
    const users = JSON.parse(localStorage.getItem('parkingUsers') || '[]');
    const user = users.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.role === 'security'
    );
    
    if (user) {
        currentUser = user;
        localStorage.setItem('parkingUser', JSON.stringify(currentUser));
        
        // Update menu profile
        updateMenuProfile();
        
        showStatus(statusElement, 'Login successful!', 'success');
        
        // Show dashboard after a delay
        setTimeout(() => {
            showSecurityDashboard();
        }, 1500);
    } else {
        showStatus(statusElement, 'No account found. Please create an account first.', 'error');
    }
}

// Generate QR code
function generateQRCode(qrCodeId) {
    const qrCodeElement = document.getElementById('qrCode');
    const qrCodeIdElement = document.getElementById('qrCodeId');
    
    if (!qrCodeElement || !qrCodeIdElement) {
        console.error('QR code elements not found');
        return;
    }
    
    qrCodeElement.innerHTML = '';
    qrCodeIdElement.textContent = qrCodeId;
    
    // Generate QR code
    try {
        qrCodeInstance = new QRCode(qrCodeElement, {
            text: qrCodeId,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        console.error('Error generating QR code:', e);
        qrCodeElement.innerHTML = '<p style="color: red;">QR Code Error</p>';
    }
}

// Start QR scanner
function startScanner() {
    // Check if in WebView
    if (isWebView) {
        showScanResult('Camera not available in this app. Please use the web version in Chrome/Safari or build with Capacitor/Cordova.', 'error');
        return;
    }
    
    const scannerElement = document.getElementById('qrScanner');
    const placeholder = document.getElementById('scannerPlaceholder');
    const cameraPermissionMessage = document.getElementById('cameraPermissionMessage');
    
    if (!scannerElement || !placeholder || !cameraPermissionMessage) {
        showScanResult('Scanner elements not found', 'error');
        return;
    }
    
    // Hide placeholder and show camera permission message
    placeholder.style.display = 'none';
    cameraPermissionMessage.style.display = 'block';
    
    // Clear any previous scanner
    scannerElement.innerHTML = '';
    
    // Show loading state
    scannerElement.innerHTML = '<div style="color: white; text-align: center; padding-top: 120px;">Initializing camera...</div>';
    
    // Initialize scanner
    scanner = new Html5Qrcode("qrScanner");
    
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        scanner.stop().then(() => {
            const startScannerBtn = document.getElementById('startScanner');
            const stopScannerBtn = document.getElementById('stopScanner');
            
            if (startScannerBtn) startScannerBtn.style.display = 'inline-block';
            if (stopScannerBtn) stopScannerBtn.style.display = 'none';
            
            isCameraActive = false;
            cameraPermissionMessage.style.display = 'none';
            processScannedCode(decodedText);
        }).catch(err => {
            console.error("Failed to stop scanner", err);
        });
    };
    
    const config = { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };
    
    // Request camera permission and start scanner
    scanner.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
            if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission denied")) {
                showScanResult('Camera permission denied. Please allow camera access in your browser settings.', 'error');
                placeholder.style.display = 'flex';
                cameraPermissionMessage.style.display = 'none';
                
                const startScannerBtn = document.getElementById('startScanner');
                const stopScannerBtn = document.getElementById('stopScanner');
                
                if (startScannerBtn) startScannerBtn.style.display = 'inline-block';
                if (stopScannerBtn) stopScannerBtn.style.display = 'none';
                
                isCameraActive = false;
            } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("No camera found")) {
                showScanResult('No camera found on this device.', 'error');
                placeholder.style.display = 'flex';
                cameraPermissionMessage.style.display = 'none';
                
                const startScannerBtn = document.getElementById('startScanner');
                const stopScannerBtn = document.getElementById('stopScanner');
                
                if (startScannerBtn) startScannerBtn.style.display = 'inline-block';
                if (stopScannerBtn) stopScannerBtn.style.display = 'none';
                
                isCameraActive = false;
            }
        }
    ).then(() => {
        const startScannerBtn = document.getElementById('startScanner');
        const stopScannerBtn = document.getElementById('stopScanner');
        
        if (startScannerBtn) startScannerBtn.style.display = 'none';
        if (stopScannerBtn) stopScannerBtn.style.display = 'inline-block';
        
        isCameraActive = true;
        cameraPermissionMessage.style.display = 'none';
    }).catch(err => {
        console.error("Unable to start scanner", err);
        showScanResult('Unable to start camera. Please check permissions and try again.', 'error');
        placeholder.style.display = 'flex';
        cameraPermissionMessage.style.display = 'none';
        
        const startScannerBtn = document.getElementById('startScanner');
        const stopScannerBtn = document.getElementById('stopScanner');
        
        if (startScannerBtn) startScannerBtn.style.display = 'inline-block';
        if (stopScannerBtn) stopScannerBtn.style.display = 'none';
        
        isCameraActive = false;
    });
}

// Stop scanner
function stopScanner() {
    if (scanner && isCameraActive) {
        scanner.stop().then(() => {
            const startScannerBtn = document.getElementById('startScanner');
            const stopScannerBtn = document.getElementById('stopScanner');
            
            if (startScannerBtn) startScannerBtn.style.display = 'inline-block';
            if (stopScannerBtn) stopScannerBtn.style.display = 'none';
            
            isCameraActive = false;
            
            const placeholder = document.getElementById('scannerPlaceholder');
            const cameraPermissionMessage = document.getElementById('cameraPermissionMessage');
            
            if (placeholder) placeholder.style.display = 'flex';
            if (cameraPermissionMessage) cameraPermissionMessage.style.display = 'none';
            
            const scannerElement = document.getElementById('qrScanner');
            if (scannerElement) scannerElement.innerHTML = '';
        }).catch(err => {
            console.error("Failed to stop scanner", err);
        });
    }
}

// Handle manual scan
function handleManualScan() {
    const manualQrInput = document.getElementById('manualQrInput');
    if (!manualQrInput) return;
    
    const manualCode = manualQrInput.value.trim();
    if (manualCode) {
        processScannedCode(manualCode);
        manualQrInput.value = '';
    } else {
        showScanResult('Please enter a QR code', 'error');
    }
}

// Process scanned QR code
function processScannedCode(qrCodeId) {
    // Check if this is a UoM lecturer QR code
    if (!qrCodeId.startsWith('UOM-LEC-')) {
        showScanResult('Invalid QR code. Please scan a UoM lecturer QR code.', 'error');
        return;
    }
    
    // Find the lecturer with this QR code
    const users = JSON.parse(localStorage.getItem('parkingUsers') || '[]');
    const lecturer = users.find(u => u.qrCodeId === qrCodeId && u.role === 'lecturer');
    
    if (!lecturer) {
        showScanResult('Lecturer not found in database.', 'error');
        return;
    }
    
    // Check if lecturer already has a parking slot
    const existingSlotIndex = parkingSlots.findIndex(slot => slot.occupiedBy === qrCodeId);
    
    let resultMessage = '';
    let slotNumber = null;
    
    if (existingSlotIndex !== -1) {
        // Lecturer is leaving - release the slot
        slotNumber = parkingSlots[existingSlotIndex].number;
        parkingSlots[existingSlotIndex].occupied = false;
        parkingSlots[existingSlotIndex].occupiedBy = null;
        parkingSlots[existingSlotIndex].occupiedAt = null;
        parkingSlots[existingSlotIndex].lecturerName = null;
        
        // Add to parking history
        parkingHistory.push({
            userId: lecturer.id,
            userName: lecturer.name,
            slotNumber: slotNumber,
            action: 'Exit',
            timestamp: new Date().toISOString()
        });
        
        resultMessage = `Parking slot ${slotNumber} released for ${lecturer.name}.`;
    } else {
        // Lecturer is entering - assign a parking slot
        const availableSlotIndex = parkingSlots.findIndex(slot => !slot.occupied);
        
        if (availableSlotIndex === -1) {
            showScanResult('No parking slots available.', 'error');
            return;
        }
        
        // Assign the slot
        slotNumber = parkingSlots[availableSlotIndex].number;
        parkingSlots[availableSlotIndex].occupied = true;
        parkingSlots[availableSlotIndex].occupiedBy = qrCodeId;
        parkingSlots[availableSlotIndex].occupiedAt = new Date().toISOString();
        parkingSlots[availableSlotIndex].lecturerName = lecturer.name;
        
        // Add to parking history
        parkingHistory.push({
            userId: lecturer.id,
            userName: lecturer.name,
            slotNumber: slotNumber,
            action: 'Entry',
            timestamp: new Date().toISOString()
        });
        
        resultMessage = `Assigned parking slot ${slotNumber} to ${lecturer.name}.`;
    }
    
    // Save updated data
    localStorage.setItem('parkingSlots', JSON.stringify(parkingSlots));
    localStorage.setItem('parkingHistory', JSON.stringify(parkingHistory));
    
    // Show success message
    showScanResult(resultMessage, 'success');
    
    // Update displays
    updateParkingDisplay();
    updateParkingStats();
    
    // If current user is a lecturer with this QR code, update their dashboard
    if (currentUser && currentUser.qrCodeId === qrCodeId) {
        const activeSlot = parkingSlots.find(slot => slot.occupiedBy === qrCodeId);
        if (activeSlot) {
            const successMessage = document.getElementById('scanSuccessMessage');
            if (successMessage) successMessage.style.display = 'flex';
            
            const lecturerParkingSlot = document.getElementById('lecturerParkingSlot');
            const lecturerSlotNumber = document.getElementById('lecturerSlotNumber');
            const slotTime = document.getElementById('slotTime');
            const slotStatus = document.getElementById('slotStatus');
            
            if (lecturerParkingSlot) lecturerParkingSlot.style.display = 'block';
            if (lecturerSlotNumber) lecturerSlotNumber.textContent = activeSlot.number;
            
            if (activeSlot.occupiedAt) {
                const occupiedTime = new Date(activeSlot.occupiedAt);
                if (slotTime) slotTime.textContent = `Occupied since ${occupiedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            }
            if (slotStatus) slotStatus.textContent = 'Occupied';
            
            setTimeout(() => {
                if (successMessage) successMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Show scan result
function showScanResult(message, type) {
    const resultElement = document.getElementById('scanResult');
    const resultTitle = document.getElementById('scanResultTitle');
    const resultMessage = document.getElementById('scanResultMessage');
    
    if (!resultElement || !resultTitle || !resultMessage) return;
    
    resultElement.style.display = 'flex';
    
    if (type === 'success') {
        resultElement.className = 'scan-result';
        resultTitle.textContent = 'Success!';
        resultTitle.style.color = '#155724';
        resultMessage.textContent = message;
        
        setTimeout(() => {
            resultElement.style.display = 'none';
        }, 5000);
    } else {
        resultElement.className = 'scan-result scan-error';
        resultTitle.textContent = 'Error!';
        resultTitle.style.color = '#721c24';
        resultMessage.textContent = message;
        
        setTimeout(() => {
            resultElement.style.display = 'none';
        }, 5000);
    }
}

// Update parking display
function updateParkingDisplay() {
    // Update lecturer dashboard display
    const lecturerSlotsElement = document.getElementById('lecturerSlotsDisplay');
    if (lecturerSlotsElement) {
        lecturerSlotsElement.innerHTML = '';
        parkingSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `parking-slot-item ${slot.occupied ? 'occupied' : ''}`;
            slotElement.textContent = slot.number;
            
            const label = document.createElement('div');
            label.className = 'slot-label';
            label.textContent = slot.occupied ? 'Occupied' : 'Available';
            slotElement.appendChild(label);
            
            lecturerSlotsElement.appendChild(slotElement);
        });
    }
    
    // Update security dashboard display
    const securitySlotsElement = document.getElementById('securitySlotsDisplay');
    if (securitySlotsElement) {
        securitySlotsElement.innerHTML = '';
        parkingSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `parking-slot-item ${slot.occupied ? 'occupied' : ''}`;
            slotElement.textContent = slot.number;
            
            if (slot.occupied) {
                slotElement.title = `Occupied by ${slot.lecturerName || 'Lecturer'}`;
            }
            
            const label = document.createElement('div');
            label.className = 'slot-label';
            label.textContent = slot.occupied ? 'Occupied' : 'Available';
            slotElement.appendChild(label);
            
            securitySlotsElement.appendChild(slotElement);
        });
    }
}

// Update parking statistics
function updateParkingStats() {
    const availableSlots = parkingSlots.filter(slot => !slot.occupied).length;
    const occupiedSlots = parkingSlots.filter(slot => slot.occupied).length;
    
    const availableSlotsElement = document.getElementById('availableSlots');
    const occupiedSlotsElement = document.getElementById('occupiedSlots');
    
    if (availableSlotsElement) availableSlotsElement.textContent = availableSlots;
    if (occupiedSlotsElement) occupiedSlotsElement.textContent = occupiedSlots;
}

// Handle logout
function handleLogout() {
    // Stop scanner if active
    if (scanner && isCameraActive) {
        stopScanner();
    }
    
    // Clear current user
    currentUser = null;
    localStorage.removeItem('parkingUser');
    
    // Update menu profile
    updateMenuProfile();
    
    // Show welcome page
    showPage('welcome');
    
    // Close menu
    closeMenu();
}

// Show status message
function showStatus(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = `status-message status-${type}`;
    element.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Clear all status messages
function clearStatusMessages() {
    document.querySelectorAll('.status-message').forEach(element => {
        element.style.display = 'none';
    });
}

// Make functions globally accessible for onclick handlers
window.openWebVersion = openWebVersion;

window.showNativeInstructions = showNativeInstructions;



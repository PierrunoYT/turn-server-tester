// Configuration for TURN server
const turnConfig = {
    iceServers: [{
        urls: '',
        username: '',
        credential: ''
    }],
    iceCandidatePoolSize: 10
};

// Server presets
const serverPresets = {
    google: {
        urls: 'stun:stun.l.google.com:19302',
        username: '',
        credential: ''
    },
    openrelay: {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    twilio: {
        urls: 'stun:global.stun.twilio.com:3478',
        username: '',
        credential: ''
    }
};

// Initialize WebRTC connection
let peerConnection = null;
let dataChannel = null;

// UI Elements
let testStartTime;
let totalCandidates = 0;
let turnCandidates = 0;

// Input validation functions
function validateServerUrl(url) {
    if (!url.trim()) {
        return { valid: false, message: 'Server URL is required' };
    }
    
    const validProtocols = ['stun:', 'turn:', 'turns:'];
    const hasValidProtocol = validProtocols.some(protocol => url.startsWith(protocol));
    
    if (!hasValidProtocol) {
        return { valid: false, message: 'URL must start with stun:, turn:, or turns:' };
    }
    
    return { valid: true };
}

function validateCredentials(username, password, serverUrl) {
    if (serverUrl.startsWith('turn:') || serverUrl.startsWith('turns:')) {
        if (!username.trim() || !password.trim()) {
            return { valid: false, message: 'Username and credential are required for TURN servers' };
        }
    }
    return { valid: true };
}

// Check WebRTC Support
function checkWebRTCSupport() {
    const supportBanner = document.getElementById('browserSupport');
    if (navigator.mediaDevices && window.RTCPeerConnection) {
        supportBanner.innerHTML = '<i class="fas fa-check-circle"></i><span>WebRTC is supported in this browser</span>';
        supportBanner.classList.add('supported');
    } else {
        supportBanner.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>WebRTC is not supported in this browser</span>';
        supportBanner.classList.add('unsupported');
    }
}

// Function to update UI status
function updateStatus(message, type = 'info') {
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.innerHTML = `<i class="fas fa-circle"></i><span>${message}</span>`;
    statusIndicator.className = 'status-indicator ' + type;
}

// Function to add log entry
function addLogEntry(message, type = 'info') {
    const resultsLog = document.getElementById('resultsLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    resultsLog.appendChild(entry);
    resultsLog.scrollTop = resultsLog.scrollHeight;
}

// Function to add ICE candidate to detailed view
function addCandidateDetail(candidate) {
    const candidateList = document.querySelector('.candidate-list');
    const entry = document.createElement('div');
    entry.className = 'candidate-entry';
    entry.textContent = candidate;
    candidateList.appendChild(entry);
}

// Function to update statistics
function updateStats() {
    document.getElementById('candidateCount').textContent = totalCandidates;
    document.getElementById('turnCount').textContent = turnCandidates;
    if (testStartTime) {
        const duration = Math.round((Date.now() - testStartTime) / 1000);
        document.getElementById('testDuration').textContent = duration + 's';
    }
}

// Function to reset the test
function resetTest() {
    // Clear all input fields
    document.getElementById('serverUrl').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('icePolicy').value = 'all';
    document.getElementById('serverPresets').value = '';

    // Reset statistics
    totalCandidates = 0;
    turnCandidates = 0;
    testStartTime = null;
    updateStats();

    // Clear logs
    document.getElementById('resultsLog').innerHTML = '<div class="log-entry">System reset. Ready for testing...</div>';
    document.querySelector('.candidate-list').innerHTML = '';

    // Reset status
    updateStatus('READY');

    // Close existing connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }
}

// Function to handle preset selection
function handlePresetSelection(e) {
    const preset = serverPresets[e.target.value];
    if (preset) {
        document.getElementById('serverUrl').value = preset.urls;
        document.getElementById('username').value = preset.username;
        document.getElementById('password').value = preset.credential;
    }
}

// Function to toggle ICE candidates detail view
function toggleCandidateDetails() {
    const details = document.getElementById('candidateDetails');
    const button = document.getElementById('toggleCandidates');
    details.classList.toggle('collapsed');
    button.classList.toggle('active');
}

// Function to start the TURN server test
async function startTurnTest() {
    try {
        // Get configuration from UI
        const serverUrl = document.getElementById('serverUrl').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const icePolicy = document.getElementById('icePolicy').value;

        // Validate inputs
        const urlValidation = validateServerUrl(serverUrl);
        if (!urlValidation.valid) {
            updateStatus('ERROR', 'error');
            addLogEntry(`❌ ${urlValidation.message}`, 'error');
            return;
        }

        const credentialValidation = validateCredentials(username, password, serverUrl);
        if (!credentialValidation.valid) {
            updateStatus('ERROR', 'error');
            addLogEntry(`❌ ${credentialValidation.message}`, 'error');
            return;
        }

        // Reset counters and UI
        totalCandidates = 0;
        turnCandidates = 0;
        testStartTime = Date.now();

        // Clear previous results
        document.getElementById('resultsLog').innerHTML = '';
        document.querySelector('.candidate-list').innerHTML = '';

        // Update UI to testing state
        updateStatus('TESTING', 'testing');
        addLogEntry('Starting TURN server test...');

        // Update configuration
        turnConfig.iceServers[0].urls = serverUrl;
        turnConfig.iceServers[0].username = username;
        turnConfig.iceServers[0].credential = password;
        turnConfig.iceTransportPolicy = icePolicy;

        // Create new RTCPeerConnection with TURN config
        peerConnection = new RTCPeerConnection(turnConfig);
        addLogEntry('RTCPeerConnection created with TURN config');

        // Create a data channel to trigger ICE candidate gathering
        dataChannel = peerConnection.createDataChannel('testChannel');
        addLogEntry('Data channel created');

        // Listen for ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                totalCandidates++;
                
                // Safely parse candidate type
                const candidateParts = event.candidate.candidate.split(' ');
                const candidateType = candidateParts.length > 7 ? candidateParts[7] : 'unknown';
                
                addLogEntry(`New ICE candidate: ${candidateType}`, 'info');
                
                // Add the full candidate to the detailed view
                addCandidateDetail(event.candidate.candidate);

                if (event.candidate.candidate.includes('relay') || event.candidate.candidate.includes('typ relay')) {
                    turnCandidates++;
                    addLogEntry('✅ TURN server is working - Relay candidate found!', 'success');
                }
                updateStats();
            }
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState;
            addLogEntry(`ICE connection state: ${state}`);
            
            if (state === 'failed') {
                updateStatus('FAILED', 'error');
                addLogEntry('❌ ICE connection failed', 'error');
            }
        };

        // Log ICE gathering state changes
        peerConnection.onicegatheringstatechange = () => {
            const state = peerConnection.iceGatheringState;
            addLogEntry(`ICE gathering state: ${state}`);
            if (state === 'complete') {
                addLogEntry('ICE gathering completed');
                if (turnCandidates > 0) {
                    updateStatus('SUCCESS', 'success');
                    addLogEntry(`✅ Test completed successfully! Found ${turnCandidates} TURN candidate(s)`, 'success');
                } else {
                    updateStatus('FAILED', 'error');
                    addLogEntry('❌ No TURN candidates found. Check your configuration.', 'error');
                }
            }
        };

        // Set a timeout for the test
        setTimeout(() => {
            if (peerConnection && peerConnection.iceGatheringState !== 'complete') {
                addLogEntry('⚠️ Test timeout reached', 'warning');
                if (turnCandidates === 0) {
                    updateStatus('TIMEOUT', 'error');
                    addLogEntry('❌ Test timed out without finding TURN candidates', 'error');
                }
            }
        }, 10000); // 10 second timeout

        // Create offer to start ICE gathering
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        addLogEntry('Local description set, ICE gathering started');

    } catch (error) {
        updateStatus('ERROR', 'error');
        addLogEntry(`Error during TURN test: ${error.message}`, 'error');
        console.error('Error during TURN test:', error);
    }
}

// Initialize tooltips with proper cleanup
function initializeTooltips() {
    const tooltips = document.querySelectorAll('.tooltip-trigger');
    
    tooltips.forEach(tooltip => {
        const mouseEnterHandler = (e) => {
            // Remove any existing tooltips first
            document.querySelectorAll('.tooltip').forEach(t => t.remove());
            
            const content = e.target.getAttribute('data-tooltip');
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'tooltip';
            tooltipEl.textContent = content;
            document.body.appendChild(tooltipEl);
            
            const rect = e.target.getBoundingClientRect();
            tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
            tooltipEl.style.left = `${rect.left + (rect.width - tooltipEl.offsetWidth) / 2}px`;
        };
        
        const mouseLeaveHandler = () => {
            document.querySelectorAll('.tooltip').forEach(t => t.remove());
        };
        
        tooltip.addEventListener('mouseenter', mouseEnterHandler);
        tooltip.addEventListener('mouseleave', mouseLeaveHandler);
        
        // Store handlers for potential cleanup
        tooltip._tooltipHandlers = { mouseEnterHandler, mouseLeaveHandler };
    });
}

// Start the test when button is clicked
document.addEventListener('DOMContentLoaded', () => {
    checkWebRTCSupport();

    const startButton = document.getElementById('startTest');
    const resetButton = document.getElementById('resetTest');
    const presetSelect = document.getElementById('serverPresets');
    const toggleButton = document.getElementById('toggleCandidates');

    startButton.addEventListener('click', startTurnTest);
    resetButton.addEventListener('click', resetTest);
    presetSelect.addEventListener('change', handlePresetSelection);
    toggleButton.addEventListener('click', toggleCandidateDetails);

    initializeTooltips();
    updateStatus('READY');
});
// Configuration for TURN server
const turnConfig = {
    iceServers: [{
        urls: 'turn:example.com:3478',  // This will be configurable later
        username: 'test',               // Placeholder credentials
        credential: 'test123'
    }],
    iceCandidatePoolSize: 10
};

// Initialize WebRTC connection
let peerConnection = null;
let dataChannel = null;

// UI Elements
let testStartTime;
let totalCandidates = 0;
let turnCandidates = 0;

// Function to update UI status
function updateStatus(message, type = 'info') {
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.textContent = message;
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

// Function to update statistics
function updateStats() {
    document.getElementById('candidateCount').textContent = totalCandidates;
    document.getElementById('turnCount').textContent = turnCandidates;
    if (testStartTime) {
        const duration = Math.round((Date.now() - testStartTime) / 1000);
        document.getElementById('testDuration').textContent = duration + 's';
    }
}

// Function to start the TURN server test
async function startTurnTest() {
    try {
        // Reset counters and UI
        totalCandidates = 0;
        turnCandidates = 0;
        testStartTime = Date.now();
        
        // Update UI to testing state
        updateStatus('TESTING', 'testing');
        addLogEntry('Starting TURN server test...');
        
        // Get configuration from UI
        const serverUrl = document.getElementById('serverUrl').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const icePolicy = document.getElementById('icePolicy').value;

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
                const candidateType = event.candidate.candidate.split(' ')[7];
                addLogEntry(`New ICE candidate: ${candidateType}`, 'info');
                
                if (event.candidate.candidate.includes('relay')) {
                    turnCandidates++;
                    addLogEntry('✅ TURN server is working - Relay candidate found!', 'success');
                }
                updateStats();
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
                } else {
                    updateStatus('FAILED', 'error');
                    addLogEntry('❌ No TURN candidates found. Check your configuration.', 'error');
                }
            }
        };

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

// Initialize tooltips
function initializeTooltips() {
    const tooltips = document.querySelectorAll('.tooltip-trigger');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', (e) => {
            const content = e.target.getAttribute('data-tooltip');
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'tooltip';
            tooltipEl.textContent = content;
            document.body.appendChild(tooltipEl);
            
            const rect = e.target.getBoundingClientRect();
            tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
            tooltipEl.style.left = `${rect.left + (rect.width - tooltipEl.offsetWidth) / 2}px`;
        });
        
        tooltip.addEventListener('mouseleave', () => {
            const tooltips = document.querySelectorAll('.tooltip');
            tooltips.forEach(t => t.remove());
        });
    });
}

// Start the test when button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startTest');
    startButton.addEventListener('click', startTurnTest);
    initializeTooltips();
    updateStatus('READY');
});
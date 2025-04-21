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

// Function to start the TURN server test
async function startTurnTest() {
    try {
        // Create new RTCPeerConnection with TURN config
        peerConnection = new RTCPeerConnection(turnConfig);
        console.log('RTCPeerConnection created with TURN config');

        // Create a data channel to trigger ICE candidate gathering
        dataChannel = peerConnection.createDataChannel('testChannel');
        console.log('Data channel created');

        // Listen for ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Log the ICE candidate
                console.log('New ICE candidate:', event.candidate.candidate);
                
                // Check if this is a TURN candidate
                if (event.candidate.candidate.includes('relay')) {
                    console.log('✅ TURN server is working - Relay candidate found!');
                }
            }
        };

        // Log ICE gathering state changes
        peerConnection.onicegatheringstatechange = () => {
            console.log('ICE gathering state:', peerConnection.iceGatheringState);
            
            if (peerConnection.iceGatheringState === 'complete') {
                console.log('ICE gathering completed');
            }
        };

        // Create offer to start ICE gathering
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Local description set, ICE gathering started');

    } catch (error) {
        console.error('Error during TURN test:', error);
    }
}

// Start the test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting TURN server test...');
    startTurnTest();
});
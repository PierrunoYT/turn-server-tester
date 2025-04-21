# WebRTC TURN Server Tester

A minimalist Web-based User Interface (WebUI) designed to test and validate TURN server configurations for WebRTC applications. This tool helps quickly verify whether a given TURN server is reachable, usable, and correctly relays ICE candidates for peer-to-peer connections.

## Features

- 🔄 Test TURN/STUN server connectivity
- 📊 Real-time ICE candidate gathering statistics
- 🔍 Detailed ICE candidate inspection
- 🎨 Cyberpunk-inspired UI design
- 📱 Responsive layout
- ⚡ Common server presets included

## Quick Start

1. Open `index.html` in a modern web browser
2. Select a preset or enter your TURN server details:
   - Server URL (e.g., turn:example.com:3478)
   - Username
   - Credential
3. Choose ICE transport policy
4. Click "START TEST"

## Preset Servers

The tool includes several preset server configurations:
- Google STUN Server
- OpenRelay TURN Server
- Twilio STUN Server

## Testing Process

1. Establishes WebRTC connection
2. Gathers ICE candidates
3. Identifies TURN relay candidates
4. Displays detailed results

## Browser Support

Requires a modern browser with WebRTC support. Tested on:
- Chrome
- Firefox
- Safari
- Edge

## Development

This is a vanilla JavaScript project with no build steps required. Simply clone the repository and open `index.html` in your browser.

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
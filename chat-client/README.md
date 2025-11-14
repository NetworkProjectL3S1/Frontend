# WebSocket Chat Client

A modern, responsive web client for the Java WebSocket Chat Server.

## Features

- 🌐 Real-time WebSocket communication
- 💬 Multiple message types (user, bot, system, private)
- 🔄 Automatic reconnection with exponential backoff
- 📱 Responsive design for mobile and desktop
- 🎨 Modern UI with smooth animations
- ⚡ Organized code structure with separation of concerns
- 🔒 XSS protection with HTML escaping
- ⌨️ Keyboard shortcuts (Enter to send/connect)

## Project Structure

```
chat-client/
├── index.html              # Main HTML file
├── README.md              # This file
├── package.json           # Project configuration (optional)
└── src/
    ├── styles/
    │   └── main.css       # All CSS styles
    └── js/
        └── chat-client.js # JavaScript client logic
```

## Getting Started

### Prerequisites

- Java WebSocket Chat Server running on `localhost:8080`
- Modern web browser with WebSocket support

### Running the Client

1. **Simple HTTP Server** (Recommended for local development):
   ```bash
   # Using Python 3
   python -m http.server 3000
   
   # Using Python 2
   python -m SimpleHTTPServer 3000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 3000
   
   # Using PHP
   php -S localhost:3000
   ```

2. **Direct File Access**:
   Simply open `index.html` in your browser (some features may be limited)

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Connecting
1. Enter a username (alphanumeric characters, underscore, and hyphen only)
2. Click "Connect" or press Enter
3. Wait for connection confirmation

### Chat Commands
- `/help` - Show available commands
- `/users` - List connected users
- `/time` - Get current server time
- `/bot <message>` - Chat with the bot
- `/pm <username> <message>` - Send private message
- `/quit` - Disconnect from server

### Features

#### Auto-Reconnection
- Automatically attempts to reconnect if connection is lost
- Maximum of 5 reconnection attempts
- 30-second intervals between attempts
- Visual feedback during reconnection process

#### Message Types
- **User Messages**: Your own messages (blue background)
- **Other Users**: Messages from other users (yellow background)
- **Bot Messages**: ChatBot responses (green background)
- **System Messages**: Server notifications (gray background)

#### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly interface
- Touch-friendly buttons and inputs

## Configuration

### WebSocket Server URL
The client connects to `ws://localhost:8080/chat` by default. To change this:

1. Open `src/js/chat-client.js`
2. Find the line: `this.socket = new WebSocket('ws://localhost:8080/chat');`
3. Replace with your server URL

### Reconnection Settings
In `src/js/chat-client.js`, modify these properties in the constructor:
```javascript
this.maxReconnectAttempts = 5;     // Maximum reconnection attempts
this.reconnectInterval = 30000;    // Interval between attempts (ms)
```

## Development

### File Organization

- **HTML** (`index.html`): Structure and layout
- **CSS** (`src/styles/main.css`): All styling and responsive design
- **JavaScript** (`src/js/chat-client.js`): Client logic and WebSocket handling

### Key Classes and Functions

#### ChatClient Class
- `connect()`: Establish WebSocket connection
- `disconnect()`: Close connection
- `sendMessage()`: Send message to server
- `displayMessage()`: Add message to chat area
- `attemptReconnect()`: Handle automatic reconnection

### Browser Compatibility
- Modern browsers with WebSocket support
- Chrome 16+, Firefox 11+, Safari 7+, Edge 12+
- Mobile browsers on iOS 4.2+ and Android 4.4+

## Troubleshooting

### Connection Issues
1. Ensure the Java server is running on `localhost:8080`
2. Check browser console for error messages
3. Verify WebSocket support in your browser
4. Check firewall settings

### Performance Issues
1. Clear browser cache
2. Check for JavaScript errors in console
3. Ensure stable network connection

### Mobile Issues
1. Use landscape orientation for better experience
2. Ensure touch events are working properly
3. Check viewport meta tag configuration

## License

This project is part of the Network Programming coursework.

## Contributing

1. Follow the existing code style
2. Add comments for complex functions
3. Test on multiple browsers
4. Ensure responsive design works on mobile devices

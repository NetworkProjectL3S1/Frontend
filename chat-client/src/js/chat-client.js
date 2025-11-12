/**
 * WebSocket Chat Client
 * Handles connection to Java WebSocket server and manages chat functionality
 */
class ChatClient {
    constructor() {
        this.socket = null;
        this.username = '';
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 30000; // 30 seconds
        
        // DOM elements
        this.elements = {
            chatMessages: document.getElementById('chatMessages'),
            usernameContainer: document.getElementById('usernameContainer'),
            chatInputContainer: document.getElementById('chatInputContainer'),
            usernameInput: document.getElementById('usernameInput'),
            messageInput: document.getElementById('messageInput'),
            connectionStatus: document.getElementById('connectionStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            commandHelp: document.getElementById('commandHelp')
        };
        
        this.init();
    }
    
    /**
     * Initialize the chat client
     */
    init() {
        this.setupEventListeners();
        this.focusUsernameInput();
        this.startReconnectTimer();
    }
    
    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Enter key listeners
        this.elements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connect();
            }
        });
        
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Window load listener
        window.addEventListener('load', () => {
            this.focusUsernameInput();
        });
        
        // Handle page visibility for reconnection
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isConnected && this.username) {
                this.attemptReconnect();
            }
        });
    }
    
    /**
     * Connect to the WebSocket server
     */
    connect() {
        const enteredUsername = this.elements.usernameInput.value.trim();
        
        if (!this.validateUsername(enteredUsername)) {
            return;
        }
        
        this.username = enteredUsername;
        
        try {
            // Close existing connection if any
            if (this.socket) {
                this.socket.close();
            }
            
            this.socket = new WebSocket('ws://localhost:8080/chat');
            this.setupWebSocketHandlers();
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.showError('Failed to connect to server. Make sure the server is running on localhost:8080');
        }
    }
    
    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        this.socket.onopen = (event) => {
            console.log('Connected to WebSocket server');
            this.updateConnectionStatus(true);
            this.reconnectAttempts = 0;
            
            // Send username to server
            this.socket.send(this.username);
        };
        
        this.socket.onmessage = (event) => {
            this.displayMessage(event.data);
        };
        
        this.socket.onclose = (event) => {
            console.log('Disconnected from WebSocket server');
            this.updateConnectionStatus(false);
            this.displayMessage('[SYSTEM] Disconnected from server', 'system');
            
            // Attempt reconnection if not intentional disconnect
            if (event.code !== 1000 && this.username) {
                this.scheduleReconnect();
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.displayMessage('[ERROR] Connection failed. Make sure the server is running on localhost:8080', 'system');
            this.updateConnectionStatus(false);
        };
    }
    
    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket && this.isConnected) {
            this.socket.send('/quit');
            this.socket.close(1000, 'User requested disconnect'); // Normal closure
        }
        this.updateConnectionStatus(false);
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    }
    
    /**
     * Send a message to the server
     */
    sendMessage() {
        const message = this.elements.messageInput.value.trim();
        
        if (!message || !this.isConnected) {
            return;
        }
        
        if (message.length > 500) {
            this.showError('Message too long (max 500 characters)');
            return;
        }
        
        try {
            this.socket.send(message);
            this.elements.messageInput.value = '';
        } catch (error) {
            console.error('Failed to send message:', error);
            this.displayMessage('[ERROR] Failed to send message', 'system');
        }
    }
    
    /**
     * Display a message in the chat area
     */
    displayMessage(message, type = 'other') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // Add timestamp
        const now = new Date();
        const time = now.toLocaleTimeString();
        
        // Detect message type based on content
        const detectedType = this.detectMessageType(message);
        if (detectedType) {
            messageDiv.className = `message ${detectedType}`;
        }
        
        messageDiv.innerHTML = `
            <div class="message-time">${time}</div>
            <div>${this.escapeHtml(message)}</div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
    
    /**
     * Detect message type based on content
     */
    detectMessageType(message) {
        if (message.includes('[SYSTEM]') || message.includes('* ') || message.includes('[ERROR]')) {
            return 'system';
        } else if (message.includes('[ChatBot]')) {
            return 'bot';
        } else if (message.includes(`<${this.username}>`)) {
            return 'user';
        }
        return 'other';
    }
    
    /**
     * Update connection status UI
     */
    updateConnectionStatus(connected) {
        this.isConnected = connected;
        
        if (connected) {
            this.elements.connectionStatus.textContent = `Connected as ${this.username}`;
            this.elements.statusIndicator.className = 'status-indicator status-connected';
            this.elements.usernameContainer.classList.add('hidden');
            this.elements.chatInputContainer.classList.remove('hidden');
            this.elements.commandHelp.classList.add('hidden');
            this.elements.messageInput.focus();
        } else {
            this.elements.connectionStatus.textContent = 'Disconnected';
            this.elements.statusIndicator.className = 'status-indicator status-disconnected';
            this.elements.usernameContainer.classList.remove('hidden');
            this.elements.chatInputContainer.classList.add('hidden');
            this.elements.commandHelp.classList.remove('hidden');
            this.focusUsernameInput();
        }
    }
    
    /**
     * Validate username input
     */
    validateUsername(username) {
        if (!username) {
            this.showError('Please enter a username');
            return false;
        }
        
        if (username.length > 20) {
            this.showError('Username must be 20 characters or less');
            return false;
        }
        
        // Additional validation rules
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            this.showError('Username can only contain letters, numbers, underscores, and hyphens');
            return false;
        }
        
        return true;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show error message
     */
    showError(message) {
        alert(message);
        console.error(message);
    }
    
    /**
     * Focus username input
     */
    focusUsernameInput() {
        setTimeout(() => {
            this.elements.usernameInput.focus();
        }, 100);
    }
    
    /**
     * Attempt to reconnect to the server
     */
    attemptReconnect() {
        if (this.isConnected || !this.username || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }
        
        console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.displayMessage(`[SYSTEM] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'system');
        
        this.connect();
    }
    
    /**
     * Schedule a reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.attemptReconnect();
            }, this.reconnectInterval);
        } else {
            this.displayMessage('[SYSTEM] Maximum reconnection attempts reached. Please refresh the page or click Connect to try again.', 'system');
        }
    }
    
    /**
     * Start the reconnection timer
     */
    startReconnectTimer() {
        setInterval(() => {
            this.attemptReconnect();
        }, this.reconnectInterval);
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            username: this.username,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Initialize the chat client when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatClient = new ChatClient();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatClient;
}

import { io } from 'socket.io-client';

// Notification WebSocket Events (keep in sync with backend)
export enum NotificationEvents {
  // Review events
  NEW_REVIEW = 'new-review',
  REVIEW_UPDATED = 'review_updated',
  REVIEW_DELETED = 'review_deleted',
  
  // Product events
  PRODUCT_CREATED = 'product:created',
  PRODUCT_UPDATED = 'product:updated',
  PRODUCT_DELETED = 'product:deleted',
}

export class NotificationService {
  private socket;
  private listeners = new Map();
  private connected = false;

  constructor(baseUrl) {
    // Connect to the WebSocket server
    this.socket = io(baseUrl, {
      withCredentials: true, // Important for authenticated sessions
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Setup connection event handlers
    this.socket.on('connect', () => {
      console.log('Connected to notification WebSocket');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Disconnected from notification WebSocket: ${reason}`);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected = false;
    });
  }

  isConnected() {
    return this.connected;
  }

  // =========== SUBSCRIPTION METHODS ===========
  
  // Product event subscriptions
  subscribeToProductCreated(callback) {
    this.addListener(NotificationEvents.PRODUCT_CREATED, callback);
  }

  subscribeToProductUpdated(callback) {
    this.addListener(NotificationEvents.PRODUCT_UPDATED, callback);
  }

  subscribeToProductDeleted(callback) {
    this.addListener(NotificationEvents.PRODUCT_DELETED, callback);
  }
  
  // Review event subscriptions
  subscribeToNewReview(callback) {
    this.addListener(NotificationEvents.NEW_REVIEW, callback);
  }
  
  subscribeToReviewUpdated(callback) {
    this.addListener(NotificationEvents.REVIEW_UPDATED, callback);
  }
  
  subscribeToReviewDeleted(callback) {
    this.addListener(NotificationEvents.REVIEW_DELETED, callback);
  }

  // Helper method to add event listeners
  private addListener(event, callback) {
    // Store callback reference for later removal
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Add socket event listener
    this.socket.on(event, callback);
    
    return () => this.unsubscribeFrom(event, callback); // Return unsubscribe function
  }

  // Unsubscribe from specific event and callback
  unsubscribeFrom(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      if (callbacks.has(callback)) {
        callbacks.delete(callback);
        this.socket.off(event, callback);
      }
    }
  }

  // Join a specific room (useful for user-specific notifications)
  joinRoom(roomId) {
    if (this.connected && roomId) {
      this.socket.emit('join', roomId);
    }
  }
  
  // Leave a specific room
  leaveRoom(roomId) {
    if (this.connected && roomId) {
      this.socket.emit('leave', roomId);
    }
  }

  // Clean up all subscriptions
  disconnect() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.off(event, callback);
      });
    });
    this.listeners.clear();
    this.socket.disconnect();
    this.connected = false;
  }
}

// Create a singleton instance
const WEBSOCKET_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
export const notificationService = new NotificationService(WEBSOCKET_BASE_URL);

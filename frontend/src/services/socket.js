import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8082';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
      
      // For testing/mocking if real data isn't flowing
      // this.startMockData();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(event, callback) {
    if (!this.socket) this.connect();
    this.socket.on(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
  
  // Method to simulate location updates for testing
  startMockData() {
    setInterval(() => {
      if (this.socket) {
        // Create mock data
        const mockData = {
          reg: 'MH12AB1234',
          lat: 18.5204 + (Math.random() - 0.5) * 0.01,
          lon: 73.8567 + (Math.random() - 0.5) * 0.01,
          status: 'Active',
          timestamp: new Date().toISOString()
        };
        // Pretend we received it from server on '/topic/location'
        this.socket.emit('/topic/location', mockData); // Actually emit to self just to trigger any on-listeners if needed
        // Since we are mocking on the client side, we can just trigger the callback directly but let's keep it simple
      }
    }, 2000);
  }
}

export const socketService = new SocketService();

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const SOCKET_URL = BASE_URL.replace('/api/v1', '/ws-fleet');

class SocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.activeSubscriptions = new Map();
  }

  connect() {
    if (!this.client) {
      this.client = new Client({
        webSocketFactory: () => new SockJS(SOCKET_URL),
        debug: (str) => console.log('STOMP: ' + str),
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('Connected to STOMP broker');
          this.subscriptions.forEach((callback, event) => {
            this._doSubscribe(event, callback);
          });
        },
        onStompError: (frame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
        }
      });
      this.client.activate();
    }
    return this.client;
  }

  _doSubscribe(event, callback) {
    const topic = event === 'location' ? '/topic/location' : event;
    if (this.activeSubscriptions.has(event)) {
      this.activeSubscriptions.get(event).unsubscribe();
    }
    const sub = this.client.subscribe(topic, (message) => {
      callback(JSON.parse(message.body));
    });
    this.activeSubscriptions.set(event, sub);
  }

  subscribe(event, callback) {
    this.subscriptions.set(event, callback);
    if (this.client && this.client.connected) {
      this._doSubscribe(event, callback);
    } else {
      this.connect();
    }
  }

  unsubscribe(event) {
    if (this.activeSubscriptions.has(event)) {
      this.activeSubscriptions.get(event).unsubscribe();
      this.activeSubscriptions.delete(event);
    }
    this.subscriptions.delete(event);
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.activeSubscriptions.clear();
      this.subscriptions.clear();
    }
  }
}

export const socketService = new SocketService();

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8082/ws";

let stompClient: Client | null = null;
const subscriptions = new Map<string, { id: any; callbacks: Set<(msg: any) => void> }>();

export function connectWebSocket(): Promise<Client> {
  return new Promise((resolve, reject) => {
    if (stompClient?.connected) {
      resolve(stompClient);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("WebSocket connected");
        stompClient = client;
        // Resubscribe on reconnect
        subscriptions.forEach((sub, topic) => {
          const newSub = client.subscribe(topic, (message) => {
            try {
              const body = JSON.parse(message.body);
              sub.callbacks.forEach((cb) => cb(body));
            } catch { /* ignore parse errors */ }
          });
          sub.id = newSub;
        });
        resolve(client);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers.message);
        reject(new Error(frame.headers.message));
      },
    });

    client.activate();
  });
}

export function subscribe(topic: string, callback: (data: any) => void): () => void {
  if (!subscriptions.has(topic)) {
    subscriptions.set(topic, { id: null, callbacks: new Set() });

    if (stompClient?.connected) {
      const sub = stompClient.subscribe(topic, (message) => {
        try {
          const body = JSON.parse(message.body);
          subscriptions.get(topic)?.callbacks.forEach((cb) => cb(body));
        } catch { /* ignore */ }
      });
      subscriptions.get(topic)!.id = sub;
    }
  }

  subscriptions.get(topic)!.callbacks.add(callback);

  // Return unsubscribe function
  return () => {
    const entry = subscriptions.get(topic);
    if (entry) {
      entry.callbacks.delete(callback);
      if (entry.callbacks.size === 0) {
        entry.id?.unsubscribe?.();
        subscriptions.delete(topic);
      }
    }
  };
}

export function disconnectWebSocket() {
  if (stompClient?.connected) {
    stompClient.deactivate();
    stompClient = null;
    subscriptions.clear();
  }
}

import { MessageQueueService } from "./types";

export class MockQueueService implements MessageQueueService {
    async connect(): Promise<void> {
        console.log("[MockQueue] Connected");
    }

    async disconnect(): Promise<void> {
        console.log("[MockQueue] Disconnected");
    }

    async publish(topic: string, event: string, data: any): Promise<void> {
        console.log(`[MockQueue] Published to ${topic}: ${event}`, data);
    }

    async subscribe(topic: string, handler: (event: string, data: any) => Promise<void>): Promise<void> {
        console.log(`[MockQueue] Subscribed to ${topic}`);
    }
}

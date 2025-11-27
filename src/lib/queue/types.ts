export interface MessageQueueService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(topic: string, event: string, data: any): Promise<void>;
    subscribe(topic: string, handler: (event: string, data: any) => Promise<void>): Promise<void>;
}

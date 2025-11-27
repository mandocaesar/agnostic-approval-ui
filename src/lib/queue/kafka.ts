import { Kafka, Producer, Consumer } from "kafkajs";
import { MessageQueueService } from "./types";

export class KafkaService implements MessageQueueService {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer | null = null;
    private isConnected = false;

    constructor(clientId: string, brokers: string[]) {
        this.kafka = new Kafka({
            clientId,
            brokers,
        });
        this.producer = this.kafka.producer();
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;
        try {
            await this.producer.connect();
            this.isConnected = true;
            console.log("Kafka producer connected");
        } catch (error) {
            console.error("Failed to connect to Kafka:", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected) return;
        await this.producer.disconnect();
        if (this.consumer) {
            await this.consumer.disconnect();
        }
        this.isConnected = false;
    }

    async publish(topic: string, event: string, data: any): Promise<void> {
        if (!this.isConnected) await this.connect();

        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: event,
                        value: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
                    },
                ],
            });
            console.log(`Published event ${event} to topic ${topic}`);
        } catch (error) {
            console.error(`Failed to publish event ${event} to topic ${topic}:`, error);
            throw error;
        }
    }

    async subscribe(topic: string, handler: (event: string, data: any) => Promise<void>): Promise<void> {
        if (!this.consumer) {
            this.consumer = this.kafka.consumer({ groupId: "approval-service-group" });
            await this.consumer.connect();
        }

        await this.consumer.subscribe({ topic, fromBeginning: false });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;
                try {
                    const payload = JSON.parse(message.value.toString());
                    await handler(payload.event, payload.data);
                } catch (error) {
                    console.error("Error processing message:", error);
                }
            },
        });
    }
}

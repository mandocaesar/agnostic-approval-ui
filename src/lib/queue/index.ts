import { KafkaService } from "./kafka";
import { MockQueueService } from "./mock";
import { MessageQueueService } from "./types";

const ENABLE_KAFKA = process.env.ENABLE_KAFKA === "true";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

export const mq: MessageQueueService = ENABLE_KAFKA
    ? new KafkaService("approval-service", KAFKA_BROKERS)
    : new MockQueueService();

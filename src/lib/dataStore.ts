import { promises as fs } from "fs";
import path from "path";
import { MockData } from "@/types";

const DATA_PATH = path.join(process.cwd(), "src", "data", "mockData.json");

export async function readData(): Promise<MockData> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as MockData;
}

export async function writeData(data: MockData): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function generateId(prefix: string): string {
  const random = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

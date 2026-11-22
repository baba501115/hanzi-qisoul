import { openDB, type IDBPDatabase } from "idb";
import type { PracticeAttempt, ReviewItem } from "@/types";

interface HanziFlowDB {
  reviewItems: ReviewItem;
  attempts: PracticeAttempt;
}

const DB_NAME = "hanziflow";
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HanziFlowDB>> | null = null;

function getDB(): Promise<IDBPDatabase<HanziFlowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HanziFlowDB>(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("reviewItems")) {
          const store = db.createObjectStore("reviewItems", { keyPath: "char" });
          store.createIndex("dueDate", "dueDate");
        }
        if (!db.objectStoreNames.contains("attempts")) {
          const store = db.createObjectStore("attempts", { keyPath: "id" });
          store.createIndex("char", "char");
          store.createIndex("createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

const available = typeof indexedDB !== "undefined";

export async function getAllReviewItems(): Promise<ReviewItem[]> {
  if (!available) return [];
  try {
    return await (await getDB()).getAll("reviewItems");
  } catch {
    return [];
  }
}

export async function putReviewItem(item: ReviewItem): Promise<void> {
  if (!available) return;
  try {
    await (await getDB()).put("reviewItems", item);
  } catch {
    /* 忽略写入失败 */
  }
}

export async function putReviewItems(items: ReviewItem[]): Promise<void> {
  if (!available || items.length === 0) return;
  try {
    const db = await getDB();
    const tx = db.transaction("reviewItems", "readwrite");
    await Promise.all(items.map((it) => tx.store.put(it)));
    await tx.done;
  } catch {
    /* 忽略写入失败 */
  }
}

export async function getAllAttempts(): Promise<PracticeAttempt[]> {
  if (!available) return [];
  try {
    return await (await getDB()).getAll("attempts");
  } catch {
    return [];
  }
}

export async function putAttempt(attempt: PracticeAttempt): Promise<void> {
  if (!available) return;
  try {
    await (await getDB()).put("attempts", attempt);
  } catch {
    /* 忽略写入失败 */
  }
}

export async function clearAll(): Promise<void> {
  if (!available) return;
  try {
    const db = await getDB();
    await Promise.all([db.clear("reviewItems"), db.clear("attempts")]);
  } catch {
    /* 忽略清除失败 */
  }
}

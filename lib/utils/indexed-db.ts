/**
 * IndexedDBラッパークラス
 * localStorageの代替として使用
 *
 * 特徴:
 * - 非同期API
 * - 構造化データ対応
 * - より大きな容量
 * - トランザクション管理
 */

import { openDB, IDBPDatabase, DBSchema } from "idb";

/**
 * データベーススキーマ定義
 */
interface JourneeDBSchema extends DBSchema {
  // UI状態（パネル幅、選択AI、自動進行設定など）
  ui_state: {
    key: string;
    value: any;
  };
  // アプリケーション設定
  settings: {
    key: string;
    value: any;
  };
  // キャッシュデータ（公開しおりなど）
  cache: {
    key: string;
    value: any;
    indexes: { "by-timestamp": number };
  };
  // Zustandストア永続化
  store_state: {
    key: string;
    value: any;
  };
}

/**
 * IndexedDBラッパークラス
 */
class JourneeDB {
  private static instance: JourneeDB;
  private db: IDBPDatabase<JourneeDBSchema> | null = null;
  private readonly DB_NAME = "journee-db";
  private readonly VERSION = 1;

  private constructor() {}

  /**
   * シングルトンインスタンスの取得
   */
  static getInstance(): JourneeDB {
    if (!JourneeDB.instance) {
      JourneeDB.instance = new JourneeDB();
    }
    return JourneeDB.instance;
  }

  /**
   * データベースの初期化
   */
  async init(): Promise<void> {
    if (this.db) {
      return; // 既に初期化済み
    }

    try {
      this.db = await openDB<JourneeDBSchema>(this.DB_NAME, this.VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // バージョン1: 初期スキーマ作成
          if (oldVersion < 1) {
            // UI状態ストア
            if (!db.objectStoreNames.contains("ui_state")) {
              db.createObjectStore("ui_state");
            }

            // アプリケーション設定ストア
            if (!db.objectStoreNames.contains("settings")) {
              db.createObjectStore("settings");
            }

            // キャッシュストア
            if (!db.objectStoreNames.contains("cache")) {
              const cacheStore = db.createObjectStore("cache");
              cacheStore.createIndex("by-timestamp", "timestamp");
            }

            // Zustandストア永続化
            if (!db.objectStoreNames.contains("store_state")) {
              db.createObjectStore("store_state");
            }
          }
        },
      });
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
      throw error;
    }
  }

  /**
   * データベースが初期化されているか確認
   */
  private ensureInitialized(): void {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
  }

  /**
   * 値を保存
   */
  async set(
    store: "ui_state" | "settings" | "cache" | "store_state",
    key: string,
    value: any
  ): Promise<void> {
    this.ensureInitialized();
    try {
      await this.db!.put(store as any, value, key);
    } catch (error) {
      console.error(`Failed to set value in ${store}:`, error);
      throw error;
    }
  }

  /**
   * 値を取得
   */
  async get<T>(
    store: "ui_state" | "settings" | "cache" | "store_state",
    key: string
  ): Promise<T | null> {
    this.ensureInitialized();
    try {
      const value = await this.db!.get(store as any, key);
      return value !== undefined ? (value as T) : null;
    } catch (error) {
      console.error(`Failed to get value from ${store}:`, error);
      return null;
    }
  }

  /**
   * 値を削除
   */
  async delete(
    store: "ui_state" | "settings" | "cache" | "store_state",
    key: string
  ): Promise<void> {
    this.ensureInitialized();
    try {
      await this.db!.delete(store as any, key);
    } catch (error) {
      console.error(`Failed to delete value from ${store}:`, error);
      throw error;
    }
  }

  /**
   * ストアをクリア
   */
  async clear(
    store: "ui_state" | "settings" | "cache" | "store_state"
  ): Promise<void> {
    this.ensureInitialized();
    try {
      await this.db!.clear(store as any);
    } catch (error) {
      console.error(`Failed to clear ${store}:`, error);
      throw error;
    }
  }

  /**
   * ストア内のすべてのキーを取得
   */
  async getAllKeys(
    store: "ui_state" | "settings" | "cache" | "store_state"
  ): Promise<string[]> {
    this.ensureInitialized();
    try {
      const keys = await this.db!.getAllKeys(store as any);
      return keys as string[];
    } catch (error) {
      console.error(`Failed to get all keys from ${store}:`, error);
      return [];
    }
  }

  /**
   * ストア内のすべての値を取得
   */
  async getAll<T>(
    store: "ui_state" | "settings" | "cache" | "store_state"
  ): Promise<T[]> {
    this.ensureInitialized();
    try {
      const values = await this.db!.getAll(store as any);
      return values as T[];
    } catch (error) {
      console.error(`Failed to get all values from ${store}:`, error);
      return [];
    }
  }

  /**
   * キーの存在確認
   */
  async has(
    store: "ui_state" | "settings" | "cache" | "store_state",
    key: string
  ): Promise<boolean> {
    this.ensureInitialized();
    try {
      const value = await this.db!.get(store as any, key);
      return value !== undefined;
    } catch (error) {
      console.error(`Failed to check key existence in ${store}:`, error);
      return false;
    }
  }

  /**
   * データベースを閉じる
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const journeeDB = JourneeDB.getInstance();

/**
 * IndexedDBが利用可能かチェック
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return "indexedDB" in window && window.indexedDB !== null;
  } catch (e) {
    return false;
  }
}

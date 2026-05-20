import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { AppStorageData } from '../models/app-storage.model';

const WEB_STORAGE_KEY = 'black-sushi-data';
const FILE_PATH = 'black-sushi-data.json';

const LEGACY_KEYS = {
  cart: 'black-sushi-cart',
  orders: 'black-sushi-orders',
  products: 'black-sushi-products',
  extras: 'black-sushi-extras',
  tables: 'black-sushi-tables',
  role: 'black-sushi-role'
} as const;

@Injectable({
  providedIn: 'root'
})
export class AppStorageService {
  private cache: AppStorageData = {};
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.cache = await this.loadData();
    this.initialized = true;
  }

  getSection<K extends keyof AppStorageData>(key: K): AppStorageData[K] | undefined {
    return this.cache[key];
  }

  setSection<K extends keyof AppStorageData>(key: K, value: AppStorageData[K]): void {
    if (value === undefined) {
      delete this.cache[key];
    } else {
      this.cache[key] = value;
    }

    void this.persist();
  }

  clearSection<K extends keyof AppStorageData>(key: K): void {
    delete this.cache[key];
    void this.persist();
  }

  private async loadData(): Promise<AppStorageData> {
    const stored = await this.readCurrentStorage();

    if (stored) {
      return stored;
    }

    const migrated = this.readLegacyStorage();

    if (Object.keys(migrated).length > 0) {
      await this.writeCurrentStorage(migrated);
      this.clearLegacyStorage();
    }

    return migrated;
  }

  private async persist(): Promise<void> {
    await this.writeCurrentStorage(this.cache);
  }

  private async readCurrentStorage(): Promise<AppStorageData | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.readFile({
          path: FILE_PATH,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        return JSON.parse(result.data as string) as AppStorageData;
      } catch {
        return null;
      }
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppStorageData) : null;
  }

  private async writeCurrentStorage(data: AppStorageData): Promise<void> {
    const serialized = JSON.stringify(data, null, 2);

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: FILE_PATH,
        data: serialized,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      });
      return;
    }

    localStorage.setItem(WEB_STORAGE_KEY, serialized);
  }

  private readLegacyStorage(): AppStorageData {
    const migrated: AppStorageData = {};

    const cart = localStorage.getItem(LEGACY_KEYS.cart);
    const orders = localStorage.getItem(LEGACY_KEYS.orders);
    const products = localStorage.getItem(LEGACY_KEYS.products);
    const extras = localStorage.getItem(LEGACY_KEYS.extras);
    const tables = localStorage.getItem(LEGACY_KEYS.tables);
    const role = localStorage.getItem(LEGACY_KEYS.role);

    if (cart) migrated.cart = JSON.parse(cart);
    if (orders) migrated.orders = JSON.parse(orders);
    if (products) migrated.products = JSON.parse(products);
    if (extras) migrated.extras = JSON.parse(extras);
    if (tables) migrated.tables = JSON.parse(tables);
    if (role) migrated.role = JSON.parse(JSON.stringify(role));

    return migrated;
  }

  private clearLegacyStorage(): void {
    Object.values(LEGACY_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}

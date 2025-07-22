import Dexie, { type Table } from 'dexie';

export interface Extraction {
  id?: number;
  title: string;
  combinedText: string;
  createdAt: Date;
}

export class AppDatabase extends Dexie {
  extractions!: Table<Extraction>;

  constructor() {
    super('keenScanDB');
    this.version(1).stores({
      extractions: '++id, title, createdAt',
    });
  }
}

export const db = new AppDatabase();

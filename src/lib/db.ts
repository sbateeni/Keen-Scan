import Dexie, { type Table } from 'dexie';

export interface SavedText {
  id: number;
  text: string;
  date: Date;
}

export class AppDatabase extends Dexie {
  savedTexts!: Table<SavedText>; 

  constructor() {
    super('KeenScanDatabase');
    this.version(1).stores({
      savedTexts: '++id, text, date' // Primary key and indexed props
    });
  }
}

export const db = new AppDatabase();

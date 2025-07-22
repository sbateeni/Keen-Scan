'use client';

import Dexie, { type EntityTable } from 'dexie';

export interface Extraction {
  id?: number;
  title: string;
  text: string;
  createdAt: Date;
}

const db = new Dexie('KeenScanDatabase') as Dexie & {
  extractions: EntityTable<
    Extraction,
    'id' 
  >;
};

db.version(1).stores({
  extractions: '++id, title, text, createdAt',
});

export { db };

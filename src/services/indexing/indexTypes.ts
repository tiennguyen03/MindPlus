/**
 * Types for the local indexing system
 */

export interface IndexItem {
  id: string; // Stable identifier (relative path)
  type: 'entry' | 'ai';
  subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions';
  relativePath: string;
  displayTitle: string;
  date: string; // ISO string or YYYY-MM-DD
  updatedAt: string; // ISO timestamp
  wordCount?: number;
  excerpt?: string; // First ~200 chars
  searchableText?: string; // Limited searchable content
  sensitive?: boolean; // Mark entry as sensitive
}

export interface JournalIndex {
  version: number;
  lastBuilt: string; // ISO timestamp
  items: IndexItem[];
}

export interface IndexUpdateParams {
  type: 'add' | 'update' | 'delete';
  item?: IndexItem;
  relativePath?: string;
}

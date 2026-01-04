import fs from 'fs/promises';
import path from 'path';
import { JournalIndex, IndexItem } from './indexTypes';

const INDEX_VERSION = 1;
const EXCERPT_LENGTH = 200;

/**
 * Build a complete index from scratch by scanning the journal folder
 */
export async function buildIndex(journalPath: string): Promise<JournalIndex> {
  const items: IndexItem[] = [];

  // Index entries
  const entriesPath = path.join(journalPath, 'entries');
  try {
    const entryItems = await indexDirectory(entriesPath, 'entry');
    items.push(...entryItems);
  } catch (error) {
    console.warn('Could not index entries directory:', error);
  }

  // Index AI outputs
  const aiPath = path.join(journalPath, 'ai');
  const aiSubtypes: Array<'daily' | 'weekly' | 'highlights' | 'loops' | 'questions'> = [
    'daily',
    'weekly',
    'highlights',
    'loops',
    'questions',
  ];

  for (const subtype of aiSubtypes) {
    const aiSubPath = path.join(aiPath, subtype);
    try {
      const aiItems = await indexDirectory(aiSubPath, 'ai', subtype);
      items.push(...aiItems);
    } catch (error) {
      // Directory might not exist yet, skip silently
    }
  }

  const index: JournalIndex = {
    version: INDEX_VERSION,
    lastBuilt: new Date().toISOString(),
    items,
  };

  return index;
}

/**
 * Recursively index a directory
 */
async function indexDirectory(
  dirPath: string,
  type: 'entry' | 'ai',
  subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions'
): Promise<IndexItem[]> {
  const items: IndexItem[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subItems = await indexDirectory(fullPath, type, subtype);
        items.push(...subItems);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const item = await indexFile(fullPath, type, subtype);
        if (item) items.push(item);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    return items;
  }

  return items;
}

/**
 * Index a single markdown file
 */
async function indexFile(
  filePath: string,
  type: 'entry' | 'ai',
  subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions'
): Promise<IndexItem | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    // Extract relative path (remove up to 'entries' or 'ai')
    const parts = filePath.split(path.sep);
    const baseIdx = parts.findIndex(p => p === 'entries' || p === 'ai');
    const relativePath = parts.slice(baseIdx + 1).join('/');

    // Extract date from filename (YYYY-MM-DD pattern)
    const fileName = path.basename(filePath, '.md');
    const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : new Date(stats.mtime).toISOString().split('T')[0];

    // Generate display title
    const displayTitle = generateDisplayTitle(fileName, content);

    // Calculate word count
    const wordCount = countWords(content);

    // Generate excerpt (first 200 chars, cleaned)
    const excerpt = generateExcerpt(content);

    // Generate searchable text (limit to prevent huge index)
    const searchableText = content.slice(0, 1000).toLowerCase();

    const item: IndexItem = {
      id: relativePath,
      type,
      subtype,
      relativePath,
      displayTitle,
      date,
      updatedAt: stats.mtime.toISOString(),
      wordCount,
      excerpt,
      searchableText,
    };

    return item;
  } catch (error) {
    console.error('Error indexing file:', filePath, error);
    return null;
  }
}

/**
 * Generate a friendly display title from filename and content
 */
function generateDisplayTitle(fileName: string, content: string): string {
  // Try to extract first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Fall back to filename
  return fileName.replace(/\.(md|review|summary|highlights|question)$/, '');
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string): string {
  // Remove markdown formatting
  const cleaned = content
    .replace(/^#+\s+/gm, '') // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .trim();

  return cleaned.slice(0, EXCERPT_LENGTH);
}

/**
 * Write index to disk
 */
export async function writeIndex(journalPath: string, index: JournalIndex): Promise<void> {
  const indexPath = path.join(journalPath, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Read index from disk
 */
export async function readIndex(journalPath: string): Promise<JournalIndex | null> {
  const indexPath = path.join(journalPath, 'index.json');

  try {
    const data = await fs.readFile(indexPath, 'utf-8');
    const index: JournalIndex = JSON.parse(data);

    // Validate version
    if (index.version !== INDEX_VERSION) {
      console.warn('Index version mismatch, rebuild needed');
      return null;
    }

    return index;
  } catch (error) {
    // Index doesn't exist or is corrupted
    return null;
  }
}

/**
 * Update a single item in the index
 */
export async function updateIndexItem(
  journalPath: string,
  relativePath: string,
  type: 'entry' | 'ai',
  subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions'
): Promise<void> {
  let index = await readIndex(journalPath);
  if (!index) {
    // Rebuild from scratch if index is missing
    index = await buildIndex(journalPath);
  }

  // Determine full path based on type
  const basePath = type === 'entry' ? 'entries' : `ai/${subtype}`;
  const fullPath = path.join(journalPath, basePath, relativePath);

  // Try to index the file
  const item = await indexFile(fullPath, type, subtype);

  if (item) {
    // Update or add item
    const existingIdx = index.items.findIndex(i => i.id === relativePath);
    if (existingIdx >= 0) {
      index.items[existingIdx] = item;
    } else {
      index.items.push(item);
    }
  } else {
    // Remove item if it no longer exists
    index.items = index.items.filter(i => i.id !== relativePath);
  }

  index.lastBuilt = new Date().toISOString();
  await writeIndex(journalPath, index);
}

/**
 * Remove an item from the index
 */
export async function removeIndexItem(journalPath: string, relativePath: string): Promise<void> {
  let index = await readIndex(journalPath);
  if (!index) return;

  index.items = index.items.filter(i => i.id !== relativePath);
  index.lastBuilt = new Date().toISOString();
  await writeIndex(journalPath, index);
}

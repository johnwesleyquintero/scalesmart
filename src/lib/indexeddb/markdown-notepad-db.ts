// src/lib/indexeddb/markdown-notepad-db.ts

import {
  openDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  IDBPCursorWithValue,
} from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { Note, Category, MarkdownNoteVersion } from '@/types/indexeddb'; // Import Note, Category, and MarkdownNoteVersion interfaces

interface MarkdownNotepadDB extends DBSchema {
  notes: {
    key: string; // Unique ID for the note (e.g., UUID)
    value: Note;
    indexes: { category: string };
  };
  categories: {
    key: string; // Unique ID for the category
    value: Category;
    indexes: { name: string };
  };
  note_versions: {
    key: number; // Auto-incrementing ID for versions
    value: MarkdownNoteVersion;
    indexes: { noteId: string; timestamp: number };
  };
}

const DB_NAME = 'markdown-notepad-db';
const DB_VERSION = 5; // Increment DB_VERSION to trigger the upgrade logic
const NOTES_STORE_NAME = 'notes';
const CATEGORIES_STORE_NAME = 'categories';
const NOTE_VERSIONS_STORE_NAME = 'note_versions';

let dbPromise: Promise<IDBPDatabase<MarkdownNotepadDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<MarkdownNotepadDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MarkdownNotepadDB>(DB_NAME, DB_VERSION, {
      upgrade(
        db: IDBPDatabase<MarkdownNotepadDB>,
        oldVersion: number,
        newVersion: number | null,
        transaction: IDBPTransaction<
          MarkdownNotepadDB,
          (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
          'versionchange'
        >,
        event: IDBVersionChangeEvent,
      ) {
        if (oldVersion < 1) {
          // Initial schema creation for version 1
          const notesStore = db.createObjectStore(NOTES_STORE_NAME, {
            keyPath: 'id',
          });
          notesStore.createIndex('category', 'category');
        }
        if (oldVersion < 2) {
          // Upgrade to version 2: Add 'title' field to existing notes
          const notesStore = transaction.objectStore(NOTES_STORE_NAME);
          notesStore.openCursor().then(async function addTitleToNotes(
            cursor: IDBPCursorWithValue<
              MarkdownNotepadDB,
              (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
              typeof NOTES_STORE_NAME,
              unknown,
              'versionchange'
            > | null,
          ) {
            if (!cursor) return;
            let currentCursor: IDBPCursorWithValue<
              MarkdownNotepadDB,
              (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
              typeof NOTES_STORE_NAME,
              unknown,
              'versionchange'
            > | null = cursor as IDBPCursorWithValue<
              MarkdownNotepadDB,
              (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
              typeof NOTES_STORE_NAME,
              unknown,
              'versionchange'
            >;
            while (currentCursor) {
              const note = { ...(currentCursor.value as Note) };
              if (!note.title) {
                note.title =
                  note.markdown.split('\n')[0]?.trim() || 'Untitled Note';
                await currentCursor.update(note);
              }
              currentCursor = await currentCursor.continue();
            }
          });
        }
        if (oldVersion < 3) {
          // Upgrade to version 3: Add 'categories' object store
          if (!db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
            const categoriesStore = db.createObjectStore(
              CATEGORIES_STORE_NAME,
              { keyPath: 'id' },
            );
            categoriesStore.createIndex('name', 'name', { unique: true });
          }

          // Migrate existing categories from notes to the new categories store
          const notesStore = transaction.objectStore(NOTES_STORE_NAME);
          const categoriesSet: Set<string> = new Set();
          notesStore.openCursor().then(async function collectCategories(
            cursor: IDBPCursorWithValue<
              MarkdownNotepadDB,
              (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
              typeof NOTES_STORE_NAME,
              unknown,
              'versionchange'
            > | null,
          ) {
            if (!cursor) return;
            let currentCursor: IDBPCursorWithValue<
              MarkdownNotepadDB,
              (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
              typeof NOTES_STORE_NAME,
              unknown,
              'versionchange'
            > | null = cursor as IDBPCursorWithValue<
              MarkdownNotepadDB,
              (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
              typeof NOTES_STORE_NAME,
              unknown,
              'versionchange'
            >;
            while (currentCursor) {
              categoriesSet.add(currentCursor.value.category);
              currentCursor = await currentCursor.continue();
            }
            const categoriesStore = transaction.objectStore(
              CATEGORIES_STORE_NAME,
            );
            for (const categoryName of categoriesSet) {
              if (
                categoryName &&
                categoryName.toLowerCase() !== 'uncategorized'
              ) {
                // Exclude 'uncategorized'
                await categoriesStore.add({ id: uuidv4(), name: categoryName });
              }
            }
          });
        }
        if (oldVersion < 4) {
          // Upgrade to version 4: Clean up 'uncategorized' entries from categories store
          if (db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
            const categoriesStore = transaction.objectStore(
              CATEGORIES_STORE_NAME,
            );
            const index = categoriesStore.index('name');
            index.openCursor().then(async function deleteUncategorized(
              cursor: IDBPCursorWithValue<
                MarkdownNotepadDB,
                (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
                typeof CATEGORIES_STORE_NAME,
                unknown,
                'versionchange'
              > | null,
            ) {
              if (!cursor) return;
              let currentCursor: IDBPCursorWithValue<
                MarkdownNotepadDB,
                (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
                typeof CATEGORIES_STORE_NAME,
                unknown,
                'versionchange'
              > | null = cursor as IDBPCursorWithValue<
                MarkdownNotepadDB,
                (typeof NOTES_STORE_NAME | typeof CATEGORIES_STORE_NAME)[],
                typeof CATEGORIES_STORE_NAME,
                unknown,
                'versionchange'
              >;
              while (currentCursor) {
                if (
                  currentCursor.value.name.toLowerCase() === 'uncategorized'
                ) {
                  await currentCursor.delete();
                }
                currentCursor = await currentCursor.continue();
              }
            });
          }
        }
        if (oldVersion < 5) {
          // Upgrade to version 5: Add 'note_versions' object store
          if (!db.objectStoreNames.contains(NOTE_VERSIONS_STORE_NAME)) {
            const noteVersionsStore = db.createObjectStore(
              NOTE_VERSIONS_STORE_NAME,
              { keyPath: 'id', autoIncrement: true },
            );
            noteVersionsStore.createIndex('noteId', 'noteId');
            noteVersionsStore.createIndex('timestamp', 'timestamp');
          }
        }
      },
    });
  }
  return dbPromise;
}

// Function to add a new version of a note
export async function addNoteVersion(
  noteId: string,
  markdown: string,
): Promise<number> {
  try {
    const db = await getDB();
    const now = Date.now();
    const version: MarkdownNoteVersion = { noteId, markdown, timestamp: now };
    const id = await db.add(NOTE_VERSIONS_STORE_NAME, version);
    return id as number;
  } catch (error) {
    console.error(`Error adding note version for note ID ${noteId}:`, error);
    throw error;
  }
}

// Function to get all versions for a specific note, ordered by timestamp
export async function getNoteVersions(
  noteId: string,
): Promise<MarkdownNoteVersion[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(NOTE_VERSIONS_STORE_NAME, 'readonly');
    const store = tx.objectStore(NOTE_VERSIONS_STORE_NAME);
    const index = store.index('noteId');
    const versions = await index.getAll(noteId);
    await tx.done;
    return versions.sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
  } catch (error) {
    console.error(`Error getting note versions for note ID ${noteId}:`, error);
    throw error;
  }
}

// Function to delete old versions of a note, keeping only the latest N versions
export async function cleanOldNoteVersions(
  noteId: string,
  keepCount: number = 10,
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(NOTE_VERSIONS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(NOTE_VERSIONS_STORE_NAME);
    const index = store.index('noteId');

    const versions = await index.getAll(noteId);
    versions.sort((a, b) => b.timestamp - a.timestamp); // Sort descending by timestamp

    if (versions.length > keepCount) {
      for (let i = keepCount; i < versions.length; i++) {
        if (versions[i].id !== undefined) {
          await store.delete(versions[i].id as number);
        }
      }
    }
    await tx.done;
  } catch (error) {
    console.error(
      `Error cleaning old note versions for note ID ${noteId}:`,
      error,
    );
    throw error;
  }
}

// Function to delete all versions for a specific note (e.g., when the note itself is deleted)
export async function deleteAllNoteVersions(noteId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(NOTE_VERSIONS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(NOTE_VERSIONS_STORE_NAME);
    const index = store.index('noteId');
    let cursor = await index.openCursor(IDBKeyRange.only(noteId));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } catch (error) {
    console.error(
      `Error deleting all note versions for note ID ${noteId}:`,
      error,
    );
    throw error;
  }
}

async function ensureCategoryExists(categoryName: string): Promise<void> {
  // Prevent 'uncategorized' from being added to the categories store
  if (!categoryName || categoryName.toLowerCase() === 'uncategorized') {
    return;
  }
  try {
    const db = await getDB();
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const existingCategory = await store.index('name').get(categoryName);
    if (!existingCategory) {
      await store.add({ id: uuidv4(), name: categoryName });
    }
    await tx.done;
  } catch (error) {
    // Ignore ConstraintError if category already exists due to concurrent add
    if ((error as DOMException).name !== 'ConstraintError') {
      console.error(`Error ensuring category "${categoryName}" exists:`, error);
      throw error;
    }
  }
}

export async function addNote(
  title: string,
  markdown: string,
  category: string,
): Promise<string> {
  try {
    const db = await getDB();
    const id = uuidv4();
    const now = Date.now();
    await ensureCategoryExists(category); // Ensure category exists before adding note
    await db.put(NOTES_STORE_NAME, {
      id: id,
      title: title,
      markdown: markdown,
      category: category,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
}

export async function getNote(id: string): Promise<Note | undefined> {
  try {
    const db = await getDB();
    return db.get(NOTES_STORE_NAME, id);
  } catch (error) {
    console.error(`Error getting note with ID ${id}:`, error);
    throw error;
  }
}

export async function getAllNotes(): Promise<Note[]> {
  try {
    const db = await getDB();
    return db.getAll(NOTES_STORE_NAME);
  } catch (error) {
    console.error('Error getting all notes:', error);
    throw error;
  }
}

// Function to get the count of notes per category
export async function getNoteCountsByCategory(): Promise<Map<string, number>> {
  try {
    const db = await getDB();
    const tx = db.transaction(NOTES_STORE_NAME, 'readonly');
    const store = tx.objectStore(NOTES_STORE_NAME);
    const index = store.index('category');

    const counts = new Map<string, number>();
    let cursor = await index.openCursor();
    while (cursor) {
      const category = cursor.key as string;
      counts.set(category, (counts.get(category) || 0) + 1);
      cursor = await cursor.continue();
    }
    await tx.done;
    return counts;
  } catch (error) {
    console.error('Error getting note counts by category:', error);
    throw error;
  }
}

export async function getNotesByCategory(
  category: string,
  searchQuery: string = '',
): Promise<Note[]> {
  try {
    const db = await getDB();
    const index = db.transaction(NOTES_STORE_NAME).store.index('category');
    let notes = await index.getAll(category);
    if (searchQuery) {
      notes = notes.filter(
        (note) =>
          note.markdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return notes;
  } catch (error) {
    console.error(`Error getting notes by category ${category}:`, error);
    throw error;
  }
}

export async function searchNotes(searchQuery: string): Promise<Note[]> {
  try {
    const db = await getDB();
    const notes = await db.getAll(NOTES_STORE_NAME);
    return notes.filter(
      (note) =>
        note.markdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(NOTES_STORE_NAME, id);
  } catch (error) {
    console.error(`Error deleting note with ID ${id}:`, error);
    throw error;
  }
}

export async function updateNote(
  id: string,
  title: string,
  markdown: string,
  category: string,
): Promise<void> {
  try {
    const db = await getDB();
    const existingNote = await db.get(NOTES_STORE_NAME, id);
    if (existingNote) {
      await ensureCategoryExists(category); // Ensure category exists before updating note
      await db.put(NOTES_STORE_NAME, {
        ...existingNote,
        title,
        markdown,
        category,
        updatedAt: Date.now(),
      });
    } else {
      console.warn(`Note with ID ${id} not found for update.`);
    }
  } catch (error) {
    console.error(`Error updating note with ID ${id}:`, error);
    throw error;
  }
}

// New CRUD operations for categories
export async function addCategory(
  category: Omit<Category, 'id'>,
): Promise<string> {
  try {
    const db = await getDB();
    const id = uuidv4();
    await db.add(CATEGORIES_STORE_NAME, { id, name: category.name });
    return id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

export async function getCategory(id: string): Promise<Category | undefined> {
  try {
    const db = await getDB();
    return db.get(CATEGORIES_STORE_NAME, id);
  } catch (error) {
    console.error(`Error getting category with ID ${id}:`, error);
    throw error;
  }
}

export async function updateCategory(category: Category): Promise<void> {
  try {
    const db = await getDB();
    await db.put(CATEGORIES_STORE_NAME, category);
  } catch (error) {
    console.error(`Error updating category with ID ${category.id}:`, error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(CATEGORIES_STORE_NAME, id);
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    throw error;
  }
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const db = await getDB();
    return db.getAll(CATEGORIES_STORE_NAME);
  } catch (error) {
    console.error('Error getting all categories:', error);
    throw error;
  }
}

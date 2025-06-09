// src/lib/indexeddb/markdown-notepad-db.ts

import {
  openDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  IDBPCursorWithValue,
} from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { Note, Category } from '@/types/indexeddb'; // Import Note and Category interfaces

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
}

const DB_NAME = 'markdown-notepad-db';
const DB_VERSION = 4; // Increment DB_VERSION to trigger the upgrade logic
const NOTES_STORE_NAME = 'notes';
const CATEGORIES_STORE_NAME = 'categories';

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
      },
    });
  }
  return dbPromise;
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

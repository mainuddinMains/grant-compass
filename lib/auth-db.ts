import fs from 'fs/promises';
import path from 'path';

export interface UserProfile {
  university?: string;
  department?: string;
  position?: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  profile?: UserProfile;
}

export interface StoredSearch {
  id: string;
  userId: string;
  searchDescription: string;
  timestamp: number;
  grantsFound: number;
  topMatchScore: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullResults: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SEARCHES_FILE = path.join(DATA_DIR, 'searches.json');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readUsers(): Promise<StoredUser[]> {
  try {
    const content = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function readSearches(): Promise<StoredSearch[]> {
  try {
    const content = await fs.readFile(SEARCHES_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeSearches(searches: StoredSearch[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(SEARCHES_FILE, JSON.stringify(searches, null, 2));
}

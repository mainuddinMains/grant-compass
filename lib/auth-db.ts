import fs from 'fs/promises';
import path from 'path';

export interface ResearchAnalysis {
  fundabilityScore: number;
  topStrengths: string[];
  recommendedGrantTypes: string[];
  profileGaps: string[];
  searchSuggestions: string[];
}

export interface UserProfile {
  university?: string;
  department?: string;
  position?: string;
  researchAnalysis?: ResearchAnalysis;
}

export interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  description: string;
  estimatedHours: number;
}

export interface ChecklistState {
  items: ChecklistItem[];
  checked: Record<string, boolean>; // item id → true/false
}

export interface SavedDeadline {
  grantTitle: string;
  agency: string;
  deadline: string | null;
  fundingAmount: number | null;
  grantUrl: string;
  savedAt: number;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  provider?: string;  // 'credentials' | 'google'
  image?: string;     // profile picture URL (Google OAuth)
  createdAt: number;
  profile?: UserProfile;
  lettersGenerated?: number;
  savedDeadlines?: SavedDeadline[];
  // key = grantUrl, value = checklist state for that grant
  checklistProgress?: Record<string, ChecklistState>;
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

import { getDatabase } from '@/database/database';
import { UserProfile } from '@/types';

export interface IUserProfileRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(name: string, nickname?: string): Promise<UserProfile>;
  deleteProfile(): Promise<void>;
}

export class UserProfileRepository implements IUserProfileRepository {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const db = getDatabase();
      const r = await db.getFirstAsync<{
        id: string;
        name: string;
        nickname: string | null;
        created_at: string;
        updated_at: string;
      }>('SELECT * FROM user_profiles ORDER BY created_at ASC LIMIT 1;');

      if (!r) return null;

      return {
        id: r.id,
        name: r.name,
        nickname: r.nickname ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    } catch {
      return null;
    }
  }

  async saveProfile(name: string, nickname?: string): Promise<UserProfile> {
    const cleanName = name ? name.trim() : '';
    if (!cleanName) {
      throw new Error('User name is required');
    }
    const db = getDatabase();
    const existing = await this.getProfile();
    const now = new Date().toISOString();
    const cleanNickname = nickname?.trim() || null;

    if (existing) {
      await db.runAsync(
        `UPDATE user_profiles
         SET name = ?, nickname = ?, updated_at = ?
         WHERE id = ?;`,
        [cleanName, cleanNickname, now, existing.id]
      );
      return {
        id: existing.id,
        name: cleanName,
        nickname: cleanNickname ?? undefined,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
    } else {
      const id = `user_${Date.now()}`;
      await db.runAsync(
        `INSERT INTO user_profiles (id, name, nickname, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?);`,
        [id, cleanName, cleanNickname, now, now]
      );
      return {
        id,
        name: cleanName,
        nickname: cleanNickname ?? undefined,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  async deleteProfile(): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM user_profiles;');
  }
}

export const userProfileRepository = new UserProfileRepository();

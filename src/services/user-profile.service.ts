import { IUserProfileRepository, userProfileRepository } from '@/repositories';
import { UserProfile } from '@/types';
import { settingsService } from './settings.service';

export class UserProfileService {
  constructor(
    private readonly repo: IUserProfileRepository = userProfileRepository
  ) {}

  async getUserProfile(): Promise<UserProfile | null> {
    return this.repo.getProfile();
  }

  async hasProfile(): Promise<boolean> {
    const profile = await this.repo.getProfile();
    return Boolean(profile && profile.name.trim().length > 0);
  }

  async getUserName(): Promise<string> {
    const profile = await this.repo.getProfile();
    if (profile && profile.name.trim()) {
      return profile.nickname?.trim() || profile.name.trim();
    }
    const settingName = await settingsService.getSetting('user_name');
    if (settingName && settingName.trim()) {
      return settingName.trim();
    }
    return 'Mom';
  }

  async saveUserName(name: string, nickname?: string): Promise<UserProfile> {
    const cleanName = name ? name.trim() : '';
    if (!cleanName) {
      throw new Error('User name is required');
    }
    const cleanNickname = nickname?.trim();
    const profile = await this.repo.saveProfile(cleanName, cleanNickname);
    await settingsService.setSetting('user_name', cleanNickname || cleanName);
    return profile;
  }
}

export const userProfileService = new UserProfileService();

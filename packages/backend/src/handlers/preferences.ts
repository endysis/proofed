import { putItem, getItem, updateItem } from '../lib/dynamo';
import type { UserPreferences, UpdatePreferencesRequest } from '@proofed/shared';

const TABLE_NAME = process.env.PREFERENCES_TABLE!;

// Default preferences for new users
const DEFAULT_PREFERENCES = {
  temperatureUnit: 'F' as const,
  // Future defaults go here
};

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const existing = await getItem<UserPreferences>(TABLE_NAME, { userId });

  if (!existing) {
    // Create default preferences for new users
    const now = new Date().toISOString();
    const newPrefs: UserPreferences = {
      userId,
      ...DEFAULT_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };
    await putItem(TABLE_NAME, newPrefs);
    return newPrefs;
  }

  return existing;
}

export async function updatePreferences(
  userId: string,
  request: UpdatePreferencesRequest
): Promise<UserPreferences | null> {
  // First ensure the user has a preferences record
  await getPreferences(userId);

  const updates: Partial<UserPreferences> = {
    ...request,
    updatedAt: new Date().toISOString(),
  };

  return updateItem<UserPreferences>(TABLE_NAME, { userId }, updates);
}

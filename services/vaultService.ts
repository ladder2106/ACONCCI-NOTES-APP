import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { VaultNote } from '@/types/note';

export class VaultService {
  private static readonly VAULT_KEY_PREFIX = 'vault_';
  private static readonly ENCRYPTION_KEY_PREFIX = 'encryption_';

  // Store vault content securely
  static async storeVaultContent(noteId: string, content: string): Promise<boolean> {
    try {
      const key = this.VAULT_KEY_PREFIX + noteId;
      await SecureStore.setItemAsync(key, content);
      return true;
    } catch (error) {
      console.error('Failed to store vault content:', error);
      return false;
    }
  }

  // Retrieve vault content securely
  static async getVaultContent(noteId: string): Promise<string | null> {
    try {
      const key = this.VAULT_KEY_PREFIX + noteId;
      const content = await SecureStore.getItemAsync(key);
      return content;
    } catch (error) {
      console.error('Failed to retrieve vault content:', error);
      return null;
    }
  }

  // Delete vault content
  static async deleteVaultContent(noteId: string): Promise<boolean> {
    try {
      const key = this.VAULT_KEY_PREFIX + noteId;
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('Failed to delete vault content:', error);
      return false;
    }
  }

  // Check if device supports biometric authentication
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  // Authenticate user with biometrics
  static async authenticateWithBiometrics(reason: string = 'Authenticate to access vault'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Create a new vault note with encrypted content
  static async createVaultNote(
    noteData: Omit<VaultNote, 'type' | 'isLocked' | 'encryptionKey'>,
    content: string
  ): Promise<VaultNote | null> {
    try {
      const vaultNote: VaultNote = {
        ...noteData,
        type: 'vault',
        isLocked: true,
        encryptionKey: this.generateEncryptionKey(),
      };

      // Store content securely
      const stored = await this.storeVaultContent(noteData.id, content);
      if (!stored) {
        throw new Error('Failed to store vault content');
      }

      return vaultNote;
    } catch (error) {
      console.error('Failed to create vault note:', error);
      return null;
    }
  }

  // Update vault note content
  static async updateVaultContent(noteId: string, content: string): Promise<boolean> {
    return await this.storeVaultContent(noteId, content);
  }

  // Generate encryption key (simplified - in production use proper crypto)
  private static generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Lock vault note
  static lockVaultNote(note: VaultNote): VaultNote {
    return {
      ...note,
      isLocked: true,
    };
  }

  // Unlock vault note (requires authentication)
  static async unlockVaultNote(note: VaultNote): Promise<VaultNote | null> {
    if (!note.isLocked) return note;

    const authenticated = await this.authenticateWithBiometrics();
    if (authenticated) {
      return {
        ...note,
        isLocked: false,
      };
    }

    return null;
  }

  // Get vault note content (handles authentication)
  static async getVaultNoteContent(note: VaultNote): Promise<string | null> {
    if (note.isLocked) {
      const authenticated = await this.authenticateWithBiometrics();
      if (!authenticated) {
        return null;
      }
    }

    return await this.getVaultContent(note.id);
  }

  // Check if vault note is locked
  static isVaultNoteLocked(note: VaultNote): boolean {
    return note.isLocked;
  }
}

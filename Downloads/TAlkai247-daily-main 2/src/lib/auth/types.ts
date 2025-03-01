export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  settings: UserSettings;
}

export interface UserSettings {
  defaultTransparencyLevel: 'FULL' | 'PARTIAL' | 'NONE';
  defaultAssistant?: string;
  recordingEnabled: boolean;
  webSearchEnabled: boolean;
  preferredVoice: 'male' | 'female';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}
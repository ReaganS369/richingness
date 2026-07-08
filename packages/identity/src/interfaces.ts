export interface UserSession {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  expiresAt?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface IIdentityService {
  /**
   * Logs in a user with email and password.
   */
  signIn(email: string, password: string): Promise<UserSession>;

  /**
   * Registers a new user.
   */
  signUp(email: string, password: string, displayName?: string): Promise<UserSession>;

  /**
   * Terminates the current active session.
   */
  signOut(): Promise<void>;

  /**
   * Retrieves the current user's profile metadata.
   */
  getCurrentUser(): Promise<UserProfile | null>;

  /**
   * Retrieves the current session token details.
   */
  getSession(): Promise<UserSession | null>;
}

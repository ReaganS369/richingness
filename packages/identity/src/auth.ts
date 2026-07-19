import { SupabaseClient, Session, AuthError, Provider } from '@supabase/supabase-js';
import { IIdentityService, UserSession, UserProfile } from './interfaces.js';

export class AuthService implements IIdentityService {
  private supabase: SupabaseClient | null = null;

  constructor(supabaseClient?: SupabaseClient) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else {
      console.warn('Supabase Auth connection parameters missing. Running in local demo mode.');
    }
  }

  get client(): SupabaseClient | null {
    return this.supabase;
  }

  private mapSession(session: Session): UserSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userId: session.user.id,
      email: session.user.email || '',
      expiresAt: session.expires_at,
    };
  }

  async signIn(email: string, password: string): Promise<UserSession> {
    if (!this.supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('No session returned');
    
    return this.mapSession(data.session);
  }

  async signUp(email: string, password: string, displayName?: string): Promise<UserSession> {
    if (!this.supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      }
    });
    
    if (error) throw error;
    if (!data.session) throw new Error('Email verification required or no session returned');
    
    return this.mapSession(data.session);
  }

  async signOut(): Promise<void> {
    if (!this.supabase) return;
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.supabase) return null;
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }

  async getSession(): Promise<UserSession | null> {
    if (!this.supabase) return null;
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error || !session) return null;
    return this.mapSession(session);
  }

  async signInWithOAuth(provider: Provider, redirectTo?: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      }
    });
    if (error) throw error;
  }

  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!this.supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return this.supabase.auth.onAuthStateChange(callback);
  }
}

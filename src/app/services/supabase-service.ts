import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import {
  AuthChangeEvent,
  AuthResponse,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  _session: AuthSession | null = null;
  private currentUserId: number | null = null; // Store numeric user ID to avoid repeated queries

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  //AUTHENTICATION

  async signUpWithPassword(email: string, password: string) {
    if (!email || !password) {
      return { data: null, error: { message: 'Email and password are required' } };
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options : {
          emailRedirectTo : 'http://localhost:4200/login'
        }
      });

      if (error) {
        return { data: null, error };
      }

      //data.session may be null if email confirmation is enabled
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error?.message || 'Unknown signup error',
        },
      };
    }
  }

  // Sign in existing user
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      //Update session and current user ID after login
      await this.updateSession();
    }
    return { data, error };
  }

  // Sign out user
  async signOut() {
    this._session = null;
    this.currentUserId = null;
    return this.supabase.auth.signOut();
  }

  // Subscribe to auth state changes
  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      this._session = session;
      if (session) {
        await this.updateSession();
      }
      callback(event, session);
    });
  }

  // Get current session
  async session() {
    const { data } = await this.supabase.auth.getSession();
    this._session = data.session;
    if (this._session) await this.updateSession();
    return this._session;
  }

  //fetch numeric user ID from crud-op table
  private async updateSession() {
    if (!this._session) return;
    const { data: user, error } = await this.supabase
      .from('crud-op')
      .select('id')
      .eq('email', this._session.user.email)
      .single();

    if (!error && user) {
      this.currentUserId = user.id; // store numeric ID
    } else {
      this.currentUserId = null;
    }
  }

  // USERS TABLE (crud-op)

  async addUser(user: User) {
    // Admin creates a user
    const { data, error } = await this.supabase.from('crud-op').insert([user]).select();
    return { data, error };
  }

  async readUsers() {
    const { data, error } = await this.supabase
      .from('crud-op')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async updateUsers(id: number, user: User) {
    const { data, error } = await this.supabase.from('crud-op').update(user).eq('id', id).select();
    return { data, error };
  }

  async deleteUser(id: number) {
    const { data, error } = await this.supabase.from('crud-op').delete().eq('id', id);
    return { data, error };
  }

  // PROJECTS TABLE

  async addProject(project: Project) {
    if (!this._session || !this.currentUserId) throw new Error('User not logged in');

    // Assign current user's numeric ID
    project.user_id = this.currentUserId;

    const { data, error } = await this.supabase.from('projects').insert([project]).select();
    return { data, error };
  }

  async readProjects() {
    if (!this._session || !this.currentUserId) throw new Error('User not logged in');

    // Fetch projects only for current user
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', this.currentUserId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async updateProject(id: number, project: Project) {
    if (!this._session || !this.currentUserId) throw new Error('User not logged in');

    //user can only update their own project
    const { data, error } = await this.supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .eq('user_id', this.currentUserId)
      .select();

    return { data, error };
  }

  async deleteProject(id: number) {
    if (!this._session || !this.currentUserId) throw new Error('User not logged in');

    // user can only delete their own project
    const { data, error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', this.currentUserId);

    return { data, error };
  }
}

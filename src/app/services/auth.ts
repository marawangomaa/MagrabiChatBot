import { Injectable, inject, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  supabase: SupabaseClient;
  private router = inject(Router);
  private zone = inject(NgZone);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.zone.run(() => this.router.navigate(['/admin']));
      }
    });
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('session');
  }

  async signIn(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStorage.setItem('session', 'true');
  }

  async signOut() {
    await this.supabase.auth.signOut();
    localStorage.removeItem('session');
    this.router.navigate(['/login']);
  }
}
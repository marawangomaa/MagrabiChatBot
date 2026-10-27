import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;

  async login() {
    this.error = '';
    this.loading = true;
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/admin']);
    } catch (e: any) {
      this.error = e.message ?? 'Login failed';
    }
    this.loading = false;
  }
}

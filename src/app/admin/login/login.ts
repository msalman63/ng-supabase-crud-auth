import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase-service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  signInForm!: FormGroup;

  loading: boolean = false;

  constructor(private fb: FormBuilder) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async onSubmit(): Promise<void> {
    try {
      if (this.signInForm.invalid) {
        // Alert if form is invalid
        alert('Please enter a valid email and password');
        return;
      }

      this.loading = true;

      const email = this.signInForm.value.email as string;
      const password = this.signInForm.value.password as string;

      // Call SupabaseService signIn
      const { data, error } = await this.supabaseService.signInWithPassword(email, password);

      if (error) throw error;

      // Optionally we update _session in SupabaseService after login
      await this.supabaseService.session();

      alert('Login Successful!');

      this.router.navigate(['users']);

      // Reset form only after successful login
      this.signInForm.reset();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false;
    }
  }
}
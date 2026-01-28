import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase-service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  signUpForm!: FormGroup;

  loading: boolean = false;

  constructor(private fb: FormBuilder) {
    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const { email, password } = this.signUpForm.value;

      const { data, error } = await this.supabaseService.signUpWithPassword(email!, password!);

      if (error) throw error;

      // Email verification flow
      alert('Signup successful! Please check your email to verify your account.');

      this.signUpForm.reset();
    } catch (error: any) {
      alert(error?.message || 'Signup failed');
    } finally {
      this.loading = false;
    }
  }
}

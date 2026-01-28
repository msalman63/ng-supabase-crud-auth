import { Component, inject } from '@angular/core';
import { SupabaseService } from '../../services/supabase-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-users',
  imports: [CommonModule , ReactiveFormsModule , RouterLink],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  users: User[] = [];
  errorMessage: string = '';
  editMemberId: number | null = null;
  isEditMode: boolean = false;
  isloading: boolean = false;

  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Form for add/edit user
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      age: [null, Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  // Load users from crud-op table
  private async loadUsers() {
    const { data, error } = await this.supabaseService.readUsers();
    if (error) {
      this.errorMessage = error.message;
      console.log(this.errorMessage);
      return;
    }
    this.users = data ?? [];
  }

  // Start edit mode
  startEdit(user: User) {
    if (!user.id) return;
    this.editMemberId = user.id;
    this.isEditMode = true;

    // Populate form
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      age: user.age,
    });
  }

  // Reset form
  formReset() {
    this.userForm.reset();
    this.isEditMode = false;
    this.editMemberId = null;
  }

  // Handle add/update submission
  async onSubmit() {
    if (this.userForm.invalid) return;
    try {
      const userData: User = {
        name: this.userForm.value.name,
        email: this.userForm.value.email,
        age: this.userForm.value.age,
      };

      if (this.isEditMode && this.editMemberId) {
        await this.supabaseService.updateUsers(this.editMemberId, userData);
        alert('User Updated Successfully');
      } else {
        await this.supabaseService.addUser(userData);
        alert('User Added Successfully');
      }

      await this.loadUsers(); // Refresh the users list
      this.formReset();
    } catch (error) {
      console.log('Error Submitting the User', error);
      alert('Failed to save the User');
    }
  }

  // Delete user
  async deleteUser(id: number) {
    const confirmed = confirm('Are you sure you want to delete this Member?');
    if (!confirmed) return;
    try {
      await this.supabaseService.deleteUser(id);
      alert('User deleted Successfully');
      await this.loadUsers(); //Refresh list after deletion
    } catch (error) {
      console.log('Error deleting the User', error);
      alert('Failed to delete the User');
    }
  }

  // Sign out
  async signOut() {
    try {
      this.isloading = true;
      await this.supabaseService.signOut();
      alert('Signed out successfully!');
      this.router.navigate(['']);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.isloading = false;
    }
  }

  // TrackBy function for ngFor
  trackById(index: number, user: User) {
    return user.id;
  }
}
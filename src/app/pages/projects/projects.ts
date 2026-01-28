import { Component, inject } from '@angular/core';
import { Project } from '../../models/project';
import { SupabaseService } from '../../services/supabase-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects',
  imports: [CommonModule , ReactiveFormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  projects: Project[] = [];
  errorMessage: string = '';
  editProjectId: number | null = null;
  isEditMode: boolean = false;
  isloading : boolean = false;

  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  projectForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(30)]],
    });
  }

  async ngOnInit() {
    await this.loadProjects();
  }

  //Load projects of the current user
  private async loadProjects() {
    const { data, error } = await this.supabaseService.readProjects();
    if (error) {
      this.errorMessage = error.message;
      console.log(this.errorMessage);
      return;
    }
    this.projects = data ?? [];
  }

  startEdit(project: Project) {
    if (!project.id) return;
    this.editProjectId = project.id;
    this.isEditMode = true;

    this.projectForm.patchValue({
      name: project.name,
      description: project.description,
    });
  }

  formReset() {
    this.projectForm.reset();
    this.isEditMode = false;
    this.editProjectId = null;
  }

  async onSubmit() {
    if (this.projectForm.invalid) return;
    try {
      const projectData: Project = {
        name: this.projectForm.value.name,
        description: this.projectForm.value.description,
      };

      if (this.isEditMode && this.editProjectId) {
        await this.supabaseService.updateProject(this.editProjectId, projectData);
        alert('Project Updated Successfully');
      } else {
        await this.supabaseService.addProject(projectData);
        alert('Project Added Successfully');
      }

      await this.loadProjects(); // Refresh project list
      this.formReset();
    } catch (error) {
      console.log('Error Submitting the Project', error);
      alert('Failed to save the Project');
    }
  }

  async deleteProject(id: number) {
    const confirmed = confirm('Are you sure you want to delete this Project?');
    if (!confirmed) return;
    try {
      await this.supabaseService.deleteProject(id);
      alert('Project deleted Successfully');
      await this.loadProjects(); // Refresh project list
    } catch (error) {
      console.log('Error deleting the Project', error);
      alert('Failed to delete the Project');
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

  // TrackBy for ngFor
  trackById(index: number, project: Project) {
    return project.id;
  }
}
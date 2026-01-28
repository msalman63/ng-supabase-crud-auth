import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service';

export const authGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);


  return new Promise<boolean>( (resolve) => {
    supabaseService.session().then( (session) => {
      if(session){
        resolve(true);
      }
      else{
        router.navigate(['/login']);
        resolve(false);
      }
    })
  });
};
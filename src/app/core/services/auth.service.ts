import { Injectable } from '@angular/core';
import { AppStorageService } from './app-storage.service';

export type UserRole = 'admin' | 'caja' | 'cocina';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private readonly storage: AppStorageService) {}

  getRole(): UserRole {
    return this.storage.getSection('role') ?? 'admin';
  }

  setRole(role: UserRole){
    this.storage.setSection('role', role);
  }

}

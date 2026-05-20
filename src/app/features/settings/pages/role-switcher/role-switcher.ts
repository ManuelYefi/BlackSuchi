import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService, UserRole } from '../../../../core/services/auth.service';

@Component({
selector:'app-role-switcher',
standalone:true,
imports:[CommonModule],
templateUrl:'./role-switcher.html'
})
export class RoleSwitcherComponent{

auth=inject(AuthService)

setRole(role:UserRole){
this.auth.setRole(role)
location.reload()
}

}
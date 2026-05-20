import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavComponent } from './shared/components/top-nav/top-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
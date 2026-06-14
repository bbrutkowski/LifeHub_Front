import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../services/theme.service';

@Component({
  standalone: true,
  selector: 'app-theme-toggle',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './theme-toggle.html',
  styleUrls: ['./theme-toggle.css'],
})
export class ThemeToggle {
  constructor(public theme: ThemeService) {}

  toggle() {
    this.theme.toggle();
  }
}

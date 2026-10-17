import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-workspace-section',
  standalone: true,
  templateUrl: './section.html',
  styleUrl: './section.css',
})
export class WorkspaceSection {
  private readonly route = inject(ActivatedRoute);

  get title(): string {
    return this.route.snapshot.data['title'] as string;
  }

  get description(): string {
    return this.route.snapshot.data['description'] as string;
  }
}

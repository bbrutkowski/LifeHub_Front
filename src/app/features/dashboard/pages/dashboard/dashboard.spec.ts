import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the user profile modal when opened', () => {
    component.isEditProfileModalOpen = true;
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-user-profile-modal');
    expect(modal).not.toBeNull();
  });

  it('should show the theme toggle in the top bar and logout in the profile card', () => {
    fixture.detectChanges();
    const themeToggle = fixture.nativeElement.querySelector('.topbar app-theme-toggle');
    const logoutButton = fixture.nativeElement.querySelector('.profile-logout-button') as HTMLButtonElement;
    const financeLink = [...fixture.nativeElement.querySelectorAll('.nav-item')].find((link) =>
      link.textContent.includes('Finance'),
    ) as HTMLAnchorElement;
    const taskLink = [...fixture.nativeElement.querySelectorAll('.nav-item')].find((link) =>
      link.textContent.includes('Zadania'),
    ) as HTMLAnchorElement;

    expect(themeToggle).not.toBeNull();
    expect(logoutButton.getAttribute('aria-label')).toBe('Wyloguj');
    expect(financeLink.getAttribute('href')).toBe('/dashboard/finances');
    expect(taskLink.getAttribute('href')).toBe('/dashboard/tasks');
    expect(fixture.nativeElement.querySelector('.account-menu-dropdown')).toBeNull();
  });

  it('should switch between the dashboard and routed section content', () => {
    component.onChildRouteActivate();
    expect(component.isDashboardView).toBe(false);

    component.onChildRouteDeactivate();
    expect(component.isDashboardView).toBe(true);
  });
});

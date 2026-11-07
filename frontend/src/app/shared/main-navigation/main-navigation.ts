import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-navigation.html',
  styleUrl: './main-navigation.css',
})
export class MainNavigation {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly currentUrl = signal(this.router.url);
  readonly space = input.required<'agent' | 'responsable'>();
  readonly landing = input(false);
  protected readonly expanded = signal(false);
  protected readonly moreOpen = signal(false);
  protected readonly secondaryDestinations = [
    { path: '/agent/scanner', label: 'Scanner', icon: 'scan' },
    { path: '/agent/incidents', label: 'Signalements', icon: 'incident' },
    { path: '/agent/profil', label: 'Profil', icon: 'profile' },
  ];
  protected readonly activeSecondary = computed(() =>
    this.secondaryDestinations.find((destination) => {
      const path = this.currentUrl().split(/[?#]/)[0];
      return (
        path === destination.path ||
        (destination.path.endsWith('/incidents') && path.startsWith(`${destination.path}/`))
      );
    }),
  );

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
        this.moreOpen.set(false);
      }
    });
  }

  protected closeMore(restoreFocus = true): void {
    this.moreOpen.set(false);
    if (restoreFocus)
      this.host.nativeElement.querySelector<HTMLButtonElement>('.more-toggle')?.focus();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.moreOpen()) this.closeMore();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onOutsidePointer(event: PointerEvent): void {
    if (
      this.moreOpen() &&
      !this.host.nativeElement.querySelector('.more-group')?.contains(event.target as Node)
    ) {
      this.closeMore(false);
    }
  }

  protected onMoreFocusOut(event: FocusEvent): void {
    // Un appui tactile peut produire un blur sans destination avant le clic sur le lien.
    // L'appui extérieur est déjà traité par pointerdown ; ne pas masquer ce lien trop tôt.
    if (
      event.relatedTarget &&
      !this.host.nativeElement
        .querySelector('.more-group')
        ?.contains(event.relatedTarget as Node | null)
    ) {
      this.closeMore(false);
    }
  }
  protected closeNavigation(): void {
    // Sur mobile, le lien va être masqué : placer le focus sur le contenu évite de le perdre.
    if (this.expanded() || this.moreOpen()) this.document.getElementById('main-content')?.focus();
    this.expanded.set(false);
    this.moreOpen.set(false);
  }
  protected readonly destinations = computed(() =>
    this.space() === 'agent'
      ? [
          { path: this.landing() ? '/' : '/agent', label: 'Accueil', icon: 'building' },
          { path: '/agent/equipements', label: 'Matériel', icon: 'equipment' },
          { path: '/agent/interventions', label: 'Interventions', icon: 'intervention' },
        ]
      : [
          { path: '/responsable', label: 'Tableau de bord', icon: 'building' },
          { path: '/responsable/incidents', label: 'Signalements', icon: 'warning' },
          { path: '/responsable/interventions', label: 'Interventions', icon: 'intervention' },
          { path: '/responsable/equipements', label: 'Matériel', icon: 'truck' },
          { path: '/responsable/scanner', label: 'Scanner', icon: 'scan' },
          { path: '/responsable/agents', label: 'Agents', icon: 'agents' },
        ],
  );
}

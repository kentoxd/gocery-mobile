import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
}

/**
 * Mapbox GL JS is loaded via a plain <script> tag (see index.html) instead
 * of `import mapboxgl from 'mapbox-gl'`. Importing it as an ES module hits
 * a known Angular dev-server (Vite) dependency-bundling bug with this
 * package that throws "__async is not defined" at runtime — Vite's
 * CommonJS-interop wrapping for mapbox-gl ends up split across two
 * mismatched chunks. Loading it as a global script sidesteps the bug
 * entirely (and matches how the web app already loads it). `@types/mapbox-gl`
 * is still a devDependency purely so this `declare` resolves real types.
 */
declare const mapboxgl: typeof import('mapbox-gl').default;

/**
 * Same "pin on map" delivery-location picker used on the web app
 * (Mapbox GL JS). The pin stays fixed at the center of the screen and
 * the map pans underneath it — this is more reliable on touch devices
 * than a draggable marker. Confirming reverse-geocodes the center point
 * to a human-readable address via the Mapbox Geocoding API.
 */
@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-picker.component.html',
  styleUrl: './location-picker.component.css'
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  @Input() initialLat = 14.6255;  // Cubao, Quezon City — same default center as web
  @Input() initialLng = 121.0517;
  @Output() confirmed = new EventEmitter<PickedLocation>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private map?: mapboxgl.Map;
  searchQuery = '';
  searchResults: { name: string; lat: number; lng: number }[] = [];
  searching = signal(false);
  resolvedAddress = signal('');
  locating = signal(false);
  error = signal('');

  ngAfterViewInit() {
    mapboxgl.accessToken = environment.mapboxToken;
    this.map = new mapboxgl.Map({
      container: this.mapEl.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.initialLng, this.initialLat],
      zoom: 14
    });
    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    this.map.on('moveend', () => this.reverseGeocodeCenter());
    this.map.on('load', () => this.reverseGeocodeCenter());
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private get center(): { lat: number; lng: number } {
    const c = this.map!.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  private async reverseGeocodeCenter() {
    const { lat, lng } = this.center;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${environment.mapboxToken}&country=ph&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      this.resolvedAddress.set(data?.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      this.resolvedAddress.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  async search() {
    const q = this.searchQuery.trim();
    if (!q) { this.searchResults = []; return; }
    this.searching.set(true);
    this.error.set('');
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${environment.mapboxToken}&country=ph&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      this.searchResults = (data?.features || []).map((f: any) => ({
        name: f.place_name,
        lng: f.center[0],
        lat: f.center[1]
      }));
      if (!this.searchResults.length) this.error.set('No matches found — try a different search.');
    } catch {
      this.error.set('Search failed. Check your connection and try again.');
    } finally {
      this.searching.set(false);
    }
  }

  selectResult(r: { name: string; lat: number; lng: number }) {
    this.searchResults = [];
    this.searchQuery = '';
    this.map?.flyTo({ center: [r.lng, r.lat], zoom: 16 });
  }

  useMyLocation() {
    if (!navigator.geolocation) {
      this.error.set('Location services are not available on this device.');
      return;
    }
    this.locating.set(true);
    this.error.set('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.locating.set(false);
        this.map?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 });
      },
      () => {
        this.locating.set(false);
        this.error.set('Could not get your current location. Please allow location access, or search instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  confirm() {
    const { lat, lng } = this.center;
    this.confirmed.emit({ lat, lng, address: this.resolvedAddress() });
  }

  close() {
    this.cancelled.emit();
  }
}

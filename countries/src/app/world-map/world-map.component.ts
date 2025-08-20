import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrl: './world-map.component.css'
})
export class WorldMapComponent implements AfterViewInit {
  
  private selectedCountry: SVGElement | null = null;
  
  constructor(
    private elementRef: ElementRef,
    private http: HttpClient
  ) {}
  
  ngAfterViewInit() {
    console.log('Component view initialized');
    this.loadSvgContent();
  }
  
  private loadSvgContent() {
    // Load SVG content as text and inject it directly
    this.http.get('assets/map-image.svg', { responseType: 'text' })
      .subscribe({
        next: (svgContent) => {
          console.log('SVG content loaded successfully');
          this.injectSvgContentAndSetupInteraction(svgContent);
        },
        error: (error) => {
          console.error('Failed to load SVG:', error);
        }
      });
  }
  
  private injectSvgContentAndSetupInteraction(svgContent: string) {
    // Find the map column div and inject SVG content
    const mapColumnDiv = this.elementRef.nativeElement.querySelector('.map-column');
    
    // Replace the object element with the SVG content
    const objectElement = mapColumnDiv.querySelector('object');
    if (objectElement) {
      objectElement.outerHTML = svgContent;
    }
    
    // Now set up interaction on the injected SVG
    this.setupMapInteraction();
  }
  
  private setupMapInteraction() {
    console.log('Setting up map interaction...');
    
    // Now we can access the SVG directly in our component
    const svgElement = this.elementRef.nativeElement.querySelector('svg');
    console.log('SVG element found:', svgElement);
    
    if (!svgElement) {
      console.error('SVG element not found');
      return;
    }
    
    // Find countries using different selectors
    let countries = svgElement.querySelectorAll('path[name][id]');
    console.log('Countries with path[name][id]:', countries.length);
    
    if (countries.length === 0) {
      countries = svgElement.querySelectorAll('path[id]');
      console.log('Countries with path[id]:', countries.length);
    }
    
    if (countries.length === 0) {
      countries = svgElement.querySelectorAll('path');
      console.log('All paths found:', countries.length);
      
      // Log first few paths to see their structure
      for (let i = 0; i < Math.min(3, countries.length); i++) {
        const path = countries[i];
        console.log(`Path ${i}:`, {
          id: path.getAttribute('id'),
          name: path.getAttribute('name'),
          class: path.getAttribute('class')
        });
      }
    }
    
    if (countries.length === 0) {
      console.error('No paths found at all!');
      return;
    }
    
    // Set up event listeners
    countries.forEach((country: Element, index: number) => {
      const svgCountryElement = country as SVGElement;
      
      if (index < 3) {
        console.log('Setting up country:', svgCountryElement.getAttribute('name'), svgCountryElement.getAttribute('id'));
      }
      
      svgCountryElement.style.cursor = 'pointer';
      svgCountryElement.style.fill = '#cccccc';
      
      svgCountryElement.addEventListener('click', (event) => this.onCountryClick(event));
      svgCountryElement.addEventListener('mouseover', (event) => this.onCountryHover(event));
      svgCountryElement.addEventListener('mouseout', (event) => this.onCountryMouseOut(event));
    });
    
    console.log('Event listeners added to', countries.length, 'countries');
  }
  
  private onCountryClick(event: Event) {
    
    // console.log('CLICK EVENT!');
    const target = event.target as SVGElement;
    const countryCodeId = target.getAttribute('id')?.toUpperCase();
    const countryName = target.getAttribute('name');
    
    // Reset previously selected country to default color
    if (this.selectedCountry && this.selectedCountry !== target) {
      this.selectedCountry.style.fill = '#cccccc';
    }
    
    // Set the new selected country
    this.selectedCountry = target;
    target.style.fill = '#2a06ac';
    
    console.log('Clicked country:' + ' ' + countryName + ', ' + 'Code:' + ' ' + countryCodeId);
    // TODO: Replace console.log with API service call
    // this.countryService.getCountryData(countryCode);
  }
  
  private onCountryHover(event: Event) {
    // console.log('HOVER EVENT!');
    const target = event.target as SVGElement;
    target.style.fill = '#a28eea';
  }
  
  private onCountryMouseOut(event: Event) {
    // console.log('MOUSEOUT EVENT!');
    const target = event.target as SVGElement;
    
    // Only reset to default color if this country is not currently selected
    if (target !== this.selectedCountry) {
      target.style.fill = '#cccccc';
    }
  }
}
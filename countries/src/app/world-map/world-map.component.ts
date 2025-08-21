import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CountryService, CountryInfo } from '../services/country.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-world-map',
  imports: [CommonModule],
  templateUrl: './world-map.component.html',
  styleUrl: './world-map.component.css'
})
export class WorldMapComponent implements AfterViewInit {
  
  private selectedCountry: SVGElement | null = null;
  selectedCountryInfo: CountryInfo | null = null;
  
  constructor(
    private elementRef: ElementRef,
    private http: HttpClient,
    private countryService: CountryService 
  ) {}
  
  ngAfterViewInit() {
    // console.log('Component view initialized');
    this.loadSvgContent();
  }
  
  private loadSvgContent() {
    // Load SVG content as text and inject it directly
    this.http.get('assets/map-image.svg', { responseType: 'text' })
      .subscribe({
        next: (svgContent) => {
          // console.log('SVG loaded successfully');
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

  private handleCountrySelection(countryCode: string) {
    // console.log('Fetching data for country:', countryCode);
    
    this.selectedCountryInfo = {
      name: 'Loading...',
      capital: 'Loading...',
      region: 'Loading...',
      incomeLevel: 'Loading...',
      population: 'Loading...',
      languages: 'Loading...'
    };

    forkJoin({
      worldBank: this.countryService.getCountryData(countryCode),
      restCountries: this.countryService.getRestCountriesData(countryCode)
    }).subscribe({
      next: (results) => {
        this.combineApiData(results.worldBank, results.restCountries);
      },
      error: (error) => {
        console.error('API error:', error);
        this.handleNoDataAvailable();
      }
    });
  }

  private combineApiData(worldBankData: any, restCountriesData: any) {
    let countryInfo: CountryInfo;
  
    // Parse World Bank data if available
    if (worldBankData && worldBankData[1] && worldBankData[1].length > 0) {
      const wbCountry = worldBankData[1][0];
      if (wbCountry.name === 'West Bank and Gaza') {
        wbCountry.name = 'State of Palestine';
      }
      countryInfo = {
        name: wbCountry.name,
        capital: wbCountry.capitalCity,
        region: wbCountry.region.value,
        incomeLevel: wbCountry.incomeLevel.value,
        population: 'Not available',
        languages: 'Not available'
      };
    } else {
      // Fallback to RestCountries for basic info
      countryInfo = {
        name: this.selectedCountry?.getAttribute('name') || 'Unknown',
        capital: 'No data available',
        region: 'No data available',
        incomeLevel: 'No data available',
        population: 'Not available',
        languages: 'Not available'
      };
    }
  
    // Add RestCountries data if available
    if (restCountriesData && restCountriesData[0]) {
      const rcCountry = restCountriesData[0];
      
      // Population
      if (rcCountry.population) {
        countryInfo.population = rcCountry.population.toLocaleString();
      }
  
      // Languages (top 3 most common)
      if (rcCountry.languages) {
        const languageValues = Object.values(rcCountry.languages) as string[];
        const top3Languages = languageValues.slice(0, 3);
        countryInfo.languages = top3Languages.join(', ');
      }
    }
  
    this.selectedCountryInfo = countryInfo;
  }


  private handleNoDataAvailable() {
    // Get country name from the clicked SVG element if available
    const countryName = this.selectedCountry?.getAttribute('name') || 'this country';
    
    this.selectedCountryInfo = {
      name: countryName,
      capital: 'No data available',
      region: 'No data available', 
      incomeLevel: 'No data available',
      population: 'No data available',
      languages: 'No data available'
    };
  }

  private setupMapInteraction() {
    // console.log('Setting up map interaction...');
    
    // SVG directly accessed in component
    const svgElement = this.elementRef.nativeElement.querySelector('svg');
    // console.log('SVG element found:', svgElement);
    
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
      
      // if (index < 3) {
      //   console.log('Setting up country:', svgCountryElement.getAttribute('name'), svgCountryElement.getAttribute('id'));
      // }
      
      svgCountryElement.style.cursor = 'pointer';
      svgCountryElement.style.fill = '#cccccc';
      
      svgCountryElement.addEventListener('click', (event) => this.onCountryClick(event));
      svgCountryElement.addEventListener('mouseover', (event) => this.onCountryHover(event));
      svgCountryElement.addEventListener('mouseout', (event) => this.onCountryMouseOut(event));
    });
    
    // console.log('Event listeners added to', countries.length, 'countries');
  }

  private onCountryClick(event: Event) {
    
    // console.log('CLICK EVENT!');
    const target = event.target as SVGElement;

    const countryCodeId = target.getAttribute('id')?.toUpperCase();
    // const countryName = target.getAttribute('name');
    
    // Reset previously clicked country to default color
    if (this.selectedCountry && this.selectedCountry !== target) {
      this.selectedCountry.style.fill = '#cccccc';
    }
    
    // Set the newly clicked country
    this.selectedCountry = target;
    target.style.fill = '#2a06ac';
    
    // console.log('Clicked country:' + ' ' + countryName + ', ' + 'Code:' + ' ' + countryCodeId);
    if (countryCodeId) {
      this.handleCountrySelection(countryCodeId);
    }
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
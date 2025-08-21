import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CountryInfo {
  name: string;
  capital: string;
  region: string;
  incomeLevel: string;
  population: string;
  languages: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) {}

  // Method 1: World Bank API for basic country info
  getCountryData(countryCode: string): Observable<any> {
    const url = `https://api.worldbank.org/v2/countries/${countryCode}?format=json`;
    return this.http.get(url);
  }

  // Method 2: RestCountries API for population and languages
  getRestCountriesData(countryCode: string): Observable<any> {
    const url = `https://restcountries.com/v3.1/alpha/${countryCode}`;
    return this.http.get(url);
  }
}
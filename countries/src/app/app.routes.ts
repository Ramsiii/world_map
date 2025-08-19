import { Routes } from '@angular/router';

// import the WorldMapComponent from world-map.app.component.ts
import { WorldMapComponent } from './world-map/world-map.component';

// configure root component to redirect to /world-map and use the WorldMapComponent 
export const routes: Routes = [
    { path: '', redirectTo: '/world-map', pathMatch: 'full' },
    { path: 'world-map', component: WorldMapComponent }
  ];

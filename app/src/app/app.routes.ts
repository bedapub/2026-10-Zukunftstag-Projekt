import { Routes } from '@angular/router';
import { HomePage } from './features/home/home';
import { HostPage } from './features/host/host';
import { HostOverviewPage } from './features/host/overview';
import { JoinPage } from './features/join/join';
import { PlayPage } from './features/play/play';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'join', component: JoinPage },
  { path: 'join/:code', component: JoinPage },
  { path: 'host', component: HostOverviewPage },
  { path: 'host/:code', component: HostPage },
  { path: 'play/:code', component: PlayPage },
  { path: '**', redirectTo: '' },
];

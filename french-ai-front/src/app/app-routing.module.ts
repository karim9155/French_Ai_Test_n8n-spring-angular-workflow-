import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QnaComponent } from './qna/qna.component';
import { RecordingsPageComponent } from './recordings-page/recordings-page.component'; // Added FormsModule
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: QnaComponent },
  { path: 'recordings', component: RecordingsPageComponent }, // Add the new route
  { path: 'dashboard', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

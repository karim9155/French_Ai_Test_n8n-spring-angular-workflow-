import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QnaComponent } from './qna/qna.component';
import { RecordingsPageComponent } from './recordings-page/recordings-page.component'; // Added FormsModule

const routes: Routes = [
  { path: '', component: QnaComponent },
  { path: 'recordings', component: RecordingsPageComponent } // Add the new route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

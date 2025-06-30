import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {QnaComponent} from './qna/qna.component';

const routes: Routes = [
  { path: '', component: QnaComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

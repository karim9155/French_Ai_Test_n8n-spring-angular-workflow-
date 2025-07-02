import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { QnaComponent } from './qna/qna.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Added CommonModule
import { FormsModule } from '@angular/forms';
import { RecordingsPageComponent } from './recordings-page/recordings-page.component'; // Added FormsModule

@NgModule({
  declarations: [
    AppComponent,
    RecordingsPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    QnaComponent,
    HttpClientModule,
    // AppRoutingModule is often imported only once. If it's already here, it might be a duplicate from generation.
    // However, Angular is usually fine with this. Let's keep it as is unless issues arise.
    // AppRoutingModule
    CommonModule, // Added here
    FormsModule   // Added here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

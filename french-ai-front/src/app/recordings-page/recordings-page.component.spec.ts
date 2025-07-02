import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingsPageComponent } from './recordings-page.component';

describe('RecordingsPageComponent', () => {
  let component: RecordingsPageComponent;
  let fixture: ComponentFixture<RecordingsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecordingsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

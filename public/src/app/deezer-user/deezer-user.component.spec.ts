import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeezerUserComponent } from './deezer-user.component';

describe('DeezerUserComponent', () => {
  let component: DeezerUserComponent;
  let fixture: ComponentFixture<DeezerUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeezerUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeezerUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

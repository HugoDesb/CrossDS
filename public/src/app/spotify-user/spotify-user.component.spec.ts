import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotifyUserComponent } from './spotify-user.component';

describe('SpotifyUserComponent', () => {
  let component: SpotifyUserComponent;
  let fixture: ComponentFixture<SpotifyUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpotifyUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotifyUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

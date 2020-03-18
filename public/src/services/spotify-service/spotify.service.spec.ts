import { TestBed } from '@angular/core/testing';

import { SpotifyService } from '../services/spotify-service/spotyify.service';

describe('SpotifyService', () => {
  let service: SpotifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpotifyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

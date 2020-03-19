import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DeezerService {

  accessToken = JSON.parse(localStorage.getItem('deezer_access_token'));
  refreshToken = JSON.parse(localStorage.getItem('deezer_refresh_token'));

  constructor(private http: HttpClient) { }

  public connect() {
    this.http.get('http://localhost:8888/deezer/login/').subscribe(data => {
      console.log(data);
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  private access_token = JSON.parse(localStorage.getItem('spotify_access_token'));
  private refresh_token = JSON.parse(localStorage.getItem('spotify_refresh_token'));

  constructor(private http:HttpClient) {
  }

  public connect(){
    this.http.get('http://localhost:8888/spotify/login/').subscribe(data =>{
      console.log(data);
    });
  }
}
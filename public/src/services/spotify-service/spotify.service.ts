import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  private access_token = JSON.parse(localStorage.getItem('spotify_access_token'));
  private refresh_token = JSON.parse(localStorage.getItem('spotify_refresh_token'));

  constructor(private http:HttpClient) {
  }

  public connect(){

    this.http.get<SpotifyAuthURL>('http://localhost:4200/api/spotify/login/').subscribe(data =>{
      if(data.success){
        console.log(data.data);
        window.location.href = data.data;
      } 
    });
  }
}

export interface SpotifyAuthURL {
  success: boolean;
  data: string;
}
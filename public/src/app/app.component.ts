import { Component } from '@angular/core';


import {SpotifyService} from '../services/spotify-service/spotify.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(private spotifyService:SpotifyService){

  }

  title = 'crossDSN';

  connectToDeezer(){
    console.log("Not Yet Implemented")
  };
  connectToSpotify(){
    this.spotifyService.connect();
  };
}

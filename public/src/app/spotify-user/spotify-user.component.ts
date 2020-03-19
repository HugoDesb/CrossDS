import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../services/spotify-service/spotify.service';

@Component({
  selector: 'app-spotify-user',
  templateUrl: './spotify-user.component.html',
  styleUrls: ['./spotify-user.component.css']
})
export class SpotifyUserComponent implements OnInit {

  private access_token ='no';
  private refresh_token ='no';

  constructor(private spotifyService:SpotifyService){}

  ngOnInit(): void {
  }

  connectToSpotify(){
    this.spotifyService.connect();
  };

}

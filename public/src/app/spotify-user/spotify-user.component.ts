import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SpotifyService } from 'src/services/spotify-service/spotify.service';

@Component({
  selector: 'app-spotify-user',
  templateUrl: './spotify-user.component.html',
  styleUrls: ['./spotify-user.component.css']
})
export class SpotifyUserComponent implements OnInit {

  connected= false;

  account;

  constructor(@Inject(DOCUMENT) private document: Document, private spotifyService:SpotifyService){}

  ngOnInit(): void {
    if (this.getCookie("account_id_spotify") != "") {
      console.log('The cookie "reader" exists (ES6)')
      //get Infos
      this.spotifyService.getUserInfos(this.getCookie("account_id_spotify"))
        .subscribe(ret => {
          this.account= ret.data;
          this.connected = true;
      })
    }
  };

  connect(): void{
    console.log(this.spotifyService)
    this.spotifyService.connect();
  };

  getCookie(cname : string): string{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  };

  
}

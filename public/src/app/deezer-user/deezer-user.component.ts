import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DeezerService } from 'src/services/deezer-service/deezer.service';


@Component({
  selector: 'app-deezer-user',
  templateUrl: './deezer-user.component.html',
  styleUrls: ['./deezer-user.component.css']
})
export class DeezerUserComponent implements OnInit {

  connected= false;

  account;

  constructor(@Inject(DOCUMENT) private document: Document, private deezerService:DeezerService) {

  }

  ngOnInit(): void {
    if (this.getCookie("deezer_access_token") != "") {
      console.log('The cookie "reader" exists (ES6)')
      //get Infos
      this.deezerService.getUserInfos(this.getCookie("deezer_access_token"))
        .subscribe(ret => {
          this.account= ret.data;
          this.connected = true;
      })
    }
  }

  connect(): void{
    console.log(this.deezerService)
    this.deezerService.connect();
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

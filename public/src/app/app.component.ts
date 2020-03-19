import { Component, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private spotify_access_token = 'no';
  private spotify_refresh_token = 'no';

  constructor(private route: ActivatedRoute){

  }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.spotify_access_token = params.get('spotify_access_token');
      this.spotify_refresh_token = params.get('spotify_refresh_token');
    });
  }

  connectToDeezer(){
    console.log("Not Yet Implemented")
  };
}

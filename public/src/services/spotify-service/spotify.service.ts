import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import { Account } from "../../app/account";


@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  service: string;

  constructor(private http:HttpClient) {
    this.service = "spotify";
  }
  
  public connect(): void{
    this.http.get<OAuthURL>('http://localhost:4200/api/login/'+this.service).subscribe(data =>{
      if(data.success){
        window.location.href = data.url;
      } else{
        console.log("Can't get OAuth URL for service:"+this.service+" at "+'http://localhost:4200/api/login/'+this.service);
      }
    });
  };

  public getUserInfos(account_id: string): Observable<UserInfo>{
    return this.http.get<UserInfo>('http://localhost:4200/api/user/'+account_id);
  }
}

export interface UserInfo {
  success: boolean,
  data : Account
}

export interface OAuthURL {
  success: boolean;
  url: string;
}
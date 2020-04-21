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
    this.http.get<OAuthURL>('http://localhost:4200/api/'+this.service+'/login/').subscribe(data =>{
      if(data.success){
        window.location.href = data.data;
      } else{
        console.log("Can't get OAuth URL for service:"+this.service+" at "+'http://localhost:4200/api/'+this.service+'/login/');
      }
    });
  };

  public getUserInfos(access_token: string): Observable<UserInfo>{
    return this.http.post<UserInfo>('http://localhost:4200/api/user/info', {access_token: access_token, service:this.service});
  }
}

export interface UserInfo {
  success: boolean,
  data : Account
}

export interface OAuthURL {
  success: boolean;
  data: string;
}
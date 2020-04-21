import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import { Account } from "../../app/account";

@Injectable({
  providedIn: 'root'
})
export class AccountService {  

  constructor(
    private http:HttpClient,
    @Inject('serviceName') private serviceName: string) { 
    this.service = serviceName;
  }

  service:string;


  display_name: string;
  username: string;
  picture_url: string;
  email: string;
  access_token: string;

  display_nameChange: Subject<string> = new Subject<string>();
  usernameChange: Subject<string> = new Subject<string>();
  picture_urlChange: Subject<string> = new Subject<string>();
  emailChange: Subject<string> = new Subject<string>();
  access_tokenChange: Subject<string> = new Subject<string>();


  public connect(): void{
    this.http.get<OAuthURL>('http://localhost:4200/api/'+this.service+'/login/').subscribe(data =>{
      if(data.success){
        window.location.href = data.data;
      } else{
        console.log("Can't get OAuth URL for service:"+this.service+" at "+'http://localhost:4200/api/'+this.service+'/login/');
      }
    });
  }

  public getUserInfos(access_token: string): Observable<UserInfo>{
    return this.http.post<UserInfo>('http://localhost:4200/api/user/info', {access_token: access_token, service:this.service});
    /*
    this.http.post<UserInfo>('http://localhost:4200/api/user/info', {access_token: access_token, service:this.service}).subscribe(data =>{
      if(data.success){
        console.log(data.data);
        this.display_name = data.data.display_name;
        this.display_nameChange.next(this.display_name);
        this.username = data.data.username;
        this.usernameChange.next(this.username);
        this.picture_url = data.data.picture_url;
        this.picture_urlChange.next(this.picture_url);
        this.email = data.data.email;
        this.emailChange.next(this.email);
        this.access_token = data.data.access_token;
        this.access_tokenChange.next(this.access_token);
      } else{
        console.log("Can't get user info service:"+this.service+", access_token:"+access_token);
      }
    });
    */
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
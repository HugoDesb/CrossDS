import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import {RouterModule ,Routes } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { SpotifyUserComponent } from './spotify-user/spotify-user.component';
import { DeezerUserComponent } from './deezer-user/deezer-user.component';
import { AccountInfoComponent } from './account-info/account-info.component';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    SpotifyUserComponent,
    DeezerUserComponent,
    AccountInfoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule.forRoot([
      {path:'', component:AppComponent},
      //{path: '/callback/spotify/:access_token', component: CallbackSpotifyComponent },
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }


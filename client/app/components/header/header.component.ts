import { Component } from '@angular/core';
import { Cookie }    from 'ng2-cookies/ng2-cookies';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';

import { UserService }  from '../../services/user/user.service';
import { ClockService } from '../../services/clock/clock.service';

import { User } from '../../models/models.namespace';

@Component({
  moduleId: module.id,
  selector: 'header-section',
  providers: [
    UserService,
    ClockService
  ],
  template: `
    <header>
      <a routerLink='/' routerLinkActive='active' [routerLinkActiveOptions]="{exact:true}">Home</a>
      <a routerLink='/profile' routerLinkActive='active'>Profile</a>
      <a routerLink='/yoloswaq69420blazeitfgt' routerLinkActive='active'>404</a>
      <div class='user-sign'>
        <h3 *ngIf='currentUser'>Welcome, {{currentUser.userName}}</h3>
        <button *ngIf='!currentUser' type='button' (click)='testRegisterUser()'>Sign up</button>
        <button *ngIf='!currentUser' type='button' (click)='testUser()'>Sign in</button>
        <button type='button' (click)='logout()'>Sign out</button>
      </div>
      <h1 class='app-title'>MEA2N Fullstack</h1>
      <h2>{{clock | async | date: 'mediumTime'}}{{clockService.period}}</h2>
    </header>`,
  styles: [`
    header{
      background: rgb(55, 129, 215);
      position: relative;
    }
    .user-sign{
      position: absolute;
      top:0;
      right:0;
      margin: 23px 5%;
    }
    .app-title{
      font-family: cursive;
      padding: 15px;
      text-align: center;
      font-size: 36px;
      color: white;
    }
    .user-sign button:hover{
      cursor: pointer;
    }
    .active{
      color: orange;
    }`]
})

export class HeaderComponent {
  public currentUser: User;
  clock;

  constructor(private userService: UserService, private clockService: ClockService) {

    this.clock = this.clockService.currentTime;
  }

  ngOnInit() {
    if (Cookie.get('token'))
      this.userService.getMe().subscribe(user => this.currentUser = user);
  }

  login(email: string, password: string) {
    this.userService.login(email, password)
      .subscribe(user => this.currentUser = user);
  }

  logout() {
    this.userService.logout();
    this.currentUser = null;
  }

  registerUser(username: string, email: string, password: string) {
    this.userService.signup(username, email, password)
      .subscribe(user => this.currentUser = user);
  }

  testUser() {
    this.login('jc.thomas4214@gmail.com', 'flight1855');
  }

  testRegisterUser() {
    this.registerUser('Jays', 'jc.thomas42@gmail.com', 'flight1855');
  }
}

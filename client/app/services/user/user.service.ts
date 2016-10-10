import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Cookie } from 'ng2-cookies/ng2-cookies';

import { User, mapUser } from '../../models/models.namespace';

import 'rxjs/Rx';

@Injectable()
export class UserService {
    constructor(private http: Http) { }

    // Private variables that only this service can use
    private authUrl = 'auth/local';
    private userUrl = 'api/users';

    private extractToken(res: Response): Observable<User> {
        let body = res.json();
        Cookie.set('token', body.token);
        return body || { };
    }

    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }

    // Public functions that components may call
    getMe(): Observable<User> {
        return this.http.get(this.userUrl + '/me')
            .map(mapUser)
            .catch(this.handleError);
    }

    login(email: string, password: string): Observable<User> {
        let body = JSON.stringify({
            email: email,
            password: password
        });

        return this.http.post(this.authUrl, body)
            .map(this.extractToken)
            .catch(this.handleError);
    }

    logout() {
        Cookie.delete('token');
    }

    signup(username: string, email: string, password: string): Observable<User> {
        let body = JSON.stringify({
            userName: username,
            email: email,
            password: password
        });

        return this.http.post(this.userUrl, body)
            .map(this.extractToken)
            .catch(this.handleError);
    }
}

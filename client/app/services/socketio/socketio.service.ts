import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import * as SocketFactory from 'socket.io';
import * as _ from 'lodash';

import * as Models from '../../models/models.namespace';

@Injectable()
export class SocketService {
  constructor() {
    // socket.io now auto-configures its connection when we ommit a connection url
    var socket = io('', {
      // Send auth token on connection, you will need to DI the Auth service above
      // 'query': 'token=' + Auth.getToken()
      path: '/socket.io'
    });

    // var socket = SocketFactory({ ioSocket });

    return {
      socket,

      /**
       * Register listeners to sync an array with updates on a model
       *
       * Takes the array we want to sync, the model name that socket updates are sent from,
       * and an optional callback function after new items are updated.
       *
       * @param {String} modelName
       * @param {Array} array
       * @param {Function} cb
       */
      syncUpdates(modelName: string, array: Models.Universal[], cb) {
        cb = cb || null;

        /**
         * Syncs item creation/updates on 'model:save'
         */
        socket.on(modelName + ':save', function(item) {
          let oldItem = _.find(array, { _id: item._id });
          let index = array.indexOf(oldItem);
          let event = 'created';

          // replace oldItem if it exists
          // otherwise just add item to the collection
          if (oldItem) {
            oldItem.replace(item);
            event = 'updated';
          } else {
            // Finds the model for the listener
            // and pushes a new object to array
            array.push(new Models[modelName](item));
          }

          cb(event, item, array);
        });

        /**
         * Syncs removed items on 'model:remove'
         */
        socket.on(modelName + ':remove', function(item) {
          var event = 'deleted';
          _.remove(array, { _id: item._id });
          cb(event, item, array);
        });
      },

      /**
       * Removes listeners for a models updates on the socket
       *
       * @param modelName
       */
      unsyncUpdates(modelName) {
        socket.removeListener(modelName + ':save');
        socket.removeListener(modelName + ':remove');

        // User socket listeners will be here
      }
    };
  }
}

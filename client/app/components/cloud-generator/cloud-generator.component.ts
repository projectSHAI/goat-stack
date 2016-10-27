import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';

import { WonderService } from '../../services/wonder/wonder.service';
import { SocketService } from '../../services/socketio/socketio.service';
import { CloudProps } from './cloud-props';

import { Wonder, cloneWonders } from '../../models/models.namespace';

@Component({
  selector: 'cloud-generator',
  providers: [WonderService, CloudProps],
  templateUrl: './cloud-generator.component.html',
  styleUrls: ['./cloud-generator.component.scss']
})

export class CloudGeneratorComponent {
  @ViewChild('wonderSky') wonderSky;

  beforeWonders: Wonder[];
  afterWonders: Wonder[];

  dream = 'Wonders';

  constructor(
    private wonderService: WonderService,
    private socket: SocketService,
    private cp: CloudProps) { }

  ngOnInit() {
    this.wonderService.getWonders()
      .subscribe(wonders => {
        this.beforeWonders = wonders;

        this.afterWonders = cloneWonders(wonders);
        this.afterWonders.forEach((item, index) => this.cp.cloudType(item.name.length, index));

        this.socket.syncUpdates('Wonder', this.beforeWonders, (item, index) => {
          this.cp.cloudAnimaAfter(this.wonderSky.nativeElement.children[index], this.afterWonders, item, index);
        });
      });
  }

  ngOnDestroy() {
    this.socket.unsyncUpdates('Wonder');
  }

  saveWonder(name: string) {
    this.wonderService.saveWonder(name).subscribe();
  }

}

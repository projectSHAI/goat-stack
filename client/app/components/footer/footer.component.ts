import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'footer-section',
  template: `
  	<footer class="footer">
  	  <a class="docs" href="https://github.com/projectSHAI/expressgular2/blob/master/README.md"><p>Docs</p></a>
  	</footer>`,
  styles: [`
    footer{
  	    position: fixed;
  	    bottom: 0;
  	    right:0;
  	    left:0;
  	    background: rgb(224, 150, 50);
  	}
  	footer .docs{
  	  color: white;
  	  text-decoration: none;
  	  padding: 15px;
  	}`]
})

export class FooterComponent { }

import {inject, customAttribute} from 'aurelia-framework';

@inject(Element)
@customAttribute('bind-to')
export class BindToArray {
  constructor(element){
    this.element = element;
    debugger;
  }

  bind() {
    debugger;
    if (Object.prototype.toString.call(this.value) == '[object Array]') {
      this.value.push(this.element);
      debugger;
    }
  }
}

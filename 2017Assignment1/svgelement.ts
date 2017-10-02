// a little d3-like wrapper for creating and getting/setting attributes on SVG elements
class Elem {
  elem: Element;
  //tag attribute stores the tag of the element
  tag: string;
  // svg is the parent SVG object that will host the new element
  // tag: could be rect, line, ellipse, etc.
  constructor(svg: HTMLElement, tag: string) {
    this.elem = document.createElementNS(svg.namespaceURI, tag);
    svg.appendChild(this.elem);
    //stores the tag of the svg element
    this.tag = tag;
  }

  // all purpose attribute getter/setter
  // call with just the name of the attribute it returns the attributes current value
  // called with the name and a new value it sets the attribute and returns this object
  // so subsequent calls can be chained
  attr(name: string): string
  attr(name: string, value: string | number): this
  attr(name: string, value?: string | number): this | string {
    if (typeof value === 'undefined') {
      return this.elem.getAttribute(name);
    }
    this.elem.setAttribute(name, <string>value);
    return this;
  }

  // return an observable for the specified event on this element
  observe<T extends Event>(event: string): Observable<T> {
    return Observable.fromEvent<T>(this.elem, event);
  }

  //getter function to get the tag of the shape
  //this is used to detect whether a shape is a circle/rect/ellipse
  //which aids in certain functions used in diagrameditor.ts
  get_tag():string{
    return this.tag;
  }
}
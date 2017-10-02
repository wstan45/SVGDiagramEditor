class Elem {
    constructor(svg, tag) {
        this.elem = document.createElementNS(svg.namespaceURI, tag);
        svg.appendChild(this.elem);
        this.tag = tag;
    }
    attr(name, value) {
        if (typeof value === 'undefined') {
            return this.elem.getAttribute(name);
        }
        this.elem.setAttribute(name, value);
        return this;
    }
    observe(event) {
        return Observable.fromEvent(this.elem, event);
    }
    get_tag() {
        return this.tag;
    }
}
//# sourceMappingURL=svgelement.js.map
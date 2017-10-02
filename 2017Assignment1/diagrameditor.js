function loadPalette() {
    const svg = document.getElementById("palette");
    var shapes = [];
    const rect = new Elem(svg, 'rect')
        .attr('x', 100).attr('y', 50)
        .attr('width', 120).attr('height', 50)
        .attr('fill', '#95B3D7');
    const circle = new Elem(svg, 'circle')
        .attr('cx', 160).attr('cy', 180)
        .attr('r', 50).attr('fill', '#95B3D7');
    const ellipse = new Elem(svg, 'ellipse')
        .attr('cx', 160).attr('cy', 290)
        .attr('rx', 40).attr('ry', 30)
        .attr('fill', '#95B3D7');
    const roundedrect = new Elem(svg, 'rect')
        .attr('x', 100).attr('y', 350)
        .attr('width', 120).attr('height', 50)
        .attr('rx', 20).attr('ry', 20)
        .attr('fill', '#95B3D7');
    const square = new Elem(svg, 'rect')
        .attr('x', 135).attr('y', 430)
        .attr('width', 50).attr('height', 50)
        .attr('fill', '#95B3D7');
    rect.observe('mousedown')
        .subscribe(() => drawRectObservable(shapes));
    circle.observe('mousedown')
        .subscribe(() => drawCircleObservable(shapes));
    ellipse.observe('mousedown')
        .subscribe(() => drawEllipseObservable(shapes));
    roundedrect.observe('mousedown')
        .subscribe(() => drawRoundedRectObservable(shapes));
    square.observe('mousedown')
        .subscribe(() => drawSquareObservable(shapes));
}
function addBehaviourShowUI(shape, svg, shapes) {
    var shape_x;
    var shape_y;
    var shape_width;
    var shape_height;
    if (shape.get_tag() == 'circle') {
        shape_x = 'cx';
        shape_y = 'cy';
        shape_height = 'r';
        shape_width = 'r';
    }
    else if (shape.get_tag() == 'rect') {
        shape_x = 'x';
        shape_y = 'y';
        shape_height = 'height';
        shape_width = 'width';
    }
    else if (shape.get_tag() == 'ellipse') {
        shape_x = 'cx';
        shape_y = 'cy';
        shape_height = 'ry';
        shape_width = 'rx';
    }
    const text = new Elem(svg, 'text')
        .attr('x', Number(shape.attr(shape_x)))
        .attr('y', Number(shape.attr(shape_y)))
        .attr('fill', '#CD5C5C')
        .attr('font-weight', 700);
    text.elem.textContent = 'link';
    const mousemove = shape.observe('mousemove');
    mousemove.subscribe(() => {
        text.attr('x', Number(shape.attr(shape_x)))
            .attr('y', Number(shape.attr(shape_y)));
    });
    text.observe('mouseenter').subscribe(() => svg.style.cursor = "pointer");
    text.observe('mouseleave').subscribe(() => svg.style.cursor = "default");
    text.observe('click')
        .subscribe(() => {
        Observable.fromEvent(svg, "dblclick")
            .takeUntil(Observable.fromEvent(text.elem, "dblclick"))
            .subscribe(e => {
            var target_x;
            var target_y;
            var target_elem;
            let mu_target = e.target;
            for (var i = 0, size = shapes.length; i < size; i++) {
                var item = shapes[i];
                if (item.elem == mu_target) {
                    target_elem = item;
                    break;
                }
            }
            if (target_elem != undefined) {
                let line = new Elem(svg, 'line')
                    .attr('x1', Number(shape.attr(shape_x)))
                    .attr('y1', Number(shape.attr(shape_y)))
                    .attr('x2', e.clientX)
                    .attr('y2', e.clientY)
                    .attr('stroke', '#FF00FF')
                    .attr('stroke-width', 2);
                moveLine(line, shape, target_elem);
            }
        });
    });
}
function moveLine(line, shape1, shape2) {
    const svg = document.getElementById('diagrameditor');
    let shape1_obs = shape1.observe('mousedown');
    shape1_obs.flatMap(e => Observable.fromEvent(svg, 'mousemove')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({
        x1: e.clientX,
        y1: e.clientY
    })))
        .subscribe(({ x1, y1 }) => {
        line.attr('x1', x1).attr('y1', y1);
    });
    let shape2_obs = shape2.observe('mousedown');
    shape2_obs.flatMap(e => Observable.fromEvent(svg, 'mousemove')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({
        x2: e.clientX,
        y2: e.clientY
    })))
        .subscribe(({ x2, y2 }) => {
        line.attr('x2', x2).attr('y2', y2);
    });
}
function addBehaviourDrag(shape, svg) {
    var x_attribute;
    var y_attribute;
    var width;
    var height;
    if (shape.get_tag() == 'circle') {
        x_attribute = 'cx';
        y_attribute = 'cy';
    }
    else if (shape.get_tag() == 'rect') {
        x_attribute = 'x';
        y_attribute = 'y';
    }
    else if (shape.get_tag() == 'ellipse') {
        x_attribute = 'cx';
        y_attribute = 'cy';
    }
    shape.observe('mouseenter').subscribe(() => svg.style.cursor = "move");
    shape.observe('mouseleave').subscribe(() => svg.style.cursor = "default");
    let shape_obs = shape.observe('mousedown');
    shape_obs.map((e) => ({
        xOffset: Number(shape.attr(x_attribute)) - e.clientX,
        yOffset: Number(shape.attr(y_attribute)) - e.clientY
    }))
        .flatMap(({ xOffset, yOffset }) => Observable.fromEvent(svg, 'mousemove')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(({ clientX, clientY }) => ({
        x: clientX + xOffset,
        y: clientY + yOffset
    })))
        .subscribe(({ x, y }) => shape.attr(x_attribute, x).attr(y_attribute, y));
}
function drawEllipseObservable(shapes) {
    const svg = document.getElementById("diagrameditor");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({ event: e, svgBounds: svg.getBoundingClientRect() }))
        .map(({ event, svgBounds }) => ({
        ellipse: new Elem(svg, 'ellipse')
            .attr('cx', event.clientX - svgBounds.left)
            .attr('cy', event.clientY - svgBounds.top)
            .attr('rx', 10).attr('ry', 5)
            .attr('fill', '#95B3D7'),
        svgBounds: svgBounds
    }))
        .subscribe(({ ellipse, svgBounds }) => {
        shapes.push(ellipse);
        const ox = Number(ellipse.attr('cx')), oy = Number(ellipse.attr('cy'));
        Observable.fromEvent(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({ clientX, clientY }) => ({
            ellipse, ox, oy,
            x: clientX - svgBounds.left,
            y: clientY - svgBounds.top
        }))
            .subscribe(({ ellipse, ox, oy, x, y }) => {
            ellipse.attr('cx', Math.min(x, ox))
                .attr('cy', Math.min(y, oy))
                .attr('rx', Math.abs(ox - x) / 2)
                .attr('ry', Math.abs(oy - y) / 2);
        });
        addBehaviourDrag(ellipse, svg);
        addBehaviourShowUI(ellipse, svg, shapes);
    });
}
function drawRoundedRectObservable(shapes) {
    const svg = document.getElementById("diagrameditor");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({ event: e, svgBounds: svg.getBoundingClientRect() }))
        .map(({ event, svgBounds }) => ({
        roundedrect: new Elem(svg, 'rect')
            .attr('x', event.clientX - svgBounds.left)
            .attr('y', event.clientY - svgBounds.top)
            .attr('width', 5)
            .attr('height', 5)
            .attr('rx', 20)
            .attr('ry', 20)
            .attr('fill', '#95B3D7'),
        svgBounds: svgBounds
    }))
        .subscribe(({ roundedrect, svgBounds }) => {
        shapes.push(roundedrect);
        const ox = Number(roundedrect.attr('x')), oy = Number(roundedrect.attr('y'));
        Observable.fromEvent(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({ clientX, clientY }) => ({
            roundedrect, ox, oy,
            x: clientX - svgBounds.left,
            y: clientY - svgBounds.top
        }))
            .subscribe(({ roundedrect, ox, oy, x, y }) => {
            roundedrect.attr('x', Math.min(x, ox))
                .attr('y', Math.min(y, oy))
                .attr('width', Math.abs(ox - x))
                .attr('height', Math.abs(oy - y));
        });
        addBehaviourDrag(roundedrect, svg);
        addBehaviourShowUI(roundedrect, svg, shapes);
    });
}
function drawSquareObservable(shapes) {
    const svg = document.getElementById("diagrameditor");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({ event: e, svgBounds: svg.getBoundingClientRect() }))
        .map(({ event, svgBounds }) => ({
        square: new Elem(svg, 'rect')
            .attr('x', event.clientX - svgBounds.left)
            .attr('y', event.clientY - svgBounds.top)
            .attr('width', 5)
            .attr('height', 5)
            .attr('fill', '#95B3D7'),
        svgBounds: svgBounds
    }))
        .subscribe(({ square, svgBounds }) => {
        shapes.push(square);
        const ox = Number(square.attr('x')), oy = Number(square.attr('y'));
        Observable.fromEvent(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({ clientX, clientY }) => ({
            square, ox, oy,
            x: clientX - svgBounds.left,
            y: clientY - svgBounds.top
        }))
            .subscribe(({ square, ox, oy, x, y }) => {
            square.attr('x', Math.min(x, ox))
                .attr('y', Math.min(y, oy))
                .attr('width', Math.abs(ox - x))
                .attr('height', Number(square.attr('width')));
        });
        addBehaviourDrag(square, svg);
        addBehaviourShowUI(square, svg, shapes);
    });
}
function drawRectObservable(shapes) {
    const svg = document.getElementById("diagrameditor");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({ event: e, svgBounds: svg.getBoundingClientRect() }))
        .map(({ event, svgBounds }) => ({
        rect: new Elem(svg, 'rect')
            .attr('x', event.clientX - svgBounds.left)
            .attr('y', event.clientY - svgBounds.top)
            .attr('width', 5)
            .attr('height', 5)
            .attr('fill', '#95B3D7'),
        svgBounds: svgBounds
    }))
        .subscribe(({ rect, svgBounds }) => {
        shapes.push(rect);
        const ox = Number(rect.attr('x')), oy = Number(rect.attr('y'));
        Observable.fromEvent(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({ clientX, clientY }) => ({
            rect, ox, oy,
            x: clientX - svgBounds.left,
            y: clientY - svgBounds.top
        }))
            .subscribe(({ rect, ox, oy, x, y }) => {
            rect.attr('x', Math.min(x, ox))
                .attr('y', Math.min(y, oy))
                .attr('width', Math.abs(ox - x))
                .attr('height', Math.abs(oy - y));
        });
        addBehaviourDrag(rect, svg);
        addBehaviourShowUI(rect, svg, shapes);
    });
}
function drawCircleObservable(shapes) {
    const svg = document.getElementById("diagrameditor");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(e => ({ event: e, svgBounds: svg.getBoundingClientRect() }))
        .map(({ event, svgBounds }) => ({
        circle: new Elem(svg, 'circle')
            .attr('cx', event.clientX - svgBounds.left)
            .attr('cy', event.clientY - svgBounds.top)
            .attr('r', 5)
            .attr('fill', '#95B3D7'),
        svgBounds: svgBounds
    }))
        .subscribe(({ circle, svgBounds }) => {
        shapes.push(circle);
        const ox = Number(circle.attr('cx')), oy = Number(circle.attr('cy'));
        Observable.fromEvent(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({ clientX, clientY }) => ({
            circle, ox, oy,
            x: clientX - svgBounds.left,
            y: clientY - svgBounds.top
        }))
            .subscribe(({ circle, ox, oy, x, y }) => {
            circle.attr('cx', Math.min(x, ox))
                .attr('cy', Math.min(y, oy))
                .attr('r', Math.abs(ox - x) / 2);
        });
        addBehaviourDrag(circle, svg);
        addBehaviourShowUI(circle, svg, shapes);
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        loadPalette();
    };
//# sourceMappingURL=diagrameditor.js.map
function mousePosEvents() {
    const pos = document.getElementById("pos");
    document.addEventListener("mousemove", e => {
        const p = e.clientX + ', ' + e.clientY;
        pos.innerHTML = p;
        if (e.clientX > 400) {
            pos.classList.add('highlight');
        }
        else {
            pos.classList.remove('highlight');
        }
    });
}
function mousePosObservable() {
    const pos = document.getElementById("pos"), o = Observable
        .fromEvent(document, "mousemove")
        .map(({ clientX, clientY }) => ({ x: clientX, y: clientY }));
    o.map(({ x, y }) => `${x},${y}`)
        .subscribe(s => pos.innerHTML = s);
    o.filter(({ x }) => x > 400)
        .subscribe(_ => pos.classList.add('highlight'));
    o.filter(({ x }) => x <= 400)
        .subscribe(_ => pos.classList.remove('highlight'));
    console.log("Work");
}
function animatedRectTimer() {
    const svg = document.getElementById("animatedRect"), { left, top } = svg.getBoundingClientRect();
    let rect = new Elem(svg, 'rect')
        .attr('x', 100).attr('y', 70)
        .attr('width', 120).attr('height', 80)
        .attr('fill', '#95B3D7');
    const animate = setInterval(() => rect.attr('x', 1 + Number(rect.attr('x'))), 10);
    const timer = setInterval(() => {
        clearInterval(animate);
        clearInterval(timer);
    }, 1000);
}
function animatedRect() {
    const svg = document.getElementById("animatedRect"), { left, top } = svg.getBoundingClientRect();
    let rect = new Elem(svg, 'rect')
        .attr('x', 100).attr('y', 70)
        .attr('width', 120).attr('height', 80)
        .attr('fill', '#95B3D7');
    Observable.interval(10)
        .takeUntil(Observable.interval(1000))
        .subscribe(() => rect.attr('x', 1 + Number(rect.attr('x'))));
}
function dragRectEvents() {
    const svg = document.getElementById("dragRect"), { left, top } = svg.getBoundingClientRect();
    const rect = new Elem(svg, 'rect')
        .attr('x', 100).attr('y', 70)
        .attr('width', 120).attr('height', 80)
        .attr('fill', '#95B3D7');
    rect.elem.addEventListener('mousedown', (e) => {
        const xOffset = Number(rect.attr('x')) - e.clientX, yOffset = Number(rect.attr('y')) - e.clientY, moveListener = (e) => {
            rect
                .attr('x', e.clientX + xOffset)
                .attr('y', e.clientY + yOffset);
        }, done = () => {
            svg.removeEventListener('mousemove', moveListener);
        };
        svg.addEventListener('mousemove', moveListener);
        svg.addEventListener('mouseup', done);
        svg.addEventListener('mouseout', done);
    });
}
function dragRectObservable() {
    const svg = document.getElementById("dragRect"), { left, top } = svg.getBoundingClientRect(), mousemove = Observable.fromEvent(svg, 'mousemove'), mouseup = Observable.fromEvent(svg, 'mouseup');
    const rect = new Elem(svg, 'rect')
        .attr('x', 100).attr('y', 70)
        .attr('width', 120).attr('height', 80)
        .attr('fill', '#95B3D7');
    rect.observe('mousedown')
        .map(({ clientX, clientY }) => ({
        xOffset: Number(rect.attr('x')) - clientX,
        yOffset: Number(rect.attr('y')) - clientY
    }))
        .flatMap(({ xOffset, yOffset }) => mousemove
        .takeUntil(mouseup)
        .map(({ clientX, clientY }) => ({
        x: clientX + xOffset,
        y: clientY + yOffset
    })))
        .subscribe(({ x, y }) => rect.attr('x', x)
        .attr('y', y));
}
function drawRectsEvents() {
    const svg = document.getElementById("drawRects");
    svg.addEventListener('mousedown', e => {
        const svgRect = svg.getBoundingClientRect(), x0 = e.clientX - svgRect.left, y0 = e.clientY - svgRect.top, rect = new Elem(svg, 'rect')
            .attr('x', String(x0))
            .attr('y', String(y0))
            .attr('width', '5')
            .attr('height', '5')
            .attr('fill', '#95B3D7');
        function moveListener(e) {
            const x1 = e.clientX - svgRect.left, y1 = e.clientY - svgRect.top, left = Math.min(x0, x1), top = Math.min(y0, y1), width = Math.abs(x0 - x1), height = Math.abs(y0 - y1);
            rect.attr('x', String(left))
                .attr('y', String(top))
                .attr('width', String(width))
                .attr('height', String(height));
        }
        function upListener() {
            svg.removeEventListener('mousemove', moveListener);
            svg.removeEventListener('mouseup', upListener);
        }
        svg.addEventListener('mouseup', upListener);
        svg.addEventListener('mousemove', moveListener);
    });
}
function drawRectsObservable() {
    const svg = document.getElementById("drawRects");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
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
        const ox = Number(rect.attr('x')), oy = Number(rect.attr('y'));
        Observable.fromEvent(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({ clientX, clientY }) => ({
            rect, ox, oy,
            x: clientX - svgBounds.left,
            y: clientY - svgBounds.top
        }))
            .subscribe(({ rect, ox, oy, x, y }) => rect.attr('x', Math.min(x, ox))
            .attr('y', Math.min(y, oy))
            .attr('width', Math.abs(ox - x))
            .attr('height', Math.abs(oy - y)));
    });
}
function drawAndDragRectsObservable() {
    const svg = document.getElementById("drawAndDragRects");
    const mousedrag = Observable.fromEvent(svg, 'mousedown')
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
            let rect_obs = rect.observe('mousedown');
            rect_obs.subscribe(e => e.stopPropagation());
            rect_obs.map((e) => ({
                xOffset: Number(rect.attr('x')) - e.clientX,
                yOffset: Number(rect.attr('y')) - e.clientY
            }))
                .flatMap(({ xOffset, yOffset }) => Observable.fromEvent(svg, 'mousemove')
                .takeUntil(Observable.fromEvent(svg, 'mouseup'))
                .map(({ clientX, clientY }) => ({
                x: clientX + xOffset,
                y: clientY + yOffset
            })))
                .subscribe(({ x, y }) => rect.attr('x', x).attr('y', y));
        });
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        mousePosObservable();
        animatedRect();
        dragRectObservable();
        drawRectsObservable();
        drawAndDragRectsObservable();
    };
//# sourceMappingURL=basicexamples.js.map
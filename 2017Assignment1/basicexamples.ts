// an example of traditional event driven programming style - this is what we are 
// replacing with observable
// the following adds a listener for the mouse event
// handler sets p and adds or removes highlight depending on x position
function mousePosEvents() {
  const pos = document.getElementById("pos");

  document.addEventListener("mousemove", e => {
    const p = e.clientX + ', ' + e.clientY;
    pos.innerHTML = p;
    if (e.clientX > 400) {
      pos.classList.add('highlight');
    } else {
      pos.classList.remove('highlight');
    }
  });
}

// constructs a stream with three branches:
// Observable<x,y>
//  |- set <p>
//  |- add highlight
//  |- remove highlight
function mousePosObservable() {
  const 
    pos = document.getElementById("pos"),
    o = Observable
          .fromEvent<MouseEvent>(document, "mousemove")
          .map(({clientX, clientY})=>({x: clientX, y: clientY}));

  
  o.map(({x,y}) => `${x},${y}`)
    .subscribe(s => pos.innerHTML = s);

  
  o.filter(({x}) => x > 400)
    .subscribe(_ => pos.classList.add('highlight'));

  o.filter(({x}) => x <= 400)
    .subscribe(_ => pos.classList.remove('highlight'));

  console.log("Work")
}
  
// animates an SVG rectangle, passing a continuation to the built-in HTML5 setInterval function.
// a rectangle smoothly moves to the right for 1 second.
function animatedRectTimer() {
  const svg = document.getElementById("animatedRect"),
    {left, top} = svg.getBoundingClientRect();
  let rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');
  const animate = setInterval(()=>rect.attr('x', 1+Number(rect.attr('x'))), 10);
  const timer = setInterval(()=>{
    clearInterval(animate);
    clearInterval(timer);
  }, 1000);
}

// demonstrates the interval method on Observable
// the observable stream fires every 10 milliseconds
// it terminates after 1 second
function animatedRect() {
  const svg = document.getElementById("animatedRect"),
    {left, top} = svg.getBoundingClientRect();
  let rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');

  Observable.interval(10)
    .takeUntil(Observable.interval(1000))
    .subscribe(()=>rect.attr('x', 1+Number(rect.attr('x'))));
}

// an example of traditional event driven programming style - this is what we are 
// replacing with observable
// creates an SVG rectangle that can be dragged with the mouse
function dragRectEvents() {
  const svg = document.getElementById("dragRect"),
    {left, top} = svg.getBoundingClientRect();
    
  const rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');

  rect.elem.addEventListener('mousedown', (e:MouseEvent)=>{
    const 
      xOffset = Number(rect.attr('x')) - e.clientX,
      yOffset = Number(rect.attr('y')) - e.clientY,
      moveListener = (e:MouseEvent)=>{
        rect
          .attr('x',e.clientX + xOffset)
          .attr('y',e.clientY + yOffset);
      },
      done = ()=>{
        svg.removeEventListener('mousemove', moveListener);
      };
    svg.addEventListener('mousemove', moveListener);
    svg.addEventListener('mouseup', done);
    svg.addEventListener('mouseout', done);
  })
}

// Observable version of dragRectEvents:
// Constructs an observable stream for the rectangle that
// on mousedown creates a new stream to handle drags until mouseup
//   O<MouseDown>
//     | map x/y offsets
//   O<x,y>
//     | flatMap
//     +---------------------+------------...
//   O<MouseMove>          O<MouseMove>
//     | takeUntil mouseup   |
//   O<MouseMove>          O<MouseMove>
//     | map x/y + offsets   |
//     +---------------------+------------...
//   O<x,y>
//     | move the rect
//    --- 
function dragRectObservable() {
  const svg = document.getElementById("dragRect"),
    {left, top} = svg.getBoundingClientRect(),
    mousemove = Observable.fromEvent<MouseEvent>(svg, 'mousemove'),
    mouseup = Observable.fromEvent<MouseEvent>(svg, 'mouseup');
  const rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 70)
    .attr('width', 120).attr('height', 80)
    .attr('fill', '#95B3D7');

  rect.observe<MouseEvent>('mousedown')
    .map(({clientX, clientY}) => ({
      xOffset: Number(rect.attr('x')) - clientX,
      yOffset: Number(rect.attr('y')) - clientY
    }))
    .flatMap(({xOffset, yOffset}) =>
      mousemove
        .takeUntil(mouseup)
        .map(({clientX, clientY}) => ({
          x: clientX + xOffset,
          y: clientY + yOffset
        })))
    .subscribe(({x, y}) =>
      rect.attr('x', x)
        .attr('y', y));
}

// an example of traditional event driven programming style - this is what we are 
// replacing with observable
// allows the user to draw SVG rectangles by dragging with the mouse
function drawRectsEvents() {
  const svg = document.getElementById("drawRects");

  svg.addEventListener('mousedown', e => {
    const 
      svgRect = svg.getBoundingClientRect(),
      x0 = e.clientX - svgRect.left,
      y0 = e.clientY - svgRect.top,
      rect = new Elem(svg, 'rect')
        .attr('x', String(x0))
        .attr('y', String(y0))
        .attr('width', '5')
        .attr('height', '5')
        .attr('fill', '#95B3D7');

    function moveListener(e: any) {
      const x1 = e.clientX - svgRect.left,
        y1 = e.clientY - svgRect.top,
        left = Math.min(x0, x1),
        top = Math.min(y0, y1),
        width = Math.abs(x0 - x1),
        height = Math.abs(y0 - y1);
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

// Observable version of the above
function drawRectsObservable() {
  const svg = document.getElementById("drawRects");
  const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
    .map(e=>({event:e, svgBounds: svg.getBoundingClientRect()}))
    .map(({event, svgBounds})=> ({
      rect: new Elem(svg, 'rect')
        .attr('x', event.clientX - svgBounds.left)
        .attr('y', event.clientY - svgBounds.top)
        .attr('width', 5)
        .attr('height', 5)
        .attr('fill', '#95B3D7'),
      svgBounds: svgBounds}))
    .subscribe(({rect,svgBounds})=>{
      const ox = Number(rect.attr('x')), oy = Number(rect.attr('y'));
      Observable.fromEvent<MouseEvent>(svg, 'mousemove')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(({clientX, clientY})=>({
          rect, ox, oy,
          x: clientX - svgBounds.left, 
          y: clientY - svgBounds.top}))
        .subscribe(({rect, ox, oy, x, y})=>
          rect.attr('x', Math.min(x,ox))
              .attr('y', Math.min(y,oy))
              .attr('width', Math.abs(ox - x))
              .attr('height', Math.abs(oy - y))
        );
    });

  
}

// dragging on an empty spot on the canvas should draw a new rectangle
// dragging on an existing rectangle should drag its position
function drawAndDragRectsObservable() {
  const svg = document.getElementById("drawAndDragRects");
  const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
    .map(e=>({event:e, svgBounds: svg.getBoundingClientRect()}))
    .map(({event, svgBounds})=> ({
      rect: new Elem(svg, 'rect')
        .attr('x', event.clientX - svgBounds.left)
        .attr('y', event.clientY - svgBounds.top)
        .attr('width', 5)
        .attr('height', 5)
        .attr('fill', '#95B3D7'),
      svgBounds: svgBounds}))
    
    .subscribe(({rect,svgBounds})=>{
      const ox = Number(rect.attr('x')), oy = Number(rect.attr('y'));
      Observable.fromEvent<MouseEvent>(svg, 'mousemove')
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        .map(({clientX, clientY})=>({
          rect, ox, oy,
          x: clientX - svgBounds.left, 
          y: clientY - svgBounds.top}))
        .subscribe(({rect, ox, oy, x, y})=>{
          rect.attr('x', Math.min(x,ox))
          .attr('y', Math.min(y,oy))
          .attr('width', Math.abs(ox - x))
          .attr('height', Math.abs(oy - y))
          let rect_obs = rect.observe<MouseEvent>('mousedown')
          rect_obs.subscribe(e => e.stopPropagation())
          rect_obs.map((e) => ({
            
            xOffset: Number(rect.attr('x')) - e.clientX,
            yOffset: Number(rect.attr('y')) - e.clientY
          }))
          .flatMap( ({xOffset, yOffset}) =>
            Observable.fromEvent<MouseEvent>(svg, 'mousemove')
            .takeUntil(Observable.fromEvent(svg, 'mouseup'))
            .map(({clientX, clientY}) => ({
              x: clientX + xOffset,
              y: clientY + yOffset
            })))
            .subscribe( ({x,y}) => rect.attr('x', x).attr('y', y))        
        }
          
          
        );
    })

  
    

}

if (typeof window != 'undefined')
  window.onload = ()=>{
    // old fashioned continuation spaghetti implementations:
    //mousePosEvents();
    //animatedRectTimer();
    //drawRectsEvents();
    //dragRectEvents();

    // when your observable is working replace the above four functions with the following:
    mousePosObservable();
    animatedRect()
    dragRectObservable();
    drawRectsObservable();

    // you'll need to implement the following function yourself:
     drawAndDragRectsObservable();
  }
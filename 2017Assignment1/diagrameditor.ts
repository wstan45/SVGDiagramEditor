
function loadPalette(){
    //get the svg palette element - see diagrameditor.html
    const svg = document.getElementById("palette")

    //define an array of Elem Objects
    var shapes :Elem[] = [];

    //create shapes on the palette 
    const rect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 50)
    .attr('width', 120).attr('height', 50)
    .attr('fill', '#95B3D7');

    const circle = new Elem(svg, 'circle')
    .attr('cx', 160).attr('cy', 180)
    .attr('r', 50).attr('fill', '#95B3D7');

    const ellipse = new Elem(svg, 'ellipse')
    .attr('cx', 160). attr('cy', 290)
    .attr('rx', 40).attr('ry', 30 )
    .attr('fill', '#95B3D7');

    const roundedrect = new Elem(svg, 'rect')
    .attr('x', 100).attr('y', 350)
    .attr('width', 120).attr('height', 50)
    .attr('rx', 20).attr('ry', 20)
    .attr('fill', '#95B3D7');

    const square = new Elem(svg, 'rect')
    .attr('x', 135).attr('y',430)
    .attr('width', 50).attr('height', 50)
    .attr('fill', '#95B3D7');

    //when the shapes are 'mousedown' on, call the individual draw shapes methods
    rect.observe<MouseEvent>('mousedown')    
    .subscribe(() => drawRectObservable(shapes))

    circle.observe<MouseEvent>('mousedown')
    .subscribe(() => drawCircleObservable(shapes))

    ellipse.observe<MouseEvent>('mousedown')
    .subscribe(() => drawEllipseObservable(shapes))

    roundedrect.observe<MouseEvent>('mousedown')
    .subscribe(() => drawRoundedRectObservable(shapes))

    square.observe<MouseEvent>('mousedown')
    .subscribe(() => drawSquareObservable(shapes)) 

}

function addBehaviourShowUI(shape: Elem, svg: HTMLElement, shapes: Elem[]){
  
  //these variables are defined to store the string attributes of the different shapes
  //this is done to allow dynamically adding the show floating text element 'link' on different shapes
  var shape_x : string
  var shape_y : string
  var shape_width: string
  var shape_height: string

  //if the shape is a circle, the x,y attributes of circle are cx,cy
  //the 'height' and 'width' of the circle is r
  if (shape.get_tag() == 'circle'){
    shape_x = 'cx'
    shape_y = 'cy'
    shape_height = 'r'
    shape_width = 'r'
  }
  //if the shape is a rect, the x,y attributes of rect are x,y
  //the height and width of the rect is height and width
  else if(shape.get_tag() == 'rect'){
    shape_x = 'x'
    shape_y = 'y'
    shape_height = 'height'
    shape_width = 'width'
  }
  //if the shape is an ellipse, the x,y attributes of ellipse are cx, cy
  //the 'height' and 'width' of the ellipse is ry,rx
  else if (shape.get_tag() == 'ellipse'){
    shape_x ='cx'
    shape_y = 'cy'
    shape_height = 'ry'
    shape_width = 'rx'
  }
  //create a text element whose position x = shape's x_attribute and
  // position y = shape's y_attribute
  const text = new Elem(svg, 'text')
  .attr('x', Number(shape.attr(shape_x)))
  .attr('y', Number(shape.attr(shape_y)))
  .attr('fill', '#CD5C5C')
  .attr('font-weight', 700)
  //the text element has the word link
  text.elem.textContent = 'link';

  //set up an observable to fire events when there is mousemove on the shape
  const mousemove = shape.observe<MouseEvent>('mousemove')
  //subscribe to this observable to change the position of the text element to follow the shapes position
  mousemove.subscribe(() => {
    
    text.attr('x', Number(shape.attr(shape_x)) )
    .attr('y', Number(shape.attr(shape_y)))
    
    
  })
  //change the cursor to pointer when hovering over the text element 'link'
  text.observe<MouseEvent>('mouseenter').subscribe(()=> svg.style.cursor = "pointer")
  text.observe<MouseEvent>('mouseleave').subscribe(()=> svg.style.cursor = "default")
  
  //set up an observable that fires when the text element is clicked
  text.observe('click')
  //subscribe to this observable to generate a line between 2 shapes 
  .subscribe(() => {    
    //set up an observable that fires when anywhere in the svg is double clicked
    Observable.fromEvent<MouseEvent>(svg, "dblclick")
    //close this stream when the text element of this shape is double clicked
    //this is needed so that the user can can connect different shapes with different shapes
    //and not force it such that all shapes are connected to one shape
    .takeUntil(Observable.fromEvent<MouseEvent>(text.elem, "dblclick"))

    //subscribes to this observable to find the shape that was double clicked on using 'e.target'
    .subscribe(e => {
      //defines the x,y attributes of the target shape.
      //this is needed as different shapes have different x,y attributes
      //(eg. circle has cx,cy while rect has x,y)
      var target_x: string
      var target_y: string
      var target_elem: Elem
      let mu_target = e.target
      //loops through the array of Elem objects (shapes) 
      for(var i = 0, size = shapes.length; i < size ; i++){
        var item = shapes[i];
        //if the target element is equal to one of the array items, we have found the targeted shape
        if(item.elem == mu_target){
            target_elem = item;
            break;
        } 
     }
      //checks if the targeted element is a shape and not the svg diagrameditor element
      //this is needed in case that the user double clicks on the svg diagrameditor element background]
      //instead of click on actual shape elements
      if (target_elem != undefined){
        //creates a new line that is connected from this shape to the target shape
        let line = new Elem(svg, 'line')
        .attr('x1', Number(shape.attr(shape_x)))
        .attr('y1', Number(shape.attr(shape_y)))
        //x2,y2 is set to the location of the mouse because the mouse will be hovering over the target shape
        .attr('x2', e.clientX)
        .attr('y2', e.clientY)
        .attr('stroke', '#FF00FF')
        .attr('stroke-width', 2)
        //calls the moveLine function which will make the line stay connected to both shapes even if the
        //shapes are being dragged around
        moveLine(line, shape, target_elem)
      }
      
      

    })
  })
  
 
}

function moveLine(line:Elem, shape1:Elem, shape2:Elem){
  
 //get the svg diagram editor element - see diagrameditor.HTML
  const svg = document.getElementById('diagrameditor')

  //Observable that fires when shape1 is mousedown on
  let shape1_obs = shape1.observe<MouseEvent>('mousedown')
  
  //when shape1 is being dragged (see comments in addBehaviourDrag),
  //map the event to an Observable that fires x1,y1 where x1,y1 = position of the mouse
  shape1_obs.flatMap( e =>
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
    .takeUntil(Observable.fromEvent(svg, 'mouseup'))
    .map( e => ({
      x1: e.clientX,
      y1: e.clientY
    }))
  )

  //subscribe the values emitted from the mapped observable to change the x1,y1 attributes
  //of the line. This will make the line stay connected to the shape being dragged
  .subscribe( ({x1,y1}) => {
    line.attr('x1', x1).attr('y1', y1)
  } )

  //Observable that fires when shape2 is mousedown on
  let shape2_obs = shape2.observe<MouseEvent>('mousedown')
  
  //when shape2 is being dragged (see comments in addBehaviourDrag),
  //map the event to an Observable that fires x2,y2 where x2,y2 = position of the mouse
  shape2_obs.flatMap( e =>
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
    .takeUntil(Observable.fromEvent(svg, 'mouseup'))
    .map( e => ({
      x2: e.clientX,
      y2: e.clientY
    }))
  )
  //subscribe the values emitted from the mapped observable to change the x2,y2 attributes
  //of the line. This will make the line stay connected to the shape being dragged
  .subscribe( ({x2,y2}) => {
    line.attr('x2',x2).attr('y2', y2)
  } )
}
function addBehaviourDrag(shape: Elem, svg: HTMLElement){
  //these variables are defined to store the string attributes of the different shapes
  //this is done to allow dynamically adding the dragging behaviour of different shapes
  var x_attribute : string
  var y_attribute : string
  var width
  var height
  //if the shape is circle, the (x,y) attributes of circle are cx,cy
  if (shape.get_tag() == 'circle'){
    x_attribute = 'cx'
    y_attribute = 'cy'
  }

  //if the shape is rect, the x,y attributes of rect are x,y
  else if(shape.get_tag() == 'rect'){
    x_attribute = 'x'
    y_attribute = 'y'
  }
  //if the shape is ellpise, the x,y attributes of ellipse are cx,cy
  else if (shape.get_tag() == 'ellipse'){
    x_attribute ='cx'
    y_attribute = 'cy'
  }
  //added these to change cursor when hovering over svg shapes
  shape.observe<MouseEvent>('mouseenter').subscribe(() => svg.style.cursor = "move")
  shape.observe<MouseEvent>('mouseleave').subscribe(() => svg.style.cursor = "default")
  
  
  let shape_obs = shape.observe<MouseEvent>('mousedown')
  //commented out this line that existed in the basicexamples.ts code
  //this line is not needed as the way my diagram editor works, you can only draw 1 shape at a time.
  //if you want to draw multiple same shapes, you still have to click the same shape again.
  //this line is also commented out in order to help connect lines between shapes later

  //shape_obs.subscribe(e => e.stopPropagation())

  //maps the mouseevent to produce an Observable that emits x and y offsets
  shape_obs.map((e) => ({
    
    xOffset: Number(shape.attr(x_attribute)) - e.clientX,
    yOffset: Number(shape.attr(y_attribute)) - e.clientY
  }))
  //for every emitted x,y offset, produce a new Observable that emits events when the mousemove event occurs on svg
  .flatMap( ({xOffset, yOffset}) =>
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
    .takeUntil(Observable.fromEvent(svg, 'mouseup'))   
    //maps the x,y coordinates of the mouse to produce an observable with x,y coordinates
    //this will move the shape to where the mouse is at.
    .map(({clientX, clientY}) => ({
      x: clientX + xOffset,
      y: clientY + yOffset
    })))
    //subscribes to the mapped observable such that it will change the x,y attributes of the shape
    //this will move the shape 
    .subscribe( ({x,y}) => shape.attr(x_attribute, x).attr(y_attribute, y))
     
}
function drawEllipseObservable(shapes : Elem[]){
 //get the svg diagram editor element - see diagrameditor.HTML
  const svg = document.getElementById("diagrameditor")
  //mousedrag is an Observable that detects mousedown on the diagrameditor svg element
  const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
  //closes the stream when the mouseup event is detected on the diagram editor svg element
    //This is used to prevent multiple shapes being drawn at the same time
  .takeUntil(Observable.fromEvent<MouseEvent>(svg, 'mouseup'))
  //maps the value (event) emitted by the mousedrag observable to create a new Observable that
    //emits ellipse on its stream
  .map(e => ({event:e, svgBounds: svg.getBoundingClientRect()}))
  .map(({event, svgBounds}) => ({
      ellipse: new Elem(svg, 'ellipse')
      .attr('cx', event.clientX - svgBounds.left)
      .attr('cy', event.clientY - svgBounds.top)
      .attr('rx', 10).attr('ry', 5)
      .attr('fill', '#95B3D7'),
    svgBounds: svgBounds}))
    //subscribe to the new observable that emits ({ellipse svgBounds})
  .subscribe(({ellipse,svgBounds})=>{
    //pushes the created ellipse onto the array of Elem objects
      //this is needed to allow the connection between shapes later
    shapes.push(ellipse)
    const ox = Number(ellipse.attr('cx')), oy = Number(ellipse.attr('cy'));
    //Uses an observable to detect mousemove events while the mousedown event is occuring
      //this is needed to detect dragging
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
    //closes the stream when the mouseup event is detected
      .takeUntil(Observable.fromEvent(svg, 'mouseup'))
      //takes the position of the mouse and creates a new observable that emits the 
      //necessary data
      .map(({clientX, clientY})=>({
        ellipse, ox, oy,
        x: clientX - svgBounds.left, 
        y: clientY - svgBounds.top}))
        //subscribes to the mapped observable to change the x,y attributes of the ellipse
          //this will change the size of the ellipse
      .subscribe(({ellipse, ox, oy, x, y})=>{
        ellipse.attr('cx', Math.min(x,ox))
        .attr('cy', Math.min(y,oy))
        .attr('rx', Math.abs(ox - x)/2)
        .attr('ry', Math.abs(oy - y)/2)
        
        
        
        
      }
      
            
      );
      //makes the ellipse draggable
      addBehaviourDrag( ellipse, svg)
      //makes the text element 'link' show up on the ellipse
      addBehaviourShowUI(ellipse, svg, shapes);
    })
    
  
}
function drawRoundedRectObservable(shapes : Elem[]){
  //get the svg diagram editor element - see diagrameditor.HTML
  const svg = document.getElementById("diagrameditor")
  //mousedrag is an Observable that detects mousedown on the diagrameditor svg element
  const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
  //closes the stream when the mouseup event is detected on the diagram editor svg element
    //This is used to prevent multiple shapes being drawn at the same time
  .takeUntil(Observable.fromEvent<MouseEvent>(svg, 'mouseup'))
  //maps the value (event) emitted by the mousedrag observable to create a new Observable that
    //emits roundedrect on its stream
  .map(e => ({event:e, svgBounds: svg.getBoundingClientRect()}))
  .map(({event, svgBounds}) => ({
      roundedrect: new Elem(svg, 'rect')
      .attr('x', event.clientX - svgBounds.left)
      .attr('y', event.clientY - svgBounds.top)
      .attr('width', 5)
      .attr('height', 5)
      .attr('rx', 20)
      .attr('ry', 20)
      .attr('fill', '#95B3D7'),
    svgBounds: svgBounds}))
    //subscribe to the new observable that emits ({roundedrect svgBounds})
  .subscribe(({roundedrect,svgBounds})=>{
    //pushes the created roundedrect onto the array of Elem objects
      //this is needed to allow the connection between shapes later
    shapes.push(roundedrect)
    const ox = Number(roundedrect.attr('x')), oy = Number(roundedrect.attr('y'));
    //Uses an observable to detect mousemove events while the mousedown event is occuring
      //this is needed to detect dragging
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
    //closes the stream when the mouseup event is detected
      .takeUntil(Observable.fromEvent(svg, 'mouseup'))
      //takes the position of the mouse and creates a new observable that emits the 
      //necessary data
      .map(({clientX, clientY})=>({
        roundedrect, ox, oy,
        x: clientX - svgBounds.left, 
        y: clientY - svgBounds.top}))
        //subscribes to the mapped observable to change the x,y attributes of the roundedrect
          //this will change the size of the roundedrect
      .subscribe(({roundedrect, ox, oy, x, y})=>{
        roundedrect.attr('x', Math.min(x,ox))
        .attr('y', Math.min(y,oy))
        .attr('width', Math.abs(ox - x))
        .attr('height', Math.abs(oy - y))
        
        
      }
        
      );
      //makes the roundedrect draggable
      addBehaviourDrag(roundedrect, svg)
      //makes the text element 'link' show up on the roundedrect
      addBehaviourShowUI(roundedrect, svg, shapes);
  })
  
}
function drawSquareObservable(shapes : Elem[]){
  //get the svg diagram editor element - see diagrameditor.HTML
  const svg = document.getElementById("diagrameditor")
  //mousedrag is an Observable that detects mousedown on the diagrameditor svg element
  const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
  //closes the stream when the mouseup event is detected on the diagram editor svg element
    //This is used to prevent multiple shapes being drawn at the same time
  .takeUntil(Observable.fromEvent<MouseEvent>(svg, 'mouseup'))
  //maps the value (event) emitted by the mousedrag observable to create a new Observable that
    //emits square on its stream
  .map(e => ({event:e, svgBounds: svg.getBoundingClientRect()}))
  .map(({event, svgBounds}) => ({
      square: new Elem(svg, 'rect')
      .attr('x', event.clientX - svgBounds.left)
      .attr('y', event.clientY - svgBounds.top)
      .attr('width', 5)
      .attr('height', 5)
      .attr('fill', '#95B3D7'),
    svgBounds: svgBounds}))
    //subscribe to the new observable that emits ({square svgBounds})
  .subscribe(({square,svgBounds})=>{
    //pushes the created square onto the array of Elem objects
      //this is needed to allow the connection between shapes later
    shapes.push(square)
    const ox = Number(square.attr('x')), oy = Number(square.attr('y'));
    //Uses an observable to detect mousemove events while the mousedown event is occuring
      //this is needed to detect dragging
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
    //closes the stream when the mouseup event is detected
      .takeUntil(Observable.fromEvent(svg, 'mouseup'))
      //takes the position of the mouse and creates a new observable that emits the 
      //necessary data
      .map(({clientX, clientY})=>({
        square, ox, oy,
        x: clientX - svgBounds.left, 
        y: clientY - svgBounds.top}))
        //subscribes to the mapped observable to change the x,y attributes of the square
          //this will change the size of the square
      .subscribe(({square, ox, oy, x, y})=>{
        square.attr('x', Math.min(x,ox))
        .attr('y', Math.min(y,oy))
        .attr('width', Math.abs(ox - x))
        .attr('height', Number(square.attr('width')))
        
      }
        
      );
      //makes the square draggable
      addBehaviourDrag(square, svg)
      //makes the text element 'link' show up on the square
      addBehaviourShowUI(square, svg, shapes);
  });
}
function drawRectObservable(shapes : Elem[]){
    //get the svg diagram editor element - see diagrameditor.HTML
    const svg = document.getElementById("diagrameditor")
    //mousedrag is an Observable that detects mousedown on the diagrameditor svg element
    const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
    //closes the stream when the mouseup event is detected on the diagram editor svg element
    //This is used to prevent multiple shapes being drawn at the same time
    .takeUntil(Observable.fromEvent<MouseEvent>(svg, 'mouseup'))
    //maps the value (event) emitted by the mousedrag observable to create a new Observable that
    //emits rect on its stream
    .map(e => ({event:e, svgBounds: svg.getBoundingClientRect()}))    
    .map(({event, svgBounds}) => ({
        rect: new Elem(svg, 'rect')
        .attr('x', event.clientX - svgBounds.left)
        .attr('y', event.clientY - svgBounds.top)
        .attr('width', 5)
        .attr('height', 5)
        .attr('fill', '#95B3D7'),
      svgBounds: svgBounds}))
    //subscribe to the new observable that emits ({rect svgBounds})
    .subscribe(({rect,svgBounds})=>{
      //pushes the created rect onto the array of Elem objects
      //this is needed to allow the connection between shapes later
      shapes.push(rect)
      //stores the original x and original y of circle
      const ox = Number(rect.attr('x')), oy = Number(rect.attr('y'));
      //Uses an observable to detect mousemove events while the mousedown event is occuring
      //this is needed to detect dragging
      Observable.fromEvent<MouseEvent>(svg, 'mousemove')
       //closes the stream when the mouseup event is detected
        .takeUntil(Observable.fromEvent(svg, 'mouseup'))
        //takes the position of the mouse and creates a new observable that emits the 
      //necessary data
        .map(({clientX, clientY})=>({
          rect, ox, oy,
          x: clientX - svgBounds.left, 
          y: clientY - svgBounds.top}))
          //subscribes to the mapped observable to change the x,y attributes of the rect
          //this will change the size of the rect
        .subscribe(({rect, ox, oy, x, y})=>{
          rect.attr('x', Math.min(x,ox))
          .attr('y', Math.min(y,oy))
          .attr('width', Math.abs(ox - x))
          .attr('height', Math.abs(oy - y))
          
        }
          
        );
        //makes the rect draggable
        addBehaviourDrag(rect, svg)
        //makes the text element 'link' show up on the rect
        addBehaviourShowUI(rect, svg, shapes);
    });
}
function drawCircleObservable(shapes : Elem[]){
  //get the svg diagram editor element - see diagrameditor.HTML
  const svg = document.getElementById("diagrameditor")

  //mousedrag is an Observable that detects mousedown on the diagrameditor svg element
  const mousedrag = Observable.fromEvent<MouseEvent>(svg, 'mousedown')
  //closes the stream when the mouseup event is detected on the diagram editor svg element
  //This is used to prevent multiple shapes being drawn at the same time
  .takeUntil(Observable.fromEvent<MouseEvent>(svg, 'mouseup'))
  //maps the value (event) emitted by the mousedrag observable to create a new Observable that
  //emits circles on its stream
  .map(e => ({event:e, svgBounds: svg.getBoundingClientRect()}))
  .map(({event, svgBounds}) => ({
      circle: new Elem(svg, 'circle')
      .attr('cx', event.clientX - svgBounds.left)
      .attr('cy', event.clientY - svgBounds.top)
      .attr('r', 5)      
      .attr('fill', '#95B3D7'),
    svgBounds: svgBounds}))
  //subscribe to the new observable that emits ({circles, svgBounds})
  .subscribe(({circle,svgBounds})=>{
    //pushes the created cirlce onto the array of Elem objects
    //this is needed to allow the connection between shapes later
    shapes.push(circle)
    //stores the original x and original y of circle
    const ox = Number(circle.attr('cx')), oy = Number(circle.attr('cy'));

    //Uses an observable to detect mousemove events while the mousedown event is occuring
    //this is needed to detect dragging
    Observable.fromEvent<MouseEvent>(svg, 'mousemove')
      //closes the stream when the mouseup event is detected
      .takeUntil(Observable.fromEvent(svg, 'mouseup'))
      //takes the position of the mouse and creates a new observable that emits the 
      //necessary data
      .map(({clientX, clientY})=>({
        circle, ox, oy,
        x: clientX - svgBounds.left, 
        y: clientY - svgBounds.top}))
      //subscribes to the mapped observable to change the x,y attributes of the circle
      //this will change the size of the circle
      .subscribe(({circle, ox, oy, x, y})=>{
        circle.attr('cx', Math.min(x,ox))
        .attr('cy', Math.min(y,oy))
        .attr('r', Math.abs(ox - x)/2)
        
      }     
            
      );
      //makes the circle draggable
      addBehaviourDrag( circle, svg)

      //makes the text element 'link' show up on the circle
      addBehaviourShowUI(circle, svg, shapes);
      
  })
  
  
}


if (typeof window != 'undefined')
    window.onload = ()=>{
      //load the palette
      loadPalette();      
    }
interface Observer<T> {
  next(e: T): void;
  complete(): void;
  unsub?: ()=>void;
}

/**
 * Exercise 6 - SafeObserver
 */

class SafeObserver<T> implements Observer<T> {
  // constructor enforces that we are always subscribed to destination
  private isUnsubscribed = false;
  private destination: Observer<T>;
  
  constructor(destination: Observer<T>) {
      this.destination = destination;
      if (destination.unsub) {
          this.unsub = destination.unsub;
      }
  }

  next(value: T) {
    //places value onto this.destination(the Observable)'s stream
    //as long as this observer is subscribed to the destination
    if (!this.isUnsubscribed){this.destination.next(value)}
              
    
          
  }

  complete() {
    // closes the Observable stream by unsubscribing this(Observer) from the destination (Observable)
    if (!this.isUnsubscribed){
        this.destination.complete();
        this.unsubscribe();
    }
  }

  unsubscribe(): void {
     // unsubscribes this(Observer) from the destination (Observable)
    if (!this.isUnsubscribed){
        this.isUnsubscribed = true;
        if (this.unsub) this.unsub();
    }
  }

  unsub?: ()=>void;
}

class Observable<T> {
  constructor(private _subscribe: (_:Observer<T>)=>()=>void) {}

  // subscribes an observer to this observable and returns the unsubscribe function
  subscribe(next:(_:T)=>void, complete?: ()=>void): ()=>void {
    const safeObserver = new SafeObserver(<Observer<T>>{
        next: next,
        complete: complete ? complete : ()=>console.log('complete')
      });
    safeObserver.unsub = this._subscribe(safeObserver);
    return safeObserver.unsubscribe.bind(safeObserver);
  }

  // create an Observable from an DOM Event
  static fromEvent<E extends Event>(el: Node, name: string): Observable<E> {
    //create a new observable
    return new Observable<E> ( (observer: Observer<E>) => {
        //for every DOM Event, we place that event on the new observable's stream
        const listener = (e: E) => observer.next(e)
        el.addEventListener(name, listener);
        
        return () => el.removeEventListener(name, listener)
    }) 
  }

  // create an Observable sequence from an Array
  static fromArray<V>(arr: V[]):Observable<V> {
      //create a new observable
      return new Observable<V>((observer: Observer<V>) => {
        //for each element in an array, we place that element on the
        //new observable stream
        arr.forEach(el => observer.next(el));
        return () => {};
      });
  }

  // The observable notifies after the specified interval
  static interval(milliseconds: number): Observable<number> {
      //returns a new observable that notifies after the specified interval
      return new Observable<number>((observer: Observer<number>) => {
        //time variable stores the total elapsed time
        let time = milliseconds;
        //uses setInterval to notify at every specified interval
        setInterval(() => {
            //places the current total elapsed time on the new observable's stream
            //as setInterval calls this function at every specified interval,
            //it will place the current total elapsed time on the new observable's stream at
            //every specified interval
            observer.next(time)
            
            //increment time by the elapsed time
            time += milliseconds;
            
        }, milliseconds)
        
        return () => {};
    });
  }

  // create a new observable that observes this observable and applies the project function on next
  map<R>(project: (_:T)=>R): Observable<R> {
      
      return new Observable<R>((observer: Observer<R>) => {
        //subscribes to this observable
        return this.subscribe(
            //for every value emitted by this observable, we apply the function project on that value
            //the new observable will then emit the values that this observable emits but with the project
            //function applied to it. 
            v => {                  
                observer.next(project(v))
            },
            () => observer.complete()
        )
        });
  }

  // creates a new observable that observes this observable and applies a function on each value emitted
  //by this observable
  forEach(f: (_:T)=>void): Observable<T> {
      
      return new Observable<T>((observer: Observer<T>) => {
        // subscribes to this observable
        return this.subscribe(
            //for every value emitted by this observable, we apply the function on that value.
            //As the function f returns void, we do not map the return value of f(v) to the new observable
            //In this case, unlike map, the new observable will still emit the same values that this
            //observable emits. This can be seen from the line 'observer.next(v)'. 
            v => {
                f(v);
                observer.next(v)
            },
            () => observer.complete()
        )
    });
  }

  // create a new observable that observes this observable but only conditionally notifies next
  filter(condition: (_:T)=>boolean): Observable<T> {
      
      return new Observable<T>((observer: Observer<T>) => {
        //subscribes to this observable
        return this.subscribe(
            //for every value emitted by this observable, we apply a function that returns true or false
            //to that value (condition). Only if the function returns true do we place that value
            // onto the new observable.
            v => {
                
                if (condition(v)) {
                    observer.next(v)
                }                
            },
            () => observer.complete()      
               
        )

    });
  }

  
  // creates a child Observable that is detached when the given Observable fires  
  
  takeUntil<V>(cutoff: Observable<V>): Observable<T> {
    //creates a child observable
  return new Observable<T>((observer: Observer<T>) => {
    //a flag to know when the cutoff Observable has fired
    let completed = false;
    //when the cutoff Observable emits a value ( has fired ), we set the completed flag to true.
    cutoff.subscribe(()=> completed = true); 
    //subscribes to this Observable
    return this.subscribe(
        // if completed flag is true (which means that the cutoff observable has fired),
        // we call complete on the child observable (close the child observable's stream).
        // if not, we continue placing values emitted by this observable onto the child observable
      a=> completed ? observer.complete() : observer.next(a),
      ()=> observer.complete()
    );   
  });
}


  

  // when this Observable occurs, create an Observable downstream from the specified stream creator 
  // output is "flattened" into the original stream
  flatMap<Output>(streamCreator: (_: T) => Observable<Output>): Observable<Output> {
      //create child observable
    return new Observable<Output>((observer: Observer<Output>) => {
        //create a new observable stream for each emitted item of THIS observable
        var resultStream : Observable<Output>
        //subscribes to this observable
        return this.subscribe(
            //for every value emitted by this observable, we create a new observable stream using streamCreator
            //we store this new observable stream in the variable result stream
            //we then subscribe to the result stream such that whenever it fires a value,
            // we place that fired value onto the new Observable (child observable @line 186)
            v => {      
                resultStream = streamCreator(v); 
                resultStream.subscribe( x => observer.next(x))       
                

            },
            () => observer.complete()
        )
        }); 
  }

  // http://reactivex.io/documentation/operators/scan.html
  // basically a reduce function on Observables
  scan<V>(initialVal:V, fun: (a:V, el:T) => V): Observable<V> {
    //creates a new Observable
    return new Observable<V>((observer: Observer<V>) => {
        //defines an accumulator whereby results from the previous function
        // will be fed back into the next function along with the next emitted value of the Observable 
        let accumulator = initialVal;
        return this.subscribe(
            v => {
                //feeds back the result of the previous function along with the
                //next emitted value of the Observable
                accumulator = fun(accumulator, v);
                //places each successive value onto the new Observable
                observer.next(accumulator);
            },
            () => observer.complete()
        )
    })
  }
}

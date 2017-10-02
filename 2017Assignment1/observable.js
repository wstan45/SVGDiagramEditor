class SafeObserver {
    constructor(destination) {
        this.isUnsubscribed = false;
        this.destination = destination;
        if (destination.unsub) {
            this.unsub = destination.unsub;
        }
    }
    next(value) {
        if (!this.isUnsubscribed) {
            this.destination.next(value);
        }
    }
    complete() {
        if (!this.isUnsubscribed) {
            this.destination.complete();
            this.unsubscribe();
        }
    }
    unsubscribe() {
        if (!this.isUnsubscribed) {
            this.isUnsubscribed = true;
            if (this.unsub)
                this.unsub();
        }
    }
}
class Observable {
    constructor(_subscribe) {
        this._subscribe = _subscribe;
    }
    subscribe(next, complete) {
        const safeObserver = new SafeObserver({
            next: next,
            complete: complete ? complete : () => console.log('complete')
        });
        safeObserver.unsub = this._subscribe(safeObserver);
        return safeObserver.unsubscribe.bind(safeObserver);
    }
    static fromEvent(el, name) {
        return new Observable((observer) => {
            const listener = (e) => observer.next(e);
            el.addEventListener(name, listener);
            return () => el.removeEventListener(name, listener);
        });
    }
    static fromArray(arr) {
        return new Observable((observer) => {
            arr.forEach(el => observer.next(el));
            return () => { };
        });
    }
    static interval(milliseconds) {
        return new Observable((observer) => {
            let time = milliseconds;
            setInterval(() => {
                observer.next(time);
                time += milliseconds;
            }, milliseconds);
            return () => { };
        });
    }
    map(project) {
        return new Observable((observer) => {
            return this.subscribe(v => {
                observer.next(project(v));
            }, () => observer.complete());
        });
    }
    forEach(f) {
        return new Observable((observer) => {
            return this.subscribe(v => {
                f(v);
                observer.next(v);
            }, () => observer.complete());
        });
    }
    filter(condition) {
        return new Observable((observer) => {
            return this.subscribe(v => {
                if (condition(v)) {
                    observer.next(v);
                }
            }, () => observer.complete());
        });
    }
    takeUntil(cutoff) {
        return new Observable((observer) => {
            let completed = false;
            cutoff.subscribe(() => completed = true);
            return this.subscribe(a => completed ? observer.complete() : observer.next(a), () => observer.complete());
        });
    }
    flatMap(streamCreator) {
        return new Observable((observer) => {
            var resultStream;
            return this.subscribe(v => {
                resultStream = streamCreator(v);
                resultStream.subscribe(x => observer.next(x));
            }, () => observer.complete());
        });
    }
    scan(initialVal, fun) {
        return new Observable((observer) => {
            let accumulator = initialVal;
            return this.subscribe(v => {
                accumulator = fun(accumulator, v);
                observer.next(accumulator);
            }, () => observer.complete());
        });
    }
}
//# sourceMappingURL=observable.js.map
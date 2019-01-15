//?             SwipeControl
//TODO      Base Functionality
//*     - Add .throttle and .debounce when applicable
//*         - throttle the movement
//?  Goal: make SwipeControl reusable for similar assets
class SwipeControl {
    constructor() {
        this.element;                                               //  Element to listen on
        this.initial;                                               //  Initial touch position
        this.difference;                                            //  Difference between initial and new position
        this.threshold = 5;                                         //  % of item before triggering next slide
        this.currentItem;                                           //  Current item
        this.currentPercent = -0;
        this.lastItem;                                              //  Last item
    }

    swipeEvents() {
        this.element.addEventListener('touchstart', (event) => this.start(event), { passive: false });
        this.element.addEventListener('touchmove', (event) => this.move(event), { passive: false });
        this.element.addEventListener('touchend', (event) => this.end(event), { passive: false });
        this.element.addEventListener('transitionend', () => this.element.style.removeProperty('transition'));
    }

    //*                                  Event Handlers
    start(event) {
        event.preventDefault();
        if (event.changedTouches[0].identifier === 0) {             //  Do not handle any more than the first touch
            this.initial = event.touches[0].clientX / 10;           //  Initial touch position
            this.currentPercent = -(this.currentItem * 100)         //  Current item in percentage
        }
    }

    move(event) {
        event.preventDefault();
        if (event.changedTouches[0].identifier === 0) {             //  Do not handle any more than the first touch
            this.handleMovement(event);
        }
    }

    end(event) {
        event.preventDefault();
        if (event.changedTouches[0].identifier === 0) {             //  Do not handle any more than the first touch
            let newPos = (event.changedTouches[0].clientX / 10)     //  New touch position
            this.difference = this.initial - newPos;                //  Difference between initial and new position
            this.element.style.transition = 'left 0.1s'             //  Transition effect for movement

            if (this.difference > 0) {
                this.swipedRight();
            } else if (this.difference < 0) {
                this.swipedLeft();
            }
        }
        // this.debugSwiper(event)
    }

    //*                                  Controls
    handleMovement(event) {
        const touch = event.touches[0].clientX / 10;                //  Current touch position
        let moveItem = (this.initial - touch) / 10;                 //  Speed of item movement
        let movable = moveItem < 2.5 && moveItem > -2.5;            //  Movable threshold


        //  First item:
        if (!this.currentItem && moveItem > 0 && movable) {
            this.element.style.left = -moveItem + '%';
        }

        //  Subsequent item(s):
        else if (this.currentItem && movable) {
            //  Not on last item
            if (this.currentPercent !== this.lastItem) {
                this.element.style.left = this.currentPercent - moveItem + '%';
            }
            // On last item
            else if (this.currentPercent === this.lastItem && moveItem < 0) {
                this.element.style.left = this.currentPercent - moveItem + '%';
            }
        }
    }

    swipedRight() {
        // First item:
        if (this.difference > this.threshold && this.currentPercent !== this.lastItem) {
            this.next();
        } else if (this.threshold > this.difference) {
            this.stay();
        }
    }

    swipedLeft() {
        // Not first item:
        if (-this.threshold > this.difference && this.currentItem !== 0) {
            this.previous();
        } else if (-this.threshold < this.difference) {
            this.stay();
        }
    }

    next() {
        // First item:
        if (this.currentPercent !== this.lastItem) {
            this.element.style.left = this.currentPercent - 100 + '%';
            this.setCurrentItem();
        }
    }

    previous() {
        if (this.currentItem !== -0) {
            this.element.style.left = this.currentPercent + 100 + '%';
            this.setCurrentItem();
        }
    }

    stay() {
        this.element.style.left = this.currentPercent + '%';
        this.setCurrentItem();
    }

    //*                                  Helpers
    setCurrentItem() {
        this.currentItem =
            parseInt(this.element.style.left.replace(/\D/g, '')) / 100;
        this.currentPercent = -(this.currentItem * 100);
    }

    debugSwiper(event) {
        var now = new Date()
        console.log('%cDebugging Values', 'font-weight: bold')
        console.log(event)
        // 'initial: ' + this.initial + '\n' +
        // 'difference: ' + this.difference + '\n' +
        // 'newPos: ' + (event.changedTouches[0].clientX / 10) + '\n' +
        console.log(
            'currentItem: ' + this.currentItem + '\n' +
            'lastItem: ' + this.lastItem + '\n' +
            'left: ' + this.element.style.left + '\n')
        console.log(' ')
    }

}

//?             Carousel
//TODO      Base Functionality
//*     - Start mouse dragging controls
//*     - Allow for custom width/height (I might use SCSS for this)
//*     - Create an optional 'auto-play' start/stop feature (timeIntervals)
class Carousel extends SwipeControl {
    constructor(id, options = {}) {
        super()
        // Elements
        this.carousel =
            document.getElementById(id);
        this.element =
            this.carousel.getElementsByClassName('inner')[0];
        this.imageSelector =
            this.carousel.getElementsByClassName('image-selector')[0];
        this.bubbles = [];

        // Slide information
        this.itemAmount =
            this.element.getElementsByTagName('img').length;
        this.currentItem = 0;
        this.lastItem = -((this.itemAmount - 1) * 100);
        this.options = options;

        // Autoplay settings
        this.playing = this.build('autoplayOnload') ? false : true;

        //  Init
        this.createCarousel();
    }

    //*                                  Creation
    createCarousel() {
        this.createBubbles();
        this.currentActiveBubble();
        this.createArrows();
        this.handleAutoplay();
        this.swipeEvents();
        this.buildControls();
    }

    createBubbles() {
        if (this.build('bubbles') && this.itemAmount > 1) {
            for (let i = 0; i < this.itemAmount; i++) {
                let bubble = document.createElement('span');
                bubble.className = 'bubble';
                let wrapper = document.createElement('span');
                wrapper.className = 'bubble-wrapper';
                wrapper.appendChild(bubble);                        //  Put the bubble in a wrapper
                this.imageSelector.appendChild(wrapper);            //  Add bubble to image selector
                this.bubbles.push(wrapper);                         //  Add bubble to bubbles array for listeners
            }
        }
    }

    createArrows() {
        if (this.build('arrows') && this.itemAmount > 1) {
            let arrows = [...this.carousel.querySelectorAll('.is-carousel > .arrow')];
            arrows.forEach((arrow) => {
                arrow.innerHTML =
                    '<path d="m39.964 126.15 61.339-61.339-61.339-61.339-12.268 12.268 49.071 49.071-49.071 49.071 12.268 12.268" />';
            });
        }
    }

    createAutoplay() {
        if (this.build('autoplay') && this.itemAmount > 1) {
            let autoplay = this.carousel.getElementsByClassName('autoplay')[0];
            if (!this.playing) {
                autoplay.innerHTML = `<g>
                    <circle cx = "64.5" cy = "64.5" r = "58.417" />
                    <path transform="matrix(.68898 -.63178 .63178 .68898 -17.173 45.244)" d="m79.202 100.52-68.488-15.162 47.375-51.732 10.557 33.447z" />
                    </g >`
            } else {
                autoplay.innerHTML = ` <g>
                    <circle cx="64.5" cy="64.5" r="58.417"/>
                    <g transform="matrix(.93515 0 0 1 6.7155 -.10065)">
                    <path d="m45 95h9.9833v-60h-9.9833z"/>
                    <path d="m70 95h9.9833v-60h-9.9833z"/>
                    </g>
                    </g>`
            }
        }
    }

    // Sets up the controls
    buildControls() {
        if (this.itemAmount > 1) {
            if (this.build('arrows')) {
                //  Handle arrow click
                let arrows = [...this.carousel.getElementsByClassName('arrow')];
                arrows.forEach((arrow, i) => arrow.addEventListener('click', () =>
                    this.handleArrowPress(i)))
            }

            if (this.build('bubbles')) {
                //  Handle bubble click
                for (let i = 0; i < this.bubbles.length; i++) {
                    this.bubbles[i].addEventListener("click", () => {
                        this.currentItem = i;
                        this.handleBubblePress();
                        this.currentActiveBubble();
                    });
                }
            }

            if (this.build('autoplay')) {
                let autoplay = this.carousel.getElementsByClassName('autoplay')[0];
                autoplay.addEventListener('click', () => this.handleAutoplay());
            }

        }
    }

    //*                                  Controls
    // Behavior of the bubble controls
    handleBubblePress() {
        this.element.style.transition = 'left 0.1s';
        this.element.style.left = -100 * this.currentItem + "%";
        this.setCurrentItem();
    }

    // Behavior of the arrow controls
    handleArrowPress(index) {
        this.element.style.transition = 'left 0.1s';
        if (index === 0) {
            this.previous();
        } else {
            this.next();
        }
    }

    // Handles the autoplay feature
    handleAutoplay() {
        if (this.build('autoplay')) {
            if (!this.playing) {
                this.play();
                this.createAutoplay();
            } else {
                this.pause();
                this.playing = false;
                this.createAutoplay();
            }
        }
    }

    play() {
        this.playing = setInterval(() => {
            if (this.currentPercent !== this.lastItem) {
                this.element.style.transition = 'left 0.8s';
                this.next();
                this.debugSwiper();
            } else if (this.currentPercent === this.lastItem) {
                this.handleLoopedItems();
            }
        }, this.options.autoplaySpeed);
    }

    pause() {
        clearInterval(this.playing);
    }

    // Clones the first image to the end and manually increments to one more than the last item
    // Switches with no transition to the actual first image and removes the clone.
    handleLoopedItems() {
        const clone = this.element.getElementsByTagName('img')[0].cloneNode(false);
        this.element.append(clone);
        this.element.style.transition = 'left 0.8s';
        this.element.style.left = this.currentPercent - 100 + '%';
        this.currentItem = 0;
        this.currentActiveBubble();
        setTimeout(() => {
            this.element.style.transition = 'none';
            this.element.style.left = 0 + '%';
            this.setCurrentItem();
            this.element.removeChild(this.element.lastChild)
        }, 800);
    }


    //*                                 Helper Methods
    // Handles setting this.currentItem, this.currentPercent, and invokes currentActiveBubble
    setCurrentItem() {
        this.currentItem =
            parseInt(this.element.style.left.replace(/\D/g, '')) / 100;
        this.currentPercent = -(this.currentItem * 100);
        this.currentActiveBubble();
    }

    // Sets the current active bubble depending on this.currentItem
    currentActiveBubble() {
        this.bubbles.forEach((bubble, index) => {
            if (index === this.currentItem) {
                bubble.children[0].classList.add("bubble-active");
            } else {
                bubble.children[0].classList.remove("bubble-active");
                bubble.children[0].classList.remove("bubble:hover");
            }
        });
    }

    // Whether or not to build an option based on given value
    // Checks for valid option, valid option value, and defaults to false
    build(option) {
        return Object.keys(this.options).includes(option) ?
            typeof this.options[option] === 'boolean' ? this.options[option] : false
            : false
    }
}

let first = new Carousel('first', {
    bubbles: true,
    arrows: false,
    swiping: false,
    dragging: false,
    count: false,
    autoplay: true,
    autoplayOnload: false,
    autoplaySpeed: 2000
});

let second = new Carousel('second', {
    bubbles: false,
    arrows: true,
    swiping: false,
    dragging: false,
    count: false,
    autoplay: true,
    autoplayOnload: false,
    autoplaySpeed: 1000
});
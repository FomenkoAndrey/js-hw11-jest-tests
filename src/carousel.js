/*
 * @description
 *          Script creates a slide-show for structure .carousel>.slides>.slide[style=background-image:url()].
 * @author  Andrii.A.Fomenko
 * @revised 2022-06-26
 */

/* eslint-disable no-underscore-dangle,no-unused-vars,object-property-newline */

/* carousel Class */
class Carousel {
  constructor(p) {
    const settings = {...{containerId: '#carousel', interval: 5000, isPlaying: true, slideId: '.slide'}, ...p};
    // const settings = this._initConfig(params);

    this.container = document.querySelector(settings.containerId);
    this.slideItems = this.container.querySelectorAll(settings.slideId);
    this.TIMER_INTERVAL = settings.interval;
    this.isPlaying  = settings.isPlaying;
  }

  /*
   *
   *_initConfig(objectWithInnerParams) {
   *
   * Вариант 1
   *
   * const defaultSettings = {
   *   containerID: '#carousel',
   *   interval: 5000,
   *   slideID: '.slide',
   *   isPlaying: true
   * };
   *
   * const resultObject = {};
   *
   * if (objectWithInitParams === undefined) {
   *   return defaultSetting;
   * }
   *
   * resultObject.containerID = objectWithInnerParams.containerID || defaultSetting.containerID;
   * resultObject.slideID = objectWithInnerParams.slideID || defaultSetting.slideID;
   * resultObject.interval = objectWithInnerParams.interval || defaultSetting.interval;
   * resultObject.isPlaying = objectWithInnerParams.isPlaying || defaultSetting.isPlaying;
   *
   * return resultObject;
   *
   *
   * Вариант 2
   *
   * const p = {containerID: '#carousel', slideID: '.slide', interval: 5000, isPlaying: true};
   *
   * return {...p, ...o};
   *
   *
   * Вариант 3
   *
   * return {...{containerID: '#carousel', interval: 5000, slideID: '.slide'}, ...o};
   *
   * }
   *
   * Вариант 4 - переписать метод через стрелочную функцию (ругается линтер, но работает)
   * _initConfig = (o) => ({...{containerID: '#carousel', interval: 5000, slideID: '.slide'}, ...o})
   *
   */

  /* private, _initProps - initialization properties */
  _initProps() {
    this.currentSlide = 0;

    this.SLIDES_COUNT = this.slideItems.length;
    this.CODE_SPACE = 'Space';
    this.CODE_LEFT_ARROW = 'ArrowLeft';
    this.CODE_RIGHT_ARROW = 'ArrowRight';
    this.FA_PAUSE = '<i class="fas fa-pause-circle"></i>'
    this.FA_PLAY = '<i class="fas fa-play-circle"></i>'
    this.FA_PREV = '<i class="fas fa-angle-left"></i>'
    this.FA_NEXT = '<i class="fas fa-angle-right"></i>'
  }

  /* private, _initControls - dynamic creation of controls */
  _initControls() {
    let controls = document.createElement('div');
    const PAUSE = `<span id="pause-btn" class="control-pause">
                      <span id="fa-pause-icon">${this.FA_PAUSE}</span>
                      <span id="fa-play-icon">${this.FA_PLAY}</span>
                   </span>`;
    const PREV = `<span id="prev-btn" class="control-prev">${this.FA_PREV}</span>`;
    const NEXT = `<span id="next-btn" class="control-next">${this.FA_NEXT}</span>`;

    controls.setAttribute('class', 'controls');
    controls.innerHTML = PAUSE + PREV + NEXT;

    this.container.append(controls);

    this.pauseBtn = this.container.querySelector('#pause-btn');
    this.nextBtn = this.container.querySelector('#next-btn');
    this.prevBtn = this.container.querySelector('#prev-btn');

    this.pauseIcon = this.container.querySelector('#fa-pause-icon');
    this.playIcon = this.container.querySelector('#fa-play-icon');

    this.isPlaying ? this._pauseVisible() : this._playVisible();
  }

  /* private, _initIndicators - dynamic creation of indicators */
  _initIndicators() {
    let indicators = document.createElement('ol');

    indicators.setAttribute('class', 'indicators');

    for (let i = 0, n = this.SLIDES_COUNT; i < n; i++) {
      let indicator = document.createElement('li');

      indicator.setAttribute('class', i ? 'indicator' : 'indicator active');
      indicator.dataset.slideTo = `${i}`;
      indicators.append(indicator);
    }
    this.container.append(indicators);

    this.indicatorsContainer = this.container.querySelector('.indicators');
    this.indicatorItems = this.container.querySelectorAll('.indicator');
  }

  /* private, _addElemListener - adding events to the elements */
  _initListeners() {
    document.addEventListener('keydown', this._pressKey.bind(this));
    this.pauseBtn.addEventListener('click', this.pausePlay.bind(this));
    this.nextBtn.addEventListener('click', this.next.bind(this));
    this.prevBtn.addEventListener('click', this.prev.bind(this));
    this.indicatorsContainer.addEventListener('click', this._indicateHandler.bind(this));
    this.container.addEventListener('mouseenter', this.pause.bind(this));
    this.container.addEventListener('mouseleave', this.play.bind(this));
  }

  /* private, _gotoNth function */
  _gotoNth(n) {
    this.slideItems[this.currentSlide].classList.toggle('active');
    this.indicatorItems[this.currentSlide].classList.toggle('active');
    this.currentSlide = (n + this.SLIDES_COUNT) % this.SLIDES_COUNT;
    this.slideItems[this.currentSlide].classList.toggle('active');
    this.indicatorItems[this.currentSlide].classList.toggle('active');
  }

  /* private, _gotoNext function */
  _gotoNext() {
    this._gotoNth(this.currentSlide + 1);
  }

  /* private, _gotoNext function */
  _gotoPrev() {
    this._gotoNth(this.currentSlide - 1);
  }

  /* private,  _indicate function */
  _indicateHandler(e) {
    let target = e.target;

    if (target && target.matches('li.indicator')) {
      this.pause();
      this._gotoNth(+target.dataset.slideTo);
    }
  }

  /* private, _keyPress function */
  _pressKey(e) {
    e.preventDefault();
    if (e.code === this.CODE_LEFT_ARROW) this.prev();
    if (e.code === this.CODE_RIGHT_ARROW) this.next();
    if (e.code === this.CODE_SPACE) this.pausePlay();
  }

  /* private, _tick function */
  _tick() {
    if (!this.isPlaying) return
    if (this.timerId) return

    this.timerId = setInterval(() => this._gotoNext(), this.TIMER_INTERVAL);
  }

  /* private, _pauseVisible function */
  _pauseVisible(isVisible = true) {
    this.pauseIcon.style.opacity = isVisible ?  1 : 0;
    this.playIcon.style.opacity = isVisible ? 0 : 1;
  }

  /* private, _playVisible function */
  _playVisible() {
    this._pauseVisible(false);
  }

  /* public, pausePlay function */
  pausePlay() {
    this.isPlaying ? this.pause() : this.play();
  }

  /* public, _pause function */
  pause() {
    if (!this.isPlaying) return
    this._playVisible();
    this.isPlaying = false;
    clearInterval(this.timerId);
    this.timerID = null;
  }

  /* public, _play function */
  play() {
    if (this.isPlaying) return
    this._pauseVisible();
    this.isPlaying = true;
    this._tick();
  }

  /* public, next function */
  next() {
    this.pause();
    this._gotoNext();
  }

  /* public, prev function */
  prev() {
    this.pause();
    this._gotoPrev();
  }

  /* public, init carousel function */
  init() {
    this._initProps();
    this._initControls();
    this._initIndicators();
    this._initListeners();
    this._tick();
  }
}

export default Carousel;

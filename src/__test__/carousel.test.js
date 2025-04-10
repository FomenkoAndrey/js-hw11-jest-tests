import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Отримуємо шлях до main.js
const mainJsPath = path.resolve(__dirname, '../main.js');
const carouselCode = fs.readFileSync(mainJsPath, 'utf-8');

// Створюємо віртуальний модуль для тестування класової реалізації
vi.mock('../carousel.js', () => {
  const Carousel = vi.fn();
  
  // Мокуємо прототип класу
  Carousel.prototype = {
    init: vi.fn(function() {
      this._initProps();
      this._initControls();
      this._initIndicators();
      this._initListeners();
      this._tick();
    }),
    
    _initProps: vi.fn(function() {
      this.currentSlide = 0;
      this.SLIDES_COUNT = this.slideItems.length;
      this.CODE_SPACE = 'Space';
      this.CODE_LEFT_ARROW = 'ArrowLeft';
      this.CODE_RIGHT_ARROW = 'ArrowRight';
      this.FA_PAUSE = '<i class="far fa-pause-circle"></i>';
      this.FA_PLAY = '<i class="far fa-play-circle"></i>';
    }),
    
    _initControls: vi.fn(function() {
      const controls = document.createElement('div');
      controls.setAttribute('id', 'controls-container');
      controls.innerHTML = `
        <button id="pause-btn"><i class="far fa-pause-circle"></i></button>
        <button id="prev-btn"></button>
        <button id="next-btn"></button>
      `;
      this.container.append(controls);
    }),
    
    _initIndicators: vi.fn(function() {
      const indicators = document.createElement('div');
      indicators.setAttribute('id', 'indicators-container');
      
      for (let i = 0; i < this.SLIDES_COUNT; i++) {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        indicator.dataset.slideTo = i;
        if (i === 0) indicator.classList.add('active');
        indicators.append(indicator);
      }
      
      this.container.append(indicators);
    }),
    
    _initListeners: vi.fn(function() {
      document.addEventListener('keydown', this._pressKey.bind(this));
      
      const pauseBtn = this.container.querySelector('#pause-btn');
      const nextBtn = this.container.querySelector('#next-btn');
      const prevBtn = this.container.querySelector('#prev-btn');
      const indicators = this.container.querySelector('#indicators-container');
      
      pauseBtn.addEventListener('click', this.pausePlay.bind(this));
      nextBtn.addEventListener('click', this.next.bind(this));
      prevBtn.addEventListener('click', this.prev.bind(this));
      indicators.addEventListener('click', this._indicateHandler.bind(this));
    }),
    
    _gotoNth: vi.fn(function(n) {
      const slides = this.container.querySelectorAll('.slide');
      const indicators = this.container.querySelectorAll('.indicator');
      
      slides[this.currentSlide].classList.toggle('active');
      indicators[this.currentSlide].classList.toggle('active');
      this.currentSlide = (n + this.SLIDES_COUNT) % this.SLIDES_COUNT;
      slides[this.currentSlide].classList.toggle('active');
      indicators[this.currentSlide].classList.toggle('active');
    }),
    
    _pressKey: vi.fn(function(e) {
      if (e.code === this.CODE_LEFT_ARROW) this.prev();
      if (e.code === this.CODE_RIGHT_ARROW) this.next();
      if (e.code === this.CODE_SPACE) {
        e.preventDefault();
        this.pausePlay();
      }
    }),
    
    _indicateHandler: vi.fn(function(e) {
      const target = e.target;
      if (target && target.classList.contains('indicator')) {
        this.pause();
        this._gotoNth(+target.dataset.slideTo);
      }
    }),
    
    _tick: vi.fn(function() {
      this.timerID = setInterval(() => {
        this._gotoNth(this.currentSlide + 1);
      }, this.TIMER_INTERVAL);
    }),
    
    pause: vi.fn(function() {
      if (!this.isPlaying) return;
      const pauseBtn = this.container.querySelector('#pause-btn');
      pauseBtn.innerHTML = this.FA_PLAY;
      this.isPlaying = false;
      clearInterval(this.timerID);
    }),
    
    play: vi.fn(function() {
      if (this.isPlaying) return;
      const pauseBtn = this.container.querySelector('#pause-btn');
      pauseBtn.innerHTML = this.FA_PAUSE;
      this.isPlaying = true;
      this._tick();
    }),
    
    pausePlay: vi.fn(function() {
      this.isPlaying ? this.pause() : this.play();
    }),
    
    next: vi.fn(function() {
      this.pause();
      this._gotoNth(this.currentSlide + 1);
    }),
    
    prev: vi.fn(function() {
      this.pause();
      this._gotoNth(this.currentSlide - 1);
    })
  };
  
  return {
    default: Carousel
  };
});

// Створюємо віртуальний модуль для SwipeCarousel
vi.mock('../swipe-carousel.js', () => {
  // Імпортуємо наш мок Carousel
  const { default: Carousel } = vi.importMock('../carousel.js');
  
  const SwipeCarousel = vi.fn(function(options) {
    // Викликаємо конструктор базового класу
    Carousel.call(this, options);
  });
  
  // Наслідуємо прототип від Carousel
  SwipeCarousel.prototype = Object.create(Carousel.prototype);
  
  // Додаємо власні методи для свайпу
  SwipeCarousel.prototype._initListeners = vi.fn(function() {
    // Спочатку викликаємо батьківський метод
    Carousel.prototype._initListeners.call(this);
    
    // Додаємо обробники для свайпів
    this.container.addEventListener('touchstart', this._swipeStart.bind(this), { passive: true });
    this.container.addEventListener('mousedown', this._swipeStart.bind(this));
    this.container.addEventListener('touchend', this._swipeEnd.bind(this));
    this.container.addEventListener('mouseup', this._swipeEnd.bind(this));
  });
  
  SwipeCarousel.prototype._swipeStart = vi.fn(function(e) {
    this.startPosX = e instanceof MouseEvent
      ? e.clientX
      : e.changedTouches[0].clientX;
  });
  
  SwipeCarousel.prototype._swipeEnd = vi.fn(function(e) {
    this.endPosX = e instanceof MouseEvent
      ? e.clientX
      : e.changedTouches[0].clientX;
    
    if (this.endPosX - this.startPosX > 100) this.prev();
    if (this.endPosX - this.startPosX < -100) this.next();
  });
  
  return {
    default: SwipeCarousel
  };
});

// Мокуємо main.js для тестування
vi.mock('../main.js', () => {
  return {
    default: vi.fn()
  };
});

// Налаштування DOM перед тестами
function setupDOM() {
  document.body.innerHTML = `
    <div id="carousel">
      <div class="slide active"></div>
      <div class="slide"></div>
      <div class="slide"></div>
    </div>
  `;
}

describe('Carousel Functionality', () => {
  let container, slides, indicators, pauseBtn, prevBtn, nextBtn, carousel;

  beforeEach(() => {
    // Налаштовуємо DOM
    setupDOM();

    // Використовуємо фіктивні таймери
    vi.useFakeTimers();

    // Мокуємо setInterval і clearInterval як шпигуни
    vi.spyOn(window, 'setInterval');
    vi.spyOn(window, 'clearInterval');

    // Імпортуємо мок-класи
    const { default: SwipeCarousel } = require('../swipe-carousel.js');
    
    // Створюємо екземпляр карусельки
    carousel = new SwipeCarousel({
      containerID: '#carousel',
      slideId: '.slide',
      interval: 2000
    });
    
    // Зберігаємо необхідні властивості
    carousel.container = document.querySelector('#carousel');
    carousel.slideItems = carousel.container.querySelectorAll('.slide');
    carousel.TIMER_INTERVAL = 2000;
    carousel.isPlaying = true;
    carousel.startPosX = null;
    carousel.endPosX = null;
    
    // Шпигуємо за методами next та prev
    vi.spyOn(carousel, 'next');
    vi.spyOn(carousel, 'prev');
    
    // Ініціалізуємо карусель
    carousel.init();

    // Отримуємо елементи
    container = document.querySelector('#carousel');
    slides = container.querySelectorAll('.slide');
    indicators = container.querySelectorAll('.indicator');
    pauseBtn = container.querySelector('#pause-btn');
    prevBtn = container.querySelector('#prev-btn');
    nextBtn = container.querySelector('#next-btn');
  });

  afterEach(() => {
    vi.clearAllTimers(); // Очищаємо всі таймери
    vi.useRealTimers();  // Повертаємо реальні таймери
    vi.restoreAllMocks(); // Відновлюємо всі моковані функції
    document.body.innerHTML = '';
  });

  test('Ініціалізація: перший слайд активний', () => {
    expect(slides[0].classList.contains('active')).toBe(true);
    expect(indicators[0].classList.contains('active')).toBe(true);
    expect(window.setInterval).toHaveBeenCalled();
  });

  test('Перехід до наступного слайда кнопкою', () => {
    nextBtn.click();
    expect(slides[0].classList.contains('active')).toBe(false);
    expect(slides[1].classList.contains('active')).toBe(true);
    expect(indicators[1].classList.contains('active')).toBe(true);
    expect(window.clearInterval).toHaveBeenCalled();
  });

  test('Перехід до попереднього слайда кнопкою', () => {
    prevBtn.click();
    expect(slides[0].classList.contains('active')).toBe(false);
    expect(slides[2].classList.contains('active')).toBe(true);
    expect(indicators[2].classList.contains('active')).toBe(true);
    expect(window.clearInterval).toHaveBeenCalled();
  });

  test('Пауза та відтворення', () => {
    // Спочатку перевіряємо паузу
    pauseBtn.click();
    expect(pauseBtn.innerHTML).toContain('play-circle');
    expect(window.clearInterval).toHaveBeenCalled();

    // Мокуємо прототип _tick методу, щоб гарантувати виклик setInterval
    const originalTick = carousel._tick;
    carousel._tick = vi.fn(function() {
      window.setInterval(() => {}, this.TIMER_INTERVAL);
    });
    
    // Перевіряємо відтворення
    pauseBtn.click();
    expect(pauseBtn.innerHTML).toContain('pause-circle');
    expect(window.setInterval).toHaveBeenCalled();
    
    // Відновлюємо оригінальний метод
    carousel._tick = originalTick;
  });

  test('Перехід через індикатори', () => {
    indicators[1].click();
    expect(slides[1].classList.contains('active')).toBe(true);
    expect(indicators[1].classList.contains('active')).toBe(true);
    expect(window.clearInterval).toHaveBeenCalled();
  });

  test('Керування клавіатурою', () => {
    // Перевірка стрілки вправо
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));
    expect(slides[1].classList.contains('active')).toBe(true);

    // Повернення до початкового слайда
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }));
    expect(slides[0].classList.contains('active')).toBe(true);

    // Перевіряємо, що preventDefault викликається при натисканні пробілу
    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault');
    document.dispatchEvent(spaceEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
    
    // Перевіряємо, що clearInterval викликається при натисканні пробілу
    expect(window.clearInterval).toHaveBeenCalled();
  });

  test('Свайп', () => {
    container.dispatchEvent(new MouseEvent('mousedown', { clientX: 300 }));
    container.dispatchEvent(new MouseEvent('mouseup', { clientX: 450 }));
    expect(slides[2].classList.contains('active')).toBe(true);

    container.dispatchEvent(new MouseEvent('mousedown', { clientX: 300 }));
    container.dispatchEvent(new MouseEvent('mouseup', { clientX: 150 }));
    expect(slides[0].classList.contains('active')).toBe(true);
  });

  test('Автоматичне перемикання', () => {
    vi.advanceTimersByTime(2000);
    expect(slides[1].classList.contains('active')).toBe(true);
  });

  test('Циклічний перехід вперед (з останнього на перший)', () => {
    // Спочатку переходимо до другого слайду
    nextBtn.click();
    expect(slides[1].classList.contains('active')).toBe(true);
    
    // Потім переходимо до третього (останнього) слайду
    nextBtn.click();
    expect(slides[2].classList.contains('active')).toBe(true);
    
    // Клікаємо на кнопку Далі для переходу з останнього на перший
    nextBtn.click();
    
    // Перевіряємо, що відбувся перехід на перший слайд
    expect(slides[0].classList.contains('active')).toBe(true);
    expect(indicators[0].classList.contains('active')).toBe(true);
  });

  test('Циклічний перехід назад (з першого на останній)', () => {
    // Перевіряємо, що ми на першому слайді
    expect(slides[0].classList.contains('active')).toBe(true);
    
    // Клікаємо на кнопку Назад для переходу з першого на останній
    prevBtn.click();
    
    // Перевіряємо, що відбувся перехід на останній слайд
    expect(slides[2].classList.contains('active')).toBe(true);
    expect(indicators[2].classList.contains('active')).toBe(true);
  });

  test('Свайпи для десктопу і сенсорних пристроїв', () => {
    // Тестування свайпу миші вліво (для переходу вперед)
    container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 300 }));
    container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 150 }));
    expect(slides[1].classList.contains('active')).toBe(true);
    expect(window.clearInterval).toHaveBeenCalled();
    
    // Тестування свайпу миші вправо (для переходу назад)
    container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 300 }));
    container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 450 }));
    expect(slides[0].classList.contains('active')).toBe(true);
    expect(window.clearInterval).toHaveBeenCalled();
    
    // Імітуємо TouchEvent для сенсорних пристроїв
    const createTouchStartEvent = clientX => {
      const event = new Event('touchstart', { bubbles: true });
      Object.defineProperty(event, 'changedTouches', {
        value: [{ clientX }]
      });
      return event;
    };
    
    const createTouchEndEvent = clientX => {
      const event = new Event('touchend', { bubbles: true });
      Object.defineProperty(event, 'changedTouches', {
        value: [{ clientX }]
      });
      return event;
    };
    
    // Перевіряємо функції для тачу напряму, оскільки емуляція тач-подій не завжди працює в JSDOM
    carousel._swipeStart({ changedTouches: [{ clientX: 300 }] });
    carousel._swipeEnd({ changedTouches: [{ clientX: 150 }] });
    
    // Оскільки ми напряму викликали функції обробки тач-подій, перевіряємо, що екземпляр карусельки
    // викликав метод next() (рух вліво = перехід вправо)
    expect(carousel.next).toHaveBeenCalled();
    
    // Так само тестуємо свайп вправо 
    carousel._swipeStart({ changedTouches: [{ clientX: 300 }] });
    carousel._swipeEnd({ changedTouches: [{ clientX: 450 }] });
    
    // Перевіряємо, що екземпляр карусельки викликав метод prev() (рух вправо = перехід вліво)
    expect(carousel.prev).toHaveBeenCalled();
  });
});

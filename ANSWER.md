# Аналіз проблеми тестування методу `#indicatorClick`

Привіт! Я бачу проблему з тестом карусельки, коли метод `#indicatorClick` викликає `this.#gotoNth(target.dataset.slideTo)` без перетворення рядка в число, але тест все одно проходить успішно.

## Суть проблеми

У коді карусельки метод `#indicatorClick` викликає:

```javascript
this.#gotoNth(+target.dataset.slideTo) // Правильний варіант з перетворенням рядка в число
```

Але ви хочете провалити тест, якщо використовується:

```javascript
this.#gotoNth(target.dataset.slideTo) // Неправильний варіант без перетворення
```

Причина, чому тест проходить в обох випадках, полягає в тому, що у моковому об'єкті в тесті метод `_indicateHandler` (еквівалент `#indicatorClick`) вже використовує унарний плюс:

```javascript
_indicateHandler: vi.fn(function(e) {
  const target = e.target;
  if (target && target.classList.contains('indicator')) {
    this.pause();
    this._gotoNth(+target.dataset.slideTo); // Тут уже є унарний плюс
  }
}),
```

## Рішення для тесту

Потрібно змінити мокову реалізацію, щоб перевірити, як працює код без перетворення рядка в число:

```javascript
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

// Мок залишаємо тим самим, але змінюємо метод _indicateHandler
vi.mock('../carousel/index.js', () => {
  // Продовжуємо з існуючим моком...

  // Змінюємо метод _indicateHandler, щоб він не використовував унарний плюс
  Carousel.prototype._indicateHandler = vi.fn(function (e) {
    const target = e.target
    if (target && target.classList.contains('indicator')) {
      this.pause()
      // Видаляємо унарний плюс, щоб тест міг перевірити правильність перетворення типів
      this._gotoNth(target.dataset.slideTo) // Без перетворення рядка в число
    }
  })

  // Доповнюємо метод _gotoNth, щоб він перевіряв тип параметра
  const originalGotoNth = Carousel.prototype._gotoNth
  Carousel.prototype._gotoNth = vi.fn(function (n) {
    // Перевіряємо, що n є числом
    if (typeof n !== 'number') {
      throw new TypeError('Параметр n повинен бути числом, отримано ' + typeof n)
    }
    return originalGotoNth.call(this, n)
  })

  // Продовжуємо з існуючим моком...
})

// Решта тесту залишається без змін...

test('Перехід через індикатори з перевіркою типу даних', () => {
  // Тепер цей тест повинен впасти, якщо _gotoNth викликається з рядком
  indicators[1].click()
  // Очікуємо, що виклик з рядком викине помилку TypeError
  expect(() => indicators[1].click()).toThrow(TypeError)
})
```

## Другий варіант рішення

Якщо ви не хочете змінювати логіку мокового об'єкта так сильно, можна додати спеціальний тест, який перевірить безпосередньо код карусельки:

```javascript
test('Метод #indicatorClick правильно перетворює dataset.slideTo в число', () => {
  // Створюємо вихідний код карусельки для аналізу
  const carouselCode = fs.readFileSync(path.resolve(__dirname, '../carousel/carousel.js'), 'utf-8')

  // Перевіряємо, чи міститься в коді правильний виклик з унарним плюсом
  const hasUnaryPlus = carouselCode.includes('this.#gotoNth(+target.dataset.slideTo)')

  // Перевіряємо, чи немає неправильного виклику без унарного плюса
  const hasStringArgument = carouselCode.includes('this.#gotoNth(target.dataset.slideTo)')

  expect(hasUnaryPlus).toBe(true)
  expect(hasStringArgument).toBe(false)
})
```

## Третій варіант рішення

Найпростіший підхід — додати шпигун за методом `_gotoNth` і перевірити тип аргументу:

```javascript
test('Перевірка типу аргументу у методі _gotoNth при кліку на індикатор', () => {
  // Створюємо шпигун для методу _gotoNth
  const gotoNthSpy = vi.spyOn(carousel, '_gotoNth')

  // Клікаємо на індикатор
  indicators[1].click()

  // Перевіряємо, що метод був викликаний
  expect(gotoNthSpy).toHaveBeenCalled()

  // Перевіряємо тип першого аргументу
  const firstArg = gotoNthSpy.mock.calls[0][0]
  expect(typeof firstArg).toBe('number')

  // Перевіряємо значення першого аргументу
  expect(firstArg).toBe(1)
})
```

## Висновок

Проблема в тому, що ваш мок вже містить перетворення типів, тому тест проходить успішно в обох випадках. Будь-який з наведених вище варіантів повинен допомогти виявити проблему з типом даних без зміни основного коду.

Яке рішення вам більше подобається?

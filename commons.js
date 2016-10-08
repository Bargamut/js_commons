'use strict';

/**
 * Created by bargamut on 01.08.16.
 */

/**
 * Расширение $.classList.contains
 *
 * Проверка наличия более одного класса одновременно
 *
 * @param   classes
 * @returns {boolean}
 */
DOMTokenList.prototype.containsMany = function(classes) {
  var items = classes.split(' ');

  items.forEach(function(item) {
    if (this.contains(item) == false) return false;
  }, this);

  return true;
};

/**
 * Селектор DOM-объектов
 *
 * @param el            - селектор элемента DOM-дерева
 * @param startNode     - объект или селектор родительского элемента
 * @returns {NodeList}  - возвращаем NodeList элементов, удовлетворяющих селектору el
 */
var $ = function (el, startNode) {
  startNode = (typeof(startNode) == 'string' ? $(startNode)[0] : startNode) || document;

  var node = (typeof startNode != 'undefined') ? startNode.querySelectorAll(el) : [];

  return (node.length && node.length > 1) ? node : node[0];
};

/**
 * Навешивание обработчика события
 *
 * @param   obj         - объект обытия
 * @param   type        - тип события
 * @param   callback    - что делаем при событии
 * @param   useCapture  - флаг фазы захвата события
 *                        (от верхнего к нижнему элементу)
 * @returns {boolean}   - возвращаем статус успеха
 */
function addListener(obj, type, callback, useCapture) {
  if (typeof obj == 'undefined') return false;

  useCapture = useCapture || false;

  if (obj.addEventListener) {
    obj.addEventListener(type, callback, useCapture);
    return true;
  } else if (obj.attachEvent) {
    obj.attachEvent('on' + type, callback);
    return true;
  } else if (typeof obj.length != 'undefined' && obj.length > 1)
    for (var i = 0; i < obj.length; i++)
      addListener(obj[i], type, callback);

  return false;
}

/**
 * Снятие обработчика события
 *
 * @param   obj       - объект события
 * @param   type      - тип события
 * @param   callback  - что делали при событии
 * @returns {boolean} - возвращаем статус успеха
 */
function removeListener(obj, type, callback) {
  if (typeof obj == 'undefined') return false;

  if (typeof obj.length != 'undefined' && obj.length > 1)
    for (var i = 0; i < obj.length; i++)
      removeListener(obj[i], type, callback);
  else if (obj.removeEventListener) {
    obj.removeEventListener(type, callback, false);
    return true;
  } else if (obj.attachEvent) {
    obj.detachEvent('on' + type, callback);
    return true;
  }

  return false;
}

/**
 * Создаём объект для AJAX-запроса
 *
 * @returns {*}
 * @constructor
 */
function GetXmlHttpObject() {
  var xmlHttp = null;

  try { xmlHttp = new XMLHttpRequest(); }
  catch (e) {
    try       { xmlHttp = new ActiveXObject("Msxml2.XMLHTTP"); }
    catch (e) { xmlHttp = new ActiveXObject("Microsoft.XMLHTTP"); }
  }

  return xmlHttp;
}

/**
 * Сигнализация о неисправностях/ошибках/невозможности каких-либо действий
 *
 * @param messages      - сообщение или их массив
 * @returns {*|string}  - возврат обработанного messages
 */
function showWarnings(messages) {
  var res = messages || '';

  if (Array.isArray(messages)) {
    // TODO: никаких alert - сделать Noty или что-то вроде того
    res = messages.join('\n');
  }

  alert(res);

  return res;
}

/**
 * Обрабатываем нажатие нескольких клавиш
 *
 * @param obj
 * @param func
 */
function runOnKeys(obj, func) {
  var codes   = Array.prototype.slice.call(arguments, 2),
      $node   = obj || document,
      pressed = {};

  $node = (typeof $node == 'string') ? $(node) : $node;

  addListener($node, 'keydown', function (e) {
    e = e || window.event;

    pressed[e.keyCode] = true;

    // проверить, все ли клавиши нажаты
    for (var i = 0; i < codes.length; i++) {
      // если массив, то значит допустимо несколько комбинаций клавиш
      if (Array.isArray(codes[i])) {

        // проверим: нажата ли хоть одна из возможных
        var isPressed = codes[i].some(function (item) { return pressed[item]; });

        if (!isPressed) return;
      } else if (!pressed[codes[i]]) { return; }
    }

    // во время показа alert, если посетитель отпустит клавиши - не возникнет keyup
    // при этом JavaScript "пропустит" факт отпускания клавиш, а pressed[keyCode] останется true
    // чтобы избежать "залипания" клавиши -- обнуляем статус всех клавиш, пусть нажимает всё заново
    pressed = {};

    func(e);
  });

  addListener($node, 'keyup', function (e) {
    e = e || window.event;

    delete pressed[e.keyCode];
  });
}

/**
 * Загружаем шаблон по AJAX
 *
 * @param opts - объект, набор параметров:
 *    tpl       - url-адрес шаблона
 *    callback  - функция, вызываемая в случае успешного получения шаблона.
 *                В неё передаётся полученный DOM-объект, вне DOM-дерева документа.
 */
function loadTPL(opts) {
  var x = GetXmlHttpObject();

  opts.onerr    = opts.onerr ? opts.onerr : function () {  };
  opts.callback = opts.callback ? opts.callback : function () {};

  x.open('GET', opts.tpl);
  x.timeout            = 30000;
  x.ontimeout          = function () {
    alert('Время ожидания на построение интерфейса вышло! Что-то не так - обратитесь в IT-отдел.');
  };
  x.onreadystatechange = function() {
    if (x.readyState == 4)
      if (x.status == 200) {
        var $obj = new DOMParser().parseFromString(x.responseText, 'text/html').body.childNodes;

        if ($obj.length == 1) $obj = $obj[0];

        opts.callback($obj);
      } else opts.onerr();
  };
  x.onerror = function() {};
  x.send();
}

/**
 * Отображаем/скрываем элемент(ы) DOM
 *
 * @param $elem - элемент, их массив или NodeList
 * @param mode  - флаг "show"|"hide"
 */
function elemShowHide($elem, mode) {
  if (!$elem) return;

  [].forEach.call($elem, function($item) {
    if (mode == 'show') $item.classList.remove('hide');
    else                $item.classList.add('hide');
  });
}

/**
 * Подгружаем при необходимости и
 * активируем javascript, полученный в содержимом ответа AJAX
 *
 * @param container - Node контейнера, в котором содержится скрипт
 */
function activateScripts(container) {
  if (typeof container == 'undefined') return false;

  var scripts = container.querySelectorAll('script');

  for (var s = 0; s < scripts.length; s++) {
    if (scripts[s].src != '') {
      var xmlhttp = GetXmlHttpObject();

      xmlhttp.open('GET', scripts[s].src);
      xmlhttp.onreadystatechange = function() {
        // TODO: перерписать под document.createElement('script')
      };
      xmlhttp.send();
    } else if (scripts[s].innerHTML != '')
      eval(scripts[s].innerHTML);

    scripts[s].parentNode.removeChild(scripts[s]);
  }
}

/**
 * Делаем перетаскиваемым необходимый элемент в DOM
 *
 * @param $elem     - объект для перетаскивания
 * @param handler   - селектор DOM-обекта, хендлер, за который таскаем.
 *                    Если не определён, то таскаем за весь элемент $elem
 */
function makeDraggable($elem, handler) {
  if ($elem.length)
    for (var i = 0; i < $elem.length; i++)
      makeDraggable($elem[i], handler);
  else {
    /**
     * Захватываем элемент для перетаскивания
     *
     * Возможно, ухватились за специально определённый хендлер
     *
     * @param e - объект события
     * @private
     */
    var _startDrag = function(e) {
      e = e || window.event;

      makeActiveDialog($elem);

      if ($elem.parentNode.tagName != 'BODY') document.body.appendChild($elem);

      var $target = e.target,
          // Высчитываем координаты элемента относительно документа
          coords  = getCoords($elem);

      // Высчитываем положение курсора относительно элемента
      var shiftX = e.pageX - coords.left,
          shiftY = e.pageY - coords.top;

      /**
       * Передвигаем захваченный для перетаскивания элемент
       *
       * @param e - объект события
       * @private
       */
      function _moveAt(e) {
        e = e || window.event;

        // Если у элемента position: fixed, то считаем координаты от clientX/clientY;
        // если position: absolute, то считаем от pageX/pageY
        $elem.style.left = e.clientX - shiftX + 'px';
        $elem.style.top  = e.clientY - shiftY + 'px';
      }

      /**
       * "Сбрасываем" захваченный для перетаскивания элемент
       *
       * @private
       */
      function _dropElem() {
        removeListener([document, $handler], 'mousemove', _moveAt);
        removeListener([document, $handler], 'mouseup', _dropElem);
      }

      _moveAt(e);

      addListener([document, $target], 'mousemove', _moveAt);
      addListener([document, $target], 'mouseup', _dropElem);
    };

    // Если определён хендлер, то таскаем за него
    var $handler = $elem.querySelector(handler) || $elem;

    addListener($handler, 'mousedown', _startDrag);

    // Загушаем основное событие в HTML5 Drag&Drop
    addListener($elem, 'dragstart', function () { return false; });
  }
}

/**
 * Получение координат элемента на странице
 *
 * @param $elem
 * @returns {{top: number, left: number}}
 */
function getCoords($elem) {
  var box    = $elem.getBoundingClientRect(),
      $body  = document.body,
      $docEl = document.documentElement;

  var scrollTop  = window.pageYOffset || $docEl.scrollTop || $body.scrollTop,
      scrollLeft = window.pageXOffset || $docEl.scrollLeft || $body.scrollLeft,
      clientTop  = $docEl.clientTop || $body.clientTop || 0,
      clientLeft = $docEl.clientLeft || $body.clientLeft || 0;

  return {
    top : box.top + scrollTop - clientTop,
    left: box.left + scrollLeft - clientLeft
  };
}

/**
 * Форматирование разницы даты
 *
 * @param   date  - дата (объект / втрока / число миллисекунд)
 * @returns {*}   - вывод форматированной даты
 */
function formatDate(date) {
  date = makeDateObj(date);

  if (null == date) return;

  return {
    year      : checkNumZero(date.getYear()),
    month     : checkNumZero(date.getMonth() + 1),
    date      : checkNumZero(date.getDate()),
    hours     : checkNumZero(date.getHours()),
    minutes   : checkNumZero(date.getMinutes()),
    monthNames: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    getDate   : function (monthname, full) { return this.date + ' ' + (this.getMonth(monthname)) + (full ? ' ' + this.year : ''); },
    getTime   : function () { return this.hours + ':' + this.minutes; },
    getMonth  : function (monthname) { return monthname ? this.monthNames[date.getMonth()] : this.month; }
  };
}

/**
 * Проверяем разность дат
 *
 * @param   from      - дата начала отсчёта
 * @param   to        - дата конца отсчёта
 * @returns {number}  - возвращаем статус:
 *                        1 - сегодня или в будущем
 *                        2 - вчера
 *                        3 - раньше, чем вчера
 *                        4 - год назад и более
 */
function getDiffDateStatus(from, to) {
  from = makeDateObj(from);
  to   = makeDateObj(to);

  if (null == from || null == to) return;

  from.setHours(0);
  from.setMinutes(0);
  from.setMilliseconds(0);

  var timeAgo = {
        year: from - 31536000000,
        day : from - 86400000
      },
      // сегодня или в будущем
      status  = 1;

  // раньше, чем год назад
  if (timeAgo.year > to)      status = 4;
  // раньше, чем вчера
  else if (timeAgo.day > to)  status = 3;
  // вчера
  else if (from > to)         status = 2;
  // в будущем
  //else if (from < to)         status = -1;

  return status;
}

function getDiffDate(from, to) {
  var diffStatus = getDiffDateStatus(from, to),
      frmTime    = formatDate(to),
      result;

  switch (diffStatus) {
    case 1:
      result = frmTime.getTime();
      break;
    case 2:
      result = 'вчера, ' + frmTime.getTime();
      break;
    case 3:
      result = frmTime.getDate(true);
      break;
    case 4:
      result = frmTime.getDate(true, true);
      break;
    default :
      break;
  }

  return result;
}

/**
 * Проверяем, чтобы date был обхектом класса Date()
 *
 * @param   date  - дата в строчной форме, в форме кол-ва миллисекунд или объект класса Date()
 * @returns {*}   - возвращаем объект даты или null
 */
function makeDateObj(date) {
  return (typeof date == 'object') ? date :
         (typeof date == 'string' || typeof date == 'number') ? new Date(date) : null;
}

/**
 * Делаем окно диалога активным
 *
 * Остальные деактивируем
 *
 * @param $obj - объект контейнера диалога
 */
function makeActiveDialog($obj) {
  for (var i = 0; i < $('.chat').length; i++)
    $('.chat')[i].classList.remove('active');

  $obj.classList.add('active');
  $('textarea', $obj).focus();
}

/**
 * Проверка на написание чисел с лидирующим нулём
 *
 * @param val   - значение
 * @param rate  - порядок числа, до которого приписываем нули.
 *                Необязательный аргумент, по умолчанию - 10
 * @returns {*} - форматированный вывод
 */
function checkNumZero(val, rate) {
  rate = rate || 10;

  if ((val / rate) < 1) { val = '0' + val; }

  return val;
}

/**
 * Проверяем используется ли Flash
 *
 * @returns {boolean}
 * @constructor
 */
function checkFlashUsed() {
  var Fplugin;

  try {
    Fplugin = navigator.plugins["Shockwave Flash"];
  } catch (e) {
    try {
      Fplugin = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
    } catch (err) {
      try {
        Fplugin = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
      } catch (err2) { }
    }
  }

  return (typeof Fplugin != 'undefined');
}

/**
 * Получение информации о браузере
 * @param ua - значение UserAgent браузера
 * @returns {{browser: (*|string), version: (*|string)}}
 */
function getBrowserInfo(ua) {
  ua = ua.toLowerCase();

  var match = /(opr)[ \/]([\w.]+)/.exec(ua) ||
      /(chrome)[ \/]([\w.]+)/.exec(ua) ||
      /(safari)[ \/]([\w.]+)/.exec(ua) ||
      /(seamonkey)[ \/]([\w.]+)/.exec(ua) ||
      /(firefox)[ \/]([\w.]+)/.exec(ua) ||
      /(webkit)[ \/]([\w.]+)/.exec(ua) ||
      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
      /(msie) ([\w.]+)/.exec(ua) ||
      (ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) ||
      [];

  if (ua.indexOf('trident/7.0') >= 0 && match[1] == 'mozilla') {
    match[1] = 'msie';
  } else if (match[1] == 'opr') {
    match[1] = 'opera';
  }

  return {
    browser: match[1] || '',
    version: match[2] || '0'
  };
}
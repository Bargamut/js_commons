/**
 * Created by bargamut on 01.08.16.
 */

/**
 * Селектор DOM-объектов
 *
 * @param el            - селектор элемента DOM-дерева
 * @param startNode     - объект или селектор родительского элемента
 * @returns {NodeList}  - возвращаем NodeList элементов, удовлетворяющих селектору el
 */
var $ = function (el, startNode) {
  startNode = ((typeof(startNode) == 'string') ? $(startNode)[0] : startNode) || document;

  var node = (typeof startNode != 'undefined') ? startNode.querySelectorAll(el) : [];

  return (node.length && node.length > 1) ? node : node[0];
};

/**
 * Навешивание обработчика события
 *
 * @param   obj       - объект обытия
 * @param   type      - тип события
 * @param   callback  - что делаем при событии
 * @returns {boolean} - возвращаем статус успеха
 */
function addListener(obj, type, callback) {
  if (typeof obj == 'undefined') return false;

  if (typeof obj.length != 'undefined' && obj.length > 1)
    for (var i = 0; i < obj.length; i++)
      addListener(obj[i], type, callback);
  else if (obj.addEventListener) {
    obj.addEventListener(type, callback, false);
    return true;
  } else if (obj.attachEvent) {
    obj.attachEvent('on' + type, callback);
    return true;
  }

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
        var isPressed = codes[i].some(function(item, i, arr) { return pressed[item]; });

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

      xmlhttp.open('GET', scripts[s].src, false);
      xmlhttp.send();

      if (xmlhttp.status == 200) eval(xmlhttp.responseText);
    } else if (scripts[s].innerHTML != '')
      eval(scripts[s].innerHTML);

    scripts[s].parentNode.removeChild(scripts[s]);
  }
}

/**
 * Является ли элемент частью класса
 *
 * @param elem
 * @param classname
 * @returns {boolean}
 */
function isElemOfClass(elem, classname) {
  if (!elem || !classname) return false;
  if (!(elem instanceof Object)) return false;
  if (elem.className === undefined) return false;

  var checkClasses = classname.split(' '),
      elemClasses  = elem.className.split(' ');

  for (var i = 0; i < checkClasses.length; i++) {
    if (checkClasses[i] == '') continue;
    if (elemClasses.indexOf(checkClasses[i]) == -1) return false;
  }

  return true;
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
    function _startDrag(e) {
      e = e || window.event;

      $elem.style.zIndex = 1000;

      if ($elem.parentNode.tagName != 'BODY') document.body.appendChild($elem);

      var $target = e.target,
          // Высчитываем координаты элемента относительно документа
          coords  = getCoords($elem);

      // Высчитываем положение курсора относительно элемента
      var shiftX = e.pageX - coords.left,
          shiftY = e.pageY - coords.top;

      if ($elem.parentNode.tagName != 'BODY') document.body.appendChild($elem);

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
       * @param e - объект события
       * @private
       */
      function _dropElem() {
        removeListener([document, $handler], 'mousemove', _moveAt);
        removeListener([document, $handler], 'mouseup', _dropElem);
      }

      _moveAt(e);

      addListener([document, $target], 'mousemove', _moveAt);
      addListener([document, $target], 'mouseup', _dropElem);
    }

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
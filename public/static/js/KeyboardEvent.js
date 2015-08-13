'use strict';

/**
 * 功能列表「編輯」選單相關的控制邏輯
 */
define(
  [
    'Apollo/Logger'
  ],
  function (logger) {

    // Detect browser, method from: http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
    var isIE = /*@cc_on!@*/false || !!document.documentMode;   // At least IE6

    // Detect Mac, method from: http://stackoverflow.com/questions/10527983/best-way-to-detect-mac-os-x-or-windows-computers-with-javascript-or-jquery
    var isMacPlatform = (navigator.platform === 'MacIntel' || navigator.platform === 'MacPPC' || navigator.platform === 'Mac68K') ? true : false;


    var GROUPED_KEYS = {'[ctrl]': 0, '[alt]': 1, '[shift]': 2, '[ctrl+alt]': 3, '[ctrl+shift]': 4, '[alt+shift]': 5, '[ctrl+alt+shift]': 6};
    // var GROUPED_KEYS = {'[ctrl]': 0, '[alt]': 1, '[shift]': 2, '[ctrl+alt]': 3, '[ctrl+shift]': 4, '[alt+shift]': 5, '[ctrl+alt+shift]': 6};
    var GROUPED_OBJ = {CTRL: '[ctrl]', ALT: '[alt]', SHIFT: '[shift]', CTRL_ALT: '[ctrl+alt]', CTRL_SHIFT: '[ctrl+shift]', ALT_SHIFT: '[alt+shift]', CTRL_ALT_SHIFT: '[ctrl+alt+shift]'};
    // var COMBINED_KEYS = {0: '[ctrl+alt]', 1: '[ctrl+shift]', 2: '[alt+shift]', 3: '[ctrl+alt+shift]'};
    var SP_KEYS_OBJ = {BACKSPACE: '[backspace]', ENTER: '[enter]', ESC: '[esc]', SPACE: '[space]', END: '[end]', HOME: '[home]', F1: '[f1]', F2: '[f2]',
                       F3: '[f3]', F4: '[f4]', F5: '[f5]', F6: '[f6]', F7: '[f7]', F8: '[f8]', F9: '[f9]', F10: '[f10]', F11: '[f11]', F12: '[f12]'};

    var SPECIAL_KEYCODES = {};
    var SYMBOL_KEYCODES = [];
    var KEYCODES_LISTENER = {};

    var IE_SPECIAL_KEYCODES = {
      // 8: '[backspace]', 13: '[enter]', 27: '[esc]', 32: '[space]', 35: '[end]', 36: '[home]', 112: '[f1]', 113: '[f2]', 114: '[f3]',
      // 115: '[f4]', 116: '[f5]', 117: '[f6]', 118: '[f7]', 119: '[f8]', 120: '[f9]', 121: '[f10]', 122: '[f1]', 123: '[f12]'
      '[backspace]': 8, '[enter]': 13, '[esc]': 27, '[space]': 32, '[end]': 35, '[home]': 36, '[f1]': 112, '[f2]': 113, '[f3]': 114,
      '[f4]': 115, '[f5]': 116, '[f6]': 117, '[f7]': 118, '[f8]': 119, '[f9]': 120, '[f10]': 121, '[f11]': 122, '[f12]': 123
    };
    var FIREFOX_SPECIAL_KEYCODES = {
      '[backspace]': 8, '[enter]': 13, '[esc]': 27, '[space]': 32, '[end]': 35, '[home]': 36, '[f1]': 112, '[f2]': 113, '[f3]': 114,
      '[f4]': 115, '[f5]': 116, '[f6]': 117, '[f7]': 118, '[f8]': 119, '[f9]': 120, '[f10]': 121, '[f11]': 122, '[f12]': 123
    };
    var CHROME_SPECIAL_KEYCODES = {
      '[backspace]': 8, '[enter]': 13, '[esc]': 27, '[space]': 32, '[end]': 35, '[home]': 36, '[f1]': 112, '[f2]': 113, '[f3]': 114,
      '[f4]': 115, '[f5]': 116, '[f6]': 117, '[f7]': 118, '[f8]': 119, '[f9]': 120, '[f10]': 121, '[f11]': 122, '[f12]': 123
    };
    var OPERA_SPECIAL_KEYCODES = {
      '[backspace]': 8, '[enter]': 13, '[esc]': 27, '[space]': 32, '[end]': 35, '[home]': 36, '[f1]': 112, '[f2]': 113, '[f3]': 114,
      '[f4]': 115, '[f5]': 116, '[f6]': 117, '[f7]': 118, '[f8]': 119, '[f9]': 120, '[f10]': 121, '[f11]': 122, '[f12]': 123
    };
    var SAFARI_SPECIAL_KEYCODES = {
      '[backspace]': 8, '[enter]': 13, '[esc]': 27, '[space]': 32, '[end]': 35, '[home]': 36, '[f1]': 112, '[f2]': 113, '[f3]': 114,
      '[f4]': 115, '[f5]': 116, '[f6]': 117, '[f7]': 118, '[f8]': 119, '[f9]': 120, '[f10]': 121, '[f11]': 122, '[f12]': 123
    };

    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
    // Reference: http://unixpapa.com/js/key.html
    // For testing KeyCode: http://www.asquare.net/javascript/tests/KeyCode.html  and  http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
    var SYMBOL_CHARACTERS =       [';','=',',','-','.','/','`','[','\\',']','\''];
    var IE_SYMBOL_KEYCODES =      [186,187,188,189,190,191,192,219, 220,221, 222];
    var FIREFOX_SYMBOL_KEYCODES = [ 59, 61,188,173,190,191,192,219, 220,221, 222];
    var CHROME_SYMBOL_KEYCODES =  [186,187,188,189,190,191,192,219, 220,221, 222];
    var OPERA_SYMBOL_KEYCODES =   [ 59, 61, 44, 45, 46, 47, 96, 91,  92, 93,  39];
    var SAFARI_SYMBOL_KEYCODES =  [186,187,188,189,190,191,192,219, 220,221, 222];

    if (isIE) { SPECIAL_KEYCODES = IE_SPECIAL_KEYCODES; SYMBOL_KEYCODES = IE_SYMBOL_KEYCODES; }
    if (isFirefox) { SPECIAL_KEYCODES = FIREFOX_SPECIAL_KEYCODES; SYMBOL_KEYCODES = FIREFOX_SYMBOL_KEYCODES; }
    if (isSafari) { SPECIAL_KEYCODES = SAFARI_SPECIAL_KEYCODES; SYMBOL_KEYCODES = SAFARI_SYMBOL_KEYCODES; }
    if (isChrome) { SPECIAL_KEYCODES = CHROME_SPECIAL_KEYCODES; SYMBOL_KEYCODES = CHROME_SYMBOL_KEYCODES; }
    if (isOpera) { SPECIAL_KEYCODES = OPERA_SPECIAL_KEYCODES; SYMBOL_KEYCODES = OPERA_SYMBOL_KEYCODES; }

    for (var key in SPECIAL_KEYCODES) {
      KEYCODES_LISTENER[SPECIAL_KEYCODES[key]] = key;
    }

    // in {category: usage category, usage: usage of hotkey, group: (key in GROUPED_KEYS), key: character, callback: function} format.
    var customEvents = [];
    // in {category: usage category, usage: usage of hotkey, group: (key in GROUPED_KEYS), key: (key in SPECIAL_KEYCODES), callback: function} format.
    var customSpEvents = [];

    /**
     * [addEvent description]
     * @param  {string} category
     * @param  {string} usage
     * @param  {string} group
     * @param  {string} ch
     * @param  {function} callback
     * @return {boolean}
     */
    var addEvent = function (category, usage, group, ch, callback) {
      if (typeof(callback) === 'undefined') {
        callback = function () {};
      }
      if (!checkUsageAndCategory(category, usage)) {
        return false;
      }
      if (!checkGroupIsValid(group)) {
        return false;
      }
      if (!checkCharIsValid(ch)) {
        return false;
      }
      if (!checkCallbackIsValid(callback)) {
        return false;
      }

      // Search input 'group' and 'ch'. If they are already exist, refuse to add this event.
      for (var i = 0; i < customEvents.length; ++i) {
        if (customEvents[i].group === group.toLowerCase() && customEvents[i].key === ch.toLowerCase()) {
          return false;
        }
      }
      customEvents.push({category: category, usage: usage, group: group.toLowerCase(), key: ch.toLowerCase(), callback: callback});
      return true;
    };

    var removeEvent = function (group, ch) {
      if (!checkGroupIsValid(group)) {
        return false;
      }
      if (!checkCharIsValid(ch)) {
        return false;
      }

      // Search input 'group' and 'ch'. If they are exist, remove this object from array.
      for (var i = 0; i < customEvents.length; ++i) {
        if (customEvents[i].group === group.toLowerCase() && customEvents[i].key === ch.toLowerCase()) {
          customEvents.splice(i, 1);
          return true;
        }
      }
      return false;
    };

    var addSpecialKeyEvent = function (category, usage, group, spKey, callback) {
      if (!checkUsageAndCategory(category, usage)) {
        return false;
      }
      if (!checkGroupIsValid(group)) {
        return false;
      }
      if (!checkSpecialKeyIsValid(spKey)) {
        return false;
      }
      if (!checkCallbackIsValid(callback)) {
        return false;
      }

      // Search input 'group' and 'spKey'. If they are already exist, refuse to add this event.
      for (var i = 0; i < customSpEvents.length; ++i) {
        if (customSpEvents[i].group === group.toLowerCase() && customSpEvents[i].key === spKey.toLowerCase()) {
          return false;
        }
      }
      customSpEvents.push({category: category, usage: usage, group: group.toLowerCase(), key: spKey.toLowerCase(), callback: callback});
      return true;
    };

    var removeSpecialKeyEvent = function (group, spKey) {
      if (!checkGroupIsValid(group)) {
        return false;
      }
      if (!checkSpecialKeyIsValid(spKey)) {
        return false;
      }

      // Search input 'group' and 'spKey'. If they are exist, remove this object from array.
      for (var i = 0; i < customSpEvents.length; ++i) {
        if (customSpEvents[i].group === group.toLowerCase() && customSpEvents[i].key === spKey.toLowerCase()) {
          customSpEvents.splice(i, 1);
          return true;
        }
      }
      return false;
    };

    var checkUsageAndCategory = function (category, usage) {
      if (typeof category !== 'string') {
        logger.error('Parameter type error. Please use \'string\' for \'category\'.');
        return false;
      }
      if (typeof usage !== 'string') {
        logger.error('Parameter type error. Please use \'string\' for \'usage\'.');
        return false;
      }
      return true;
    };

    var checkGroupIsValid = function (group) {
      if (typeof group !== 'string') {
        logger.error('Parameter type error. Please use \'string\' for \'group\'.');
        return false;
      }
      if (GROUPED_KEYS.hasOwnProperty(group.toLowerCase())) {
        return true;
      } else {
        logger.error('Not accepted group.');
        return false;
      }
    };

    var checkCharIsValid = function (ch) {
      if (typeof ch !== 'string') {
        logger.error('Parameter type error. Please use \'string\' for \'usage\'.');
        return false;
      }
      if (/^[a-zA-Z0-9,.;'`=\/\[\]\\\-]$/.test(ch)) {
        return true;
      } else {
        logger.error('Parameter type error. Please use 1 character for \'ch\'.');
        return false;
      }
    };

    var checkSpecialKeyIsValid = function (spKey) {
      if (typeof spKey !== 'string') {
        logger.error('Parameter type error. Please use \'string\' for \'spKey\'.');
        return false;
      }
      if (SPECIAL_KEYCODES.hasOwnProperty(spKey.toLowerCase())) {
        return true;
      } else {
        logger.error('Not accepted special key.');
        return false;
      }
    };

    var checkCallbackIsValid = function (callback) {
      if (typeof callback !== 'function') {
        logger.error('Parameter type error. Please use \'function\' for \'callback\'.');
        return false;
      }
      return true;
    };

    var excuteEvent = function (evt) {
      var spKey, ch, group;
      if (KEYCODES_LISTENER.hasOwnProperty(evt.keyCode)) {
        spKey = KEYCODES_LISTENER[evt.keyCode];
      } else {
        // Handle symbol key.
        if (SYMBOL_KEYCODES.indexOf(evt.keyCode) > -1) {
          ch = SYMBOL_CHARACTERS[SYMBOL_KEYCODES.indexOf(evt.keyCode)];
        } else {
          ch = String.fromCharCode(evt.keyCode).toLowerCase();
        }
      }

      var ctrlKeyPressed = (isMacPlatform) ? (evt.ctrlKey || evt.metaKey) : (evt.ctrlKey);
      // var ctrlKeyPressed = (evt.ctrlKey);

      if (ctrlKeyPressed && evt.altKey && evt.shiftKey) {
        group = GROUPED_OBJ.CTRL_ALT_SHIFT;
      } else if (ctrlKeyPressed && evt.altKey && !evt.shiftKey) {
        group = GROUPED_OBJ.CTRL_ALT;
      } else if (ctrlKeyPressed && !evt.altKey && evt.shiftKey) {
        group = GROUPED_OBJ.CTRL_SHIFT;
      } else if (!ctrlKeyPressed && evt.altKey && evt.shiftKey) {
        group = GROUPED_OBJ.ALT_SHIFT;
      } else if (ctrlKeyPressed && !evt.altKey && !evt.shiftKey) {
        group = GROUPED_OBJ.CTRL;
      } else if (!ctrlKeyPressed && evt.altKey && !evt.shiftKey) {
        group = GROUPED_OBJ.ALT;
      } else if (!ctrlKeyPressed && !evt.altKey && evt.shiftKey) {
        group = GROUPED_OBJ.SHIFT;
      }

      var i, registered, excuteFunction;

      if (group) {
        if (spKey) {
          for (i = 0; i < customSpEvents.length; ++i) {
            if (customSpEvents[i].group === group && customSpEvents[i].key === spKey) {
              registered = true;
              excuteFunction = customSpEvents[i].callback;
              break;
            }
          }
        } else if (ch) {
          for (i = 0; i < customEvents.length; ++i) {
            if (customEvents[i].group === group && customEvents[i].key === ch) {
              registered = true;
              excuteFunction = customEvents[i].callback;
              break;
            }
          }
        }
      }

      if (registered) {
        // 因為 ether calc 也用了 [Ctrl+x,c,v] 會造成事件失效，但還沒研究為什麼？
        // TODO: 改善這裡的寫法，找出 Ctrl + x,c,v 不會成功的原因
        if (group !== GROUPED_OBJ.CTRL || (ch !== 'x' && ch !== 'c' && ch !== 'v')) {
          evt.preventDefault();
        }

        evt.stopPropagation();
        excuteFunction();
        return;
      }
    };

    var getKeyMap = function () {
      var i, keyMap = {}, group, key, ucwords;

      ucwords = function (word) {
        logger.debug(word);
        return word.substring(0, 1).toUpperCase() + word.substring(1);
      };

      for (i = 0; i < customEvents.length; i++) {
        if (typeof(keyMap[customEvents[i].category]) === 'undefined') {
          keyMap[customEvents[i].category] = [];
        }
        group = customEvents[i].group.replace(/\[/gi, '').replace(/\]/gi, '').replace(/\b\w+\b/g, ucwords);
        if (isMacPlatform && group === 'Ctrl') {
          group = '⌘';
        }
        key = customEvents[i].key.replace(/\[/gi, '').replace(/\]/gi, '').replace(/\b\w+\b/g, ucwords);
        keyMap[customEvents[i].category].push(
          {
            usage: customEvents[i].usage,
            hotkey: group + '+' + key
          }
        );
      }
      for (i = 0; i < customSpEvents.length; i++) {
        if (typeof(keyMap[customSpEvents[i].category]) === 'undefined') {
          keyMap[customSpEvents[i].category] = [];
        }
        group = customSpEvents[i].group.replace(/\[/gi, '').replace(/\]/gi, '').replace(/\b\w+\b/g, ucwords);
        key = customSpEvents[i].key.replace(/\[/gi, '').replace(/\]/gi, '').replace(/\b\w+\b/g, ucwords);
        keyMap[customSpEvents[i].category].push(
          {
            usage: customSpEvents[i].usage,
            hotkey: group + '+' + key
          }
        );
      }
      return keyMap;
    };

    $(document).on('keydown', function (evt) {
      if (isMacPlatform) {
        // Mac platforms.
        if (!evt.ctrlKey && !evt.shiftKey && !evt.altKey && !evt.metaKey) {
          // Let event to original SocialCalc keydown event.
          // logger.debug('Excute Original SocialCalc event.');
          return;
        }
      } else {
        // Windows, Linux platforms.
        if (!evt.ctrlKey && !evt.shiftKey && !evt.altKey) {
          // Let event to original SocialCalc keydown event.
          // logger.debug('Excute Original SocialCalc event.');
          return;
        }
      }
      excuteEvent(evt);
    });

    return {
      addEvent: addEvent,
      removeEvent: removeEvent,
      addSpecialKeyEvent: addSpecialKeyEvent,
      removeSpecialKeyEvent: removeSpecialKeyEvent,
      getKeyMap: getKeyMap,
      MODKEY: GROUPED_OBJ,
      SPKEY: SP_KEYS_OBJ
    };
  }
);

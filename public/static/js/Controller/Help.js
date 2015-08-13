'use strict';

/**
 * 功能列表「說明」選單相關的控制邏輯
 */
define(
  [
    'Apollo/Topbar',
    'Apollo/UIManager',
    'Apollo/KeyboardEvent',
    'API/foxdocs-api'
  ],
  function (topbar, uiManager, keyEvt, foxdocsApi) {

    var hotkeyDialog, hotkeylist;

    /**
     * 動態產生快速鍵說明頁
     */
    var refreshHotkeyInfo = function () {
      var catl10nPrefix = 'hk-d-cat-';  // l10n prefix for shortcut category

      var i, category, keyMap = keyEvt.getKeyMap(), elementUl, elementLi, l10nId;
      hotkeylist.children().remove();

      for (category in keyMap) {
        l10nId = catl10nPrefix + category;

        $('<p>', {
          'data-l10n-id': l10nId,
          'text': L10n.get(l10nId)
        }).appendTo(hotkeylist);

        elementUl = $('<ul>');
        for (i = 0; i < keyMap[category].length; i++) {
          l10nId = keyMap[category][i].usage;

          elementLi = $('<li>', {
            'data-l10n-id': l10nId,
            'text': L10n.get(l10nId)
          });

          // elementSpan
          $('<span>', {
            'class':'hotkey',
            'text': keyMap[category][i].hotkey.replace(/\+/g, ' + ')
          }).appendTo(elementLi);

          elementUl.append(elementLi);
        }

        hotkeylist.append(elementUl);
      }
    };

    topbar.onload(function () {
      hotkeyDialog = $('#apollo-hotkey-info-dialog');
      hotkeylist = $('#apollo-hotkey-list');

      // 鍵盤快速鍵
      $('#apollo-menubar-hotkey').click(function () {
        refreshHotkeyInfo();
        uiManager.showDialog(hotkeyDialog);
      });

      // bind hot key
      keyEvt.addEvent('misc', 'hk-d-cm-show', keyEvt.MODKEY.CTRL, '/', function () {
        refreshHotkeyInfo();
        uiManager.showDialog(hotkeyDialog);
      });

      $('#apollo-menubar-about').click(function () {
        foxdocsApi.getVersion(function (error, result) {

          if (typeof(result.version) !== 'undefined') {
            $('#apollo-about-version').text(result.version);
          }
          uiManager.showDialog($('#apollo-about-dialog'));
        });
      });

      $('#apollo-about-change-lang').on('change', function () {
        console.log($(this).val());
        var parent = window.parent;
        var frames = parent.frames;
        var i;
        parent.L10n.setLanguage($(this).val());
        for(i = 0; i < frames.length; i++) {
          frames[i].L10n.setLanguage($(this).val());
        }
      });

    });

  }
);

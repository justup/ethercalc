'use strict';

/**
 * 功能列表「檢視」選單相關的控制邏輯
 */
define(
  [
    'Apollo/Topbar',
    'Apollo/EventListener'
  ],
  function (topbar, eventListener) {

    topbar.onload(function () {
      $('.apollo-menubar-rowpane').click(function () {
        var row = parseInt($(this).attr('data-num'), 10) + 1;
        var editor = SocialCalc.GetSpreadsheetControlObject().editor;
        editor.EditorScheduleSheetCommands('pane row ' + row, true, false);
      });

      $('.apollo-menubar-colpane').click(function () {
        var col = parseInt($(this).attr('data-num'), 10) + 1;
        var editor = SocialCalc.GetSpreadsheetControlObject().editor;
        editor.EditorScheduleSheetCommands('pane col ' + col, true, false);
      });
    });

    eventListener.addCellFocusListener(function (cellId) {
      var matches = cellId.match(/^([A-Z]+)(\d+)$/);
      $('.apollo-menubar-rowpane.n-X b').text(matches[2]);
      $('.apollo-menubar-rowpane.n-X').attr('data-num', matches[2]);
      $('.apollo-menubar-rowpane.n-X').attr('data-l10n-args', '{"rc":"' + matches[2] + '"}');
      $('.apollo-menubar-colpane.n-X b').text(matches[1]);
      $('.apollo-menubar-colpane.n-X').attr('data-num', matches[1].charCodeAt() - 64);
      $('.apollo-menubar-colpane.n-X').attr('data-l10n-args', '{"rc":"' + matches[1] + '"}');
    });
  }
);

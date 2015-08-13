'use strict';

/**
 * Apollo Event Listener (Singleton)
 *
 * EtherCalc Event 管理器，用來協調 Controller 與 UI 之間的事件管理，隔離 Apollo 的邏輯不要混在 EtherCalc 程式碼中。
 */
define(
  [
    'Apollo/Logger',
    'Apollo/Topbar'
  ],
  function (logger, topbar) {
    var cellFocusListeners = [];
    var socialCalc = null;

    // bind MoveECellCallback && RangeChangeCallback
    topbar.onload(function () {
      var editor = socialCalc.GetSpreadsheetControlObject().editor;

      // MoveECellCallback (apolloRangeMask)
      editor.RangeChangeCallback.apolloRangeMask = function (editor) {
        // draw select range
        var index, context = editor.context, cr;
        var leftUpRow = context.rowheight.length, leftUpCol = context.colwidth.length, rightDownRow = 0, rightDownCol = 0;

        for (index in context.highlights) {
          cr = SocialCalc.coordToCr(index);
          leftUpRow = (cr.row < leftUpRow) ? cr.row : leftUpRow;
          leftUpCol = (cr.col < leftUpCol) ? cr.col : leftUpCol;
          rightDownRow = (cr.row > rightDownRow) ? cr.row : rightDownRow;
          rightDownCol = (cr.col > rightDownCol) ? cr.col : rightDownCol;
        }
      };

      // MoveECellCallback (apolloEcell)
      editor.MoveECellCallback.apolloEcell = Apollo.EventListener.fireCellFocus;
    });


    /**
     * 初始化之後才可以正確取 SocialCalc
     *
     * @param {object} initSocialCalc SocialCalc
     */
    var init = function (initSocialCalc) {
      socialCalc = initSocialCalc;
    };

    /**
     * Fire cell focus event
     *
     * @param TableEditor editor
     */
    var fireCellFocus = function (editor) {
      var index, cellAttributes, cellId;

      cellId = editor.ecell.coord;
      cellAttributes = editor.context.sheetobj.EncodeCellAttributes(editor.ecell.coord);

      logger.debug('Fire cell focus event: ' + cellId);
      for (index in cellFocusListeners) {
        if (cellFocusListeners.hasOwnProperty(index)) {
          cellFocusListeners[index](
            cellId,
            cellAttributes,
            editor.context.sheetobj.cells[cellId]
          );
        }
      }
    };

    /**
     * Add cell focus listener
     *
     * @param   {function}  listener
     * @returns {boolean}   sucess or fail
     */
    var addCellFocusListener = function (listener) {
      if (typeof(listener) !== 'function') {
        logger.debug('Parameter not a function.');
        return false;
      }
      cellFocusListeners.push(listener);
      return true;
    };

    /**
     * Remove cell focus listener
     *
     * @param   {function}  listener
     * @returns {boolean}   sucess or fail
     */
    var removeCellFocusListener = function (listener) {
      var index;
      if (typeof(listener) !== 'function') {
        logger.debug('Parameter not a function.');
        return false;
      }
      for (index in cellFocusListeners) {
        if (cellFocusListeners.hasOwnProperty(index) && cellFocusListeners[index] === listener) {
          cellFocusListeners[index] = null;
          cellFocusListeners.splice(index, 1);
          return true;
        }
      }
      return false;
    };

    window.Apollo = window.Apollo || {};
    window.Apollo.EventListener = {
      init: init,
      fireCellFocus: fireCellFocus,
      addCellFocusListener: addCellFocusListener,
      removeCellFocusListener: removeCellFocusListener
    };
    return window.Apollo.EventListener;
  }
);

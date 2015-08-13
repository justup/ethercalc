'use strict';

/**
 * Apollo Mouse Left Click Handler
 */
define([
    'Apollo/Logger',
    'Apollo/Global',
    'Apollo/Headings'
  ],

  function (logger, global, headings) {

    // mouse click select row/col
    $('#te_toplevel').click(function (e) {

      var ssEditor = global.getSpreadsheetObject().editor;
      var pos, cx, cy, result;

      pos = SocialCalc.GetElementPositionWithScroll(ssEditor.toplevel);

      cx = e.clientX - pos.left;
      cy = e.clientY - pos.top;

      result = SocialCalc.GridMousePosition(ssEditor, cx, cy);

      if (result.colheader) {
        headings.columns.select(result.col);
      }

      if (result.rowheader) {
        headings.rows.select(result.row);
      }

    });

    return {
      init: null
    };
  }
);

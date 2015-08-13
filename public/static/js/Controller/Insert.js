'use strict';

/**
 * 功能列表「插入」選單相關的控制邏輯
 */
define(
  [
    'Apollo/Utility',
    'Apollo/Topbar',
    'Apollo/UIManager',
    'Apollo/Handler/FormulaActs',
    'Apollo/Handler/CommentActs',
    'Apollo/EventListener',
    'Apollo/Handler/InsertLink'
  ],
  function (utility, topbar, uiManager, formulaActs, commentActs, evtListener, insertLink) {

    var scCtrl = SocialCalc.GetSpreadsheetControlObject();
    // var multiUpDom = document.getElementById('apollo-menubar-insertrow-multi-up');
    // var multiDownDom = document.getElementById('apollo-menubar-insertrow-multi-down');
    // var multiLeftDom = document.getElementById('apollo-menubar-insertcol-multi-left');
    // var multiRightDom = document.getElementById('apollo-menubar-insertcol-multi-right');

    var insertRowUp = function () {

      var cmdstr = 'insertrow ';
      var s = scCtrl;
      // Just like original EtherCalc.
      var cellID;
      if (s.editor.range.hasrange) {
        // Get left-top cell ID.
        cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top);
        cmdstr += cellID;
      } else {
        cellID = SocialCalc.crToCoord(s.editor.ecell.col, s.editor.ecell.row);
        cmdstr += cellID;
      }
      s.editor.EditorScheduleSheetCommands(cmdstr, true, true);

      // recalc range (ecell)
      if (s.editor.range.hasrange) {
        var saveRange = s.editor.range;
        var cr = SocialCalc.coordToCr(saveRange.anchorcoord);
        s.editor.RangeRemove();
        s.editor.MoveECell(SocialCalc.crToCoord(s.editor.ecell.col, s.editor.ecell.row + 1));
        s.editor.range.anchorrow = cr.row + 1;
        s.editor.range.anchorcol = cr.col;
        s.editor.range.anchorcoord = SocialCalc.crToCoord(cr.col, cr.row + 1);
        s.editor.range.top = saveRange.top + 1;
        s.editor.range.left = saveRange.left;
        s.editor.range.bottom = saveRange.bottom + 1;
        s.editor.range.right = saveRange.right;
        s.editor.range.hasrange = true;
        s.editor.RangeExtend();
      } else {
        s.editor.MoveECell(SocialCalc.crToCoord(s.editor.ecell.col, s.editor.ecell.row + 1));
      }
    };

    var insertRowDown = function () {
      var cmdstr = 'insertrow ';
      var s = scCtrl;
      var cellID;
      if (s.editor.range.hasrange) {
        cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.bottom + 1);
        cmdstr += cellID;
      } else {
        // Simulate user is using insertrow on next row.
        cellID = SocialCalc.crToCoord(s.editor.ecell.col, s.editor.ecell.row + 1);
        cmdstr += cellID;
      }
      s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
    };

    var insertColLeft = function () {
      var cmdstr = 'insertcol ';
      var s = scCtrl;
      // Just like original EtherCalc.
      var cellID;
      if (s.editor.range.hasrange) {
        // Get left-top cell ID.
        cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top);
        cmdstr += cellID;
      } else {
        cellID = SocialCalc.crToCoord(s.editor.ecell.col, s.editor.ecell.row);
        cmdstr += cellID;
      }
      s.editor.EditorScheduleSheetCommands(cmdstr, true, false);

      // recalc range (ecell)
      if (s.editor.range.hasrange) {
        var saveRange = s.editor.range;
        var cr = SocialCalc.coordToCr(saveRange.anchorcoord);
        s.editor.RangeRemove();
        s.editor.MoveECell(SocialCalc.crToCoord(s.editor.ecell.col + 1, s.editor.ecell.row));
        s.editor.range.anchorrow = cr.row;
        s.editor.range.anchorcol = cr.col + 1;
        s.editor.range.anchorcoord = SocialCalc.crToCoord(cr.col + 1, cr.row);
        s.editor.range.top = saveRange.top;
        s.editor.range.left = saveRange.left + 1;
        s.editor.range.bottom = saveRange.bottom;
        s.editor.range.right = saveRange.right + 1;
        s.editor.range.hasrange = true;
        s.editor.RangeExtend();
      } else {
        s.editor.MoveECell(SocialCalc.crToCoord(s.editor.ecell.col + 1, s.editor.ecell.row));
      }
    };

    var insertColRight = function () {
      var cmdstr = 'insertcol ';
      var s = scCtrl;
      var cellID;
      if (s.editor.range.hasrange) {
        cellID = SocialCalc.crToCoord(s.editor.range.right + 1, s.editor.range.top);
        cmdstr += cellID;
      } else {
        // Simulate user is using insertcol on next column.
        cellID = SocialCalc.crToCoord(s.editor.ecell.col + 1, s.editor.ecell.row);
        cmdstr += cellID;
      }
      s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
    };

    // 向上、向下、向左、向右 插入 1 列（欄）。
    Apollo.Topbar.onload(function () {
      $('#apollo-menubar-insertrow-up').click(insertRowUp);

      $('#apollo-menubar-insertrow-down').click(insertRowDown);

      $('#apollo-menubar-insertcol-left').click(insertColLeft);

      $('#apollo-menubar-insertcol-right').click(insertColRight);

      // 向上、向下、向左、向右 插入 多 列（欄）。
      $('#apollo-menubar-insertrow-multi-up').click(function () {
        if (scCtrl.editor.range.hasrange) {
          var cmdstr = 'insertrow ';
          var rangeH = scCtrl.editor.range.bottom - scCtrl.editor.range.top + 1;
          if (rangeH <= 1) {
            return;
          }
          var cellID = SocialCalc.crToCoord(scCtrl.editor.range.left, scCtrl.editor.range.top);
          cmdstr += cellID;
          var insertStr = cmdstr;
          for (var i = 1; i < rangeH; ++i) {
            cmdstr += '\n' + insertStr;
          }
          scCtrl.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      });

      $('#apollo-menubar-insertrow-multi-down').click(function () {
        if (scCtrl.editor.range.hasrange) {
          var cmdstr = 'insertrow ';
          var rangeH = scCtrl.editor.range.bottom - scCtrl.editor.range.top + 1;
          if (rangeH <= 1) {
            return;
          }
          var cellID = SocialCalc.crToCoord(scCtrl.editor.range.left, scCtrl.editor.range.bottom + 1);
          cmdstr += cellID;
          var insertStr = cmdstr;
          for (var i = 1; i < rangeH; ++i) {
            cmdstr += '\n' + insertStr;
          }
          scCtrl.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      });

      $('#apollo-menubar-insertcol-multi-left').click(function () {
        if (scCtrl.editor.range.hasrange) {
          var cmdstr = 'insertcol ';
          var rangeW = scCtrl.editor.range.right - scCtrl.editor.range.left + 1;
          if (rangeW <= 1) {
            return;
          }
          var cellID = SocialCalc.crToCoord(scCtrl.editor.range.left, scCtrl.editor.range.top);
          cmdstr += cellID;
          var insertStr = cmdstr;
          for (var i = 1; i < rangeW; ++i) {
            cmdstr += '\n' + insertStr;
          }
          scCtrl.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      });

      $('#apollo-menubar-insertcol-multi-right').click(function () {
        if (scCtrl.editor.range.hasrange) {
          var cmdstr = 'insertcol ';
          var rangeW = scCtrl.editor.range.right - scCtrl.editor.range.left + 1;
          if (rangeW <= 1) {
            return;
          }
          var cellID = SocialCalc.crToCoord(scCtrl.editor.range.right + 1, scCtrl.editor.range.top);
          cmdstr += cellID;
          var insertStr = cmdstr;
          for (var i = 1; i < rangeW; ++i) {
            cmdstr += '\n' + insertStr;
          }
          scCtrl.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      });
    });

    Apollo.EventListener.addCellFocusListener(function (cellId) {

      if (scCtrl.editor.range.hasrange) {
        var cr = SocialCalc.coordToCr(cellId);
        var rangeH = scCtrl.editor.range.bottom - scCtrl.editor.range.top + 1;
        var rangeW = scCtrl.editor.range.right - scCtrl.editor.range.left + 1;
        // Check if focus cell ID is in current range.
        if (cr.row < scCtrl.editor.range.top || cr.row > scCtrl.editor.range.bottom) {
          if (cr.row < scCtrl.editor.range.top) { rangeH += (scCtrl.editor.range.top - cr.row); }
          if (cr.row > scCtrl.editor.range.bottom) { rangeH += (cr.row - scCtrl.editor.range.bottom); }
        } else {
          if (cr.row <= scCtrl.editor.range.bottom) {
            // Focus cell move from bottom to top.
            rangeH = cr.row - scCtrl.editor.range.top + 1;
          } else if (cr.row >= scCtrl.editor.range.top) {
            // Focus cell move from top to bottom.
            rangeH = scCtrl.editor.range.bottom - cr.row + 1;
          }
        }
        if (cr.col < scCtrl.editor.range.left || cr.col > scCtrl.editor.range.right) {
          if (cr.col < scCtrl.editor.range.left) { rangeW += (scCtrl.editor.range.left - cr.col); }
          if (cr.col > scCtrl.editor.range.right) { rangeW += (cr.col - scCtrl.editor.range.right); }
        } else {
          if (cr.col <= scCtrl.editor.range.right) {
            // Focus cell move from right to left.
            rangeW = cr.col - scCtrl.editor.range.left + 1;
          } else if (cr.col >= scCtrl.editor.range.left) {
            // Focus cell move from left to right.
            rangeW = scCtrl.editor.range.right - cr.col + 1;
          }
        }
      //   if (rangeH > 1) {
      //     // multiUpDom.parentNode.style.display = 'block';
      //     // multiDownDom.parentNode.style.display = 'block';
      //     // multiUpDom.innerHTML = L10n.get('m-i-mr-up', { rc: rangeH });
      //     // multiUpDom.setAttribute('data-l10n-args', '{"rc":"' + rangeH + '"}');
      //     // multiDownDom.innerHTML = L10n.get('m-i-mr-down', { rc: rangeH });
      //     // multiDownDom.setAttribute('data-l10n-args', '{"rc":"' + rangeH + '"}');
      //   } else {
      //     // multiUpDom.parentNode.style.display = 'none';
      //     // multiDownDom.parentNode.style.display = 'none';
      //   }
      //   if (rangeW > 1) {
      //     // multiLeftDom.parentNode.style.display = 'block';
      //     // multiRightDom.parentNode.style.display = 'block';
      //     // multiLeftDom.innerHTML = L10n.get('m-i-mc-left', { rc: rangeW });
      //     // multiLeftDom.setAttribute('data-l10n-args', '{"rc":"' + rangeW + '"}');
      //     // multiRightDom.innerHTML = L10n.get('m-i-mc-right', { rc: rangeW });
      //     // multiRightDom.setAttribute('data-l10n-args', '{"rc":"' + rangeW + '"}');
      //   } else {
      //     // multiLeftDom.parentNode.style.display = 'none';
      //     // multiRightDom.parentNode.style.display = 'none';
      //   }
      // } else {

      //   // multiUpDom.parentNode.style.display = 'none';
      //   // multiDownDom.parentNode.style.display = 'none';
      //   // multiLeftDom.parentNode.style.display = 'none';
      //   // multiRightDom.parentNode.style.display = 'none';
      }
    });

    Apollo.Topbar.onload(function () {

      $('#apollo-menubar-insert-note').click(commentActs.clickDisplayEditor);
      $('#apollo-toolbar-insert-note').click(commentActs.clickDisplayEditor);
      $('#te_griddiv').mouseover(commentActs.mouseoverDisplayEditor);


      $('#apollo-menubar-insert-formulasum, #apollo-toolbar-insert-formulasum').click(formulaActs.insertSum);
      $('#apollo-menubar-insert-formulaaverage, #apollo-toolbar-insert-formulaaverage').click(formulaActs.insertAverage);
      $('#apollo-menubar-insert-formulacount, #apollo-toolbar-insert-formulacount').click(formulaActs.insertCount);
      $('#apollo-menubar-insert-formulamax, #apollo-toolbar-insert-formulamax').click(formulaActs.insertMax);
      $('#apollo-menubar-insert-formulamin, #apollo-toolbar-insert-formulamin').click(formulaActs.insertMin);
      $('#apollo-menubar-insert-formulas, #apollo-toolbar-insert-formulas').click(formulaActs.insertFormulas);

      $('#apollo-toolbar-insert-link').click(insertLink.showDialog);
      $('#apollo-menubar-insert-link').click(insertLink.showDialog);
      $('#apollo-link-info-change-info').click(insertLink.changeLinkInfo);
      $('#apollo-link-info-remove-link').click(insertLink.removeLink);
    });

    Apollo.EventListener.addCellFocusListener(function (cellID, attributes) {

      // close comment Editor
      commentActs.closeEditor();

      // Hide Link Editor and Link Info
      insertLink.hideDialog();
      insertLink.hideLinkInfo();

      // Show link info if needed.
      if (attributes.textformat.val === 'text-link') {
        insertLink.showLinkInfo(cellID);
      }
    });

    return {
      insertRowUp: insertRowUp,
      insertRowDown: insertRowDown,
      insertColLeft: insertColLeft,
      insertColRight: insertColRight
    };
  }
);

'use strict';

/**
 * 功能列表「編輯」選單相關的控制邏輯
 */
define(
  [
    'Apollo/Handler/Clipboard',
    'Apollo/Global',
    'Apollo/Topbar',
    'Apollo/EventListener',
    'Apollo/Handler/SearchAndReplace',
    'Apollo/Logger',
    'Apollo/Handler/DeleteActs',
    'Apollo/Handler/paintFormatActs',
    'Apollo/KeyboardEvent'
  ],
  function (clipboard, global, topbar, evtListener, searchAndReplace, logger, deleteActs, paintFormatActs, keyboardEvent) {

    topbar.onload(function () {

      // 剪下
      $('#apollo-menubar-cmd-cut').click(clipboard.cutHandler);

      // 複製
      $('#apollo-menubar-cmd-copy').click(clipboard.copyHandler);

      // 貼上
      $('#apollo-menubar-cmd-paste').click(clipboard.pasteHandler);

      // bind hot key (不傳入 callback 僅建立選單，實作 ethercalc 已經有了)
      keyboardEvent.addEvent('edit', 'm-e-cut', keyboardEvent.MODKEY.CTRL, 'x');
      keyboardEvent.addEvent('edit', 'm-e-copy', keyboardEvent.MODKEY.CTRL, 'c');
      keyboardEvent.addEvent('edit', 'm-e-paste', keyboardEvent.MODKEY.CTRL, 'v');
      keyboardEvent.addEvent('edit', 'm-e-undo', keyboardEvent.MODKEY.CTRL, 'z');

    });

    // for simple actions: undo, redo, deleterow(col)
    // which can be done simply via SocialCalc.DoCmd(ele, cmd)
    var simpleCmd = {
      undo:'undo',
      redo:'redo',
      delrow:'deleterow',
      delcol:'deletecol',

      // @param {string} cmd  action's command
      Do:function(cmd) {
        // the first arg in DoCmd (triggered elem) seems useless
        SocialCalc.DoCmd(null, cmd);
      }
    };

    // bind manubar and(or) toolbar actions for simple commands
    topbar.onload(function bindSimpleCmdBtns() {
      var p1, p2, btns, delrcRang, delrcText, delrcAttr, sheetStack, statusfunc, eobj;

      // selector prefix
      p1 = topbar.idPrefix + 'cmd-';
      p2 = topbar.idPrefix + 'menubar-cmd-';

      btns = {
        undo:$('.' + p1 + simpleCmd.undo),
        redo:$('.' + p1 + simpleCmd.redo),
        delrow:$('#' + p2 + simpleCmd.delrow),
        delcol:$('#' + p2 + simpleCmd.delcol),

        disableItems: function(nodes, disable) {

          // console.log(nodes);

          var cls = 'disabled';
          if(disable) {
            // console.log('disabled');
            $(nodes).addClass(cls);
          }
          else {
            // console.log('enabled');
            $(nodes).removeClass(cls);
          }
        }
      };
      btns.undoli = btns.undo;
      btns.redoli = btns.redo;
      // build deleterow[col] rang str
      delrcRang = function(rowOrCol, start, end) {
        var r, sp = '&nbsp;'; // space

        if (rowOrCol === 'c') {
          start = SocialCalc.rcColname(start);
          end = (end) ? SocialCalc.rcColname(end) : null;
        }

        r = start; // range
        if (end && start !== end) {
          r = r + sp + '-' + sp + end;
        }
        return r;
      };

      // build description for menu deleterow[col]
      delrcText = function (rowOrCol, start, end) {
        var l10nId = (rowOrCol === 'r') ? 'm-e-dr': 'm-e-dc'; // row or column
        return L10n.get(l10nId, { rc: delrcRang(rowOrCol, start, end) });
      };

      delrcAttr = function (rowOrCol, start, end) {
        return '{"rc":"' + delrcRang(rowOrCol, start, end) + '"}';
      };

      sheetStack = function() { return (SocialCalc.GetSpreadsheetControlObject().sheet).changes; };

      (btns.undo).click(simpleCmd.Do.bind(null, simpleCmd.undo));
      (btns.redo).click(simpleCmd.Do.bind(null, simpleCmd.redo));
      (btns.delrow).click(simpleCmd.Do.bind(null, simpleCmd.delrow));
      (btns.delcol).click(simpleCmd.Do.bind(null, simpleCmd.delcol));

      statusfunc = function (editor, status) {
        var menuDelrow, menuDelcol, stk, disableUndo, disableRedo;

        // update delrow(col) menu state
        menuDelrow = btns.delrow;
        menuDelcol = btns.delcol;

        switch(status) {
          case 'moveecell':
          case 'rangechange':
          case 'doneposcalc':

            if(!editor.range.hasrange && editor.ecell) {
              $('#cm-remove-row').html(delrcText('r', editor.ecell.row));
              menuDelrow.html(delrcText('r', editor.ecell.row));
              menuDelrow.attr('data-l10n-args', delrcAttr('r', editor.ecell.row));
              $('#cm-remove-col').html(delrcText('c', editor.ecell.col));
              menuDelcol.html(delrcText('c', editor.ecell.col));
              menuDelcol.attr('data-l10n-args', delrcAttr('c', editor.ecell.col));
              break;
            }

            if(editor.range.hasrange) {
              $('#cm-remove-row').html(delrcText('r', editor.range.top, editor.range.bottom));
              menuDelrow.html(delrcText('r', editor.range.top, editor.range.bottom));
              menuDelrow.attr('data-l10n-args', delrcAttr('r', editor.range.top, editor.range.bottom));
              $('#cm-remove-col').html(delrcText('c', editor.range.left, editor.range.right));
              menuDelcol.html(delrcText('c', editor.range.left, editor.range.right));
              menuDelcol.attr('data-l10n-args', delrcAttr('c', editor.range.left, editor.range.right));
            }

          break;
        }

        // update un(re)do btns

        stk = sheetStack();
        disableUndo = function(disable) { btns.disableItems(btns.undoli, disable); };
        disableRedo = function(disable) { btns.disableItems(btns.redoli, disable); };

        // stack empty
        if (stk.stack.length < 1) {
          disableUndo(true);
          disableRedo(true);
          return;
        }

        // topmost move
        if (stk.tos === (stk.stack.length - 1)) {
          disableUndo(false);
          disableRedo(true);
        }
        // reach the stack bottom
        else if (stk.tos < 0) {
          disableUndo(true);
          disableRedo(false);
        }
        else {
          disableUndo(false);
          disableRedo(false);
        }
      };

      eobj = global.getSpreadsheetObject().editor;
      eobj.StatusCallback.menubarEditor = {
        func: statusfunc,
        params: {}
      };

      // manually fire the first update
      statusfunc(eobj, 'moveecell');
    });


    topbar.onload(function () {

      $('#apollo-menubar-empty-value').click(deleteActs.emptyVal);
      $('#apollo-menubar-clear-note').click(deleteActs.clearComment);
      $('#apollo-menubar-search-and-replace').click(searchAndReplace.showDialog);
    });

    var specialPasteHandler = (function () {
      var extpastestart = 'startcmdextension extpaste %R %T',
          pastestart = 'paste %R %T';

      /**
       * @param {string} cmdstr   {extpastestart or pastestart}
       * @param {string} cmdtype  {argument of command}
       */
      function doPasteSpecial(cmdstr, cmdtp) {
        var editor = global.getSpreadsheetObject().editor;

        // add range and cmdtype
        cmdstr = cmdstr.replace(/%R/g, global.getEditorSelectionLiteral(editor));
        cmdstr = cmdstr.replace(/%T/g, cmdtp);

        logger.debug('doPasteSpecial: ' + cmdstr);
        editor.EditorScheduleSheetCommands(cmdstr, true, false);
      }

      return {
        pasteVal: function () { doPasteSpecial(extpastestart, 'values');  },
        pasteAllxBorder: function () {  doPasteSpecial(extpastestart, 'allxborders');  },
        pasteFormula: function () {  doPasteSpecial(pastestart, 'formulas'); },
        pasteFormat: function () {  doPasteSpecial(pastestart, 'formats');  }
      };

    })();

    // bind manubar actions for special paste
    topbar.onload(function() {
      var menuPrefix = topbar.idPrefix + 'menubar-';
      $('#' + menuPrefix + 'pastevalue').click(specialPasteHandler.pasteVal);
      $('#' + menuPrefix + 'pastexborder').click(specialPasteHandler.pasteAllxBorder);
      $('#' + menuPrefix + 'cmd-pasteformula').click(specialPasteHandler.pasteFormula);
      $('#' + menuPrefix + 'cmd-pasteformat').click(specialPasteHandler.pasteFormat);
    });


    // bind paint format
    topbar.onload(function() {
      paintFormatActs.initPF('#apollo-toolbar-paint-format');
    });

    // exposed methods
    return {
      specialPaste: specialPasteHandler,
      delrow: simpleCmd.Do.bind(null, simpleCmd.delrow),
      delcol: simpleCmd.Do.bind(null, simpleCmd.delcol)
    };

  }
);

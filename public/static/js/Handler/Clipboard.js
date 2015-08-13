'use strict';

/**
 * 剪貼簿相關處理程式
 */
define(
  [
    'Apollo/Global'
  ],
  function (global) {

    /**
     * 動態建立 copy 或 cut 功能回呼 (從socialcalctableeditor.js複製過來的程式碼)
     *
     * @param {string} charname 剪下或貼上 [ctrl-c] | [ctrl-x]
     * @returns {function}
     */
    var saveToClipboardFnFactory = function (charname) {
      return function () {
        // repeat from socialcalctableeditor.js
        var sheetControl = global.getSpreadsheetObject();
        var editor = sheetControl.editor, ta, cell, position, sel, cliptext, cmd;
        ta = editor.pasteTextarea;
        ta.value = '';
        cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
        if (cell) {
          position = SocialCalc.GetElementPosition(cell.element);
          ta.style.left = (position.left - 1) + 'px';
          ta.style.top = (position.top - 1) + 'px';
        }
        if (editor.range.hasrange) {
          sel = SocialCalc.crToCoord(editor.range.left, editor.range.top) +
            ':' + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
        }
        else {
          sel = editor.ecell.coord;
        }

        // get what to copy to clipboard
        cliptext = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.CreateSheetSave(editor.context.sheetobj, sel), 'tab');

        if (charname === '[ctrl-c]' || editor.noEdit || editor.ECellReadonly()) { // if copy or cut but in no edit
          cmd = 'copy ' + sel + ' formulas';
        }
        else { // [ctrl-x]
          cmd = 'cut ' + sel + ' formulas';
        }
        editor.EditorScheduleSheetCommands(cmd, true, false); // queue up command to put on SocialCalc clipboard

        ta.style.display = 'block';
        ta.value = cliptext; // must follow "block" setting for Webkit
        ta.focus();
        ta.select();
        window.setTimeout(function () {
          var ta = editor.pasteTextarea;
          ta.blur();
          ta.style.display = 'none';
          SocialCalc.KeyboardFocus();
        }, 10);
      };
    };

    return {
      /**
       * 貼上功能 (從socialcalctableeditor.js複製過來的程式碼)
       *
       * @returns {boolean}
       */
      pasteHandler: function () {
        // repeat from socialcalctableeditor.js
        var sheetControl = global.getSpreadsheetObject();
        var editor = sheetControl.editor, ta, cell, position;

        if (editor.noEdit || editor.ECellReadonly()) {
          return true;
        } // not if no edit
        ta = editor.pasteTextarea;
        ta.value = '';
        cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
        if (cell) {
          position = SocialCalc.GetElementPosition(cell.element);
          ta.style.left = (position.left - 1) + 'px';
          ta.style.top = (position.top - 1) + 'px';
        }
        ta.style.display = 'block';
        ta.value = '';  // must follow "block" setting for Webkit
        ta.focus();

        window.setTimeout(function () {
          var cr;
          if (editor.range.hasrange) {
            // 自行實作複製單一儲存格，可以整批區域貼上的能力
            var clipsheet = new SocialCalc.Sheet();
            clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
            var matches = clipsheet.copiedfrom.match(/(.+):(.+)/);
            if (matches !== null && matches[1] === matches[2]) {
              cr = SocialCalc.crToCoord(editor.range.left, editor.range.top) +
                ':' + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
            } else {
              cr = SocialCalc.crToCoord(editor.range.left, editor.range.top);
            }
          } else {
            cr = editor.ecell.coord;
          }

          var command = 'paste ' + cr + ' all' + '\n' + 'paste ' + cr + ' formulas';
          window.spreadsheet.editor.EditorScheduleSheetCommands(command, true, false);

          SocialCalc.KeyboardFocus();
        }, 10);
      },
      copyHandler: saveToClipboardFnFactory('[ctrl-c]'),
      cutHandler: saveToClipboardFnFactory('[ctrl-x]')
    };

  }
);

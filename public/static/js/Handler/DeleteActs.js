'use strict';

/**
 * 清除、刪除相關處理程式
 *
 * 刪除值
 * delete cmd
 * 'set %C empty';       將值與公式刪除，但會保留格式與備註(G:刪除值、keyboard Del, E:keyboard Del)
 * 'erase %C formulas';  將值、公式與備註刪除，但會保留格式(E:刪除值)
 * 'erase %C all';       將值、公式、格式與備註統統刪除
 *
 */
define(
  [
    'Apollo/Global'
  ],
  function (global) {

    var spreadsheet = global.getSpreadsheetObject(),
        editor = spreadsheet.editor;
    var deleteAct, clearComment;

    deleteAct = function (cmd) {
      return function () {
        if (!editor.noEdit && !editor.ECellReadonly()) {
          spreadsheet.ExecuteCommand(cmd, '');
        }
      };
    };

    clearComment = function () {
      return function () {
        if (!editor.noEdit && !editor.ECellReadonly()) {
          editor.EditorApplySetCommandsToRange('comment', '');
        }
      };
    };

    return {
      emptyVal: deleteAct('set %C empty'),
      deleteVal: deleteAct('erase %C formulas'),
      eraseVal: deleteAct('erase %C all'),
      clearComment: clearComment()
    };
  }
);

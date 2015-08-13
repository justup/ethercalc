'use strict';

/**
 * Global Variable (Singleton)
 *
 * 管理全域變數，避免使用 window.XXX
 */
define(function () {

  var fileId;
  var parentId;
  var sheetId;
  var readonly = false;

  return {

    /**
     * Get Spreadsheet Viewer or Control Object
     *
     * @returns {SpreadsheetViewer}  for readonly sheet
     *          {SpreadsheetControl} for writable sheet
     */
    getSpreadsheetObject: function () {
      if (!SocialCalc) {
        return false;
      }

      if (readonly) {
        return SocialCalc.GetSpreadsheetViewerObject();
      }

      return SocialCalc.GetSpreadsheetControlObject();
    },

    /**
     * Get text literal of the selected cells
     *
     * @param {TableEditor} editor
     * @returns {string}  ex: A1:A12, A1
     */
    getEditorSelectionLiteral: function (editor) {
      if (!editor) {
        return false;
      }

      var range = editor.range;
      if (range.hasrange) {
        return SocialCalc.crToCoord(range.left, range.top) + ':' + SocialCalc.crToCoord(range.right, range.bottom);
      }

      if (editor.ecell) {
        return editor.ecell.coord;
      }

      return false;
    },

    /**
     * Set Readonly
     *
     * @param {bool} ro
     */
    setReadOnly: function (ro) {
      readonly = ro;
    },

    /**
     * get Readonly
     *
     * @param {bool} ro
     */
    getReadOnly: function () {
      return readonly;
    },

    /**
     * 取得當下試算表的 File ID
     *
     * @returns {string}
     */
    getFileId: function () {
      return fileId;
    },

    /**
     * 設定當下試算表的 File ID
     *
     * @param {string} newFileId
     */
    setFileId: function (newFileId) {
      fileId = newFileId;
    },

    /**
     * 取得當下試算表的 Sheet ID, ex: {FILE_ID}.1 ~ N
     *
     * @returns {string}
     */
    getSheetId: function () {
      return sheetId;
    },

    /**
     * 設定當下試算表的 Sheet ID
     *
     * @param {string} newSheetId ex: {FILE_ID}.1 ~ N
     */
    setSheetId: function (newSheetId) {
      sheetId = newSheetId;
    },

    /**
     * 取得當下試算表的 Parent ID (所在目錄)
     *
     * @returns {string}
     */
    getParentId: function () {
      return parentId;
    },

    /**
     * 設定當下試算表的 Parent ID (所在目錄)
     *
     * @param {string} newParentId
     */
    setParentId: function (newParentId) {
      parentId = newParentId;
    }
  };
});

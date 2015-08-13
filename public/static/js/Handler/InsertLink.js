'use strict';

/**
 * 插入連結相關處理程式。
 */
define(
  [
    'Apollo/Logger',
    'Apollo/KeyboardEvent',
    'Apollo/Global'
  ],
  function (logger, keyEvt, global) {
    var ctrl = global.getSpreadsheetObject();
    var editor = ctrl.editor;
    var keydownObj;

    // Link settings
    var dialogDOM = document.getElementById('link-editor');
    dialogDOM.innerHTML = document.getElementById('apollo-link-dialog-template').innerHTML;
    var removedNode = document.getElementById('apollo-link-dialog-template');
    removedNode.parentNode.removeChild(removedNode);
    var linkDescInput = document.getElementById('apollo-link-text-field');
    var linkUrlInput = document.getElementById('apollo-link-url-field');
    var applyLinkBtn = document.getElementById('apply-link-button');

    // Link info.
    var linkInfoDOM = document.getElementById('link-info');
    linkInfoDOM.innerHTML = document.getElementById('apollo-link-info-template').innerHTML;
    removedNode = document.getElementById('apollo-link-info-template');
    removedNode.parentNode.removeChild(removedNode);
    var linkInfoUrlDOM = document.getElementById('apollo-link-info-url');
    // var changeLinkInfoDOM = document.getElementById('apollo-link-info-change-info');
    // var removeLinkInfoDOM = document.getElementById('apollo-link-info-remove-link');

    /**
     * Show Link Setting dialog. 顯示「連結設定」的視窗。
     * @return {function}  Function to show dialog. 顯示「連結設定」視窗的 function。
     */
    var showDialog = function () {
      return function () {
        if (linkInfoDOM.style.display === 'block') {
          linkInfoDOM.style.display = 'none';
        }

        var cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col),
            position = SocialCalc.GetElementPositionWithScroll(cell.element);

        // Calculate dialog position;
        var dialogW = $(dialogDOM).outerWidth(true);
        var dialogH = $(dialogDOM).outerHeight(true);
        var setLeft = parseInt(position.left);
        var setTop = parseInt(position.top) + editor.rowheight[editor.ecell.row];
        if (parseInt(position.left) + dialogW > editor.width) {
          setLeft = editor.width - dialogW;
        }
        if (parseInt(position.top) + dialogH > editor.height) {
          setTop = parseInt(position.top) - dialogH + 1;
        }
        dialogDOM.style.left = setLeft + 'px';
        dialogDOM.style.top = setTop + 'px';
        dialogDOM.style.display = 'block';

        // Check link attribute
        var wval = editor.workingvalues;
        wval.ecoord = editor.ecell.coord;
        wval.erow = editor.ecell.row;
        wval.ecol = editor.ecell.col;
        editor.RangeRemove();
        var text = SocialCalc.GetCellContents(editor.context.sheetobj, editor.ecell.coord);
        if (text.charAt(0) === '\'') {
          text = text.slice(1);
        }
        var parts = SocialCalc.ParseCellLinkText(text);
        linkDescInput.value = SocialCalc.special_chars(parts.desc);
        linkUrlInput.value = SocialCalc.special_chars(parts.url);
        linkDescInput.focus();
        enableLinkMode(linkDescInput);
      };
    };

    /**
     * Hide Link Setting dialog. 隱藏「連結設定」的視窗。
     * @return {function}  Function to hide dialog. 隱藏「連結設定」視窗的 function。
     */
    var hideDialog = function () {
      return function () {
        if (dialogDOM.style.display === 'block') {
          dialogDOM.style.display = 'none';
          disableLinkMode();
        }
      };
    };

    /**
     * Show Link Info dialog. 顯示「連結資訊」的視窗。
     * @return {function}  Function to show Link Info dialog. 顯示「連結資訊」視窗的 function。
     */
    var showLinkInfo = function () {
      return function () {
        var cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col),
            position = SocialCalc.GetElementPositionWithScroll(cell.element);

        // Check link attribute
        // var wval = editor.workingvalues;
        // wval.ecoord = editor.ecell.coord;
        // wval.erow = editor.ecell.row;
        // wval.ecol = editor.ecell.col;
        var text = SocialCalc.GetCellContents(editor.context.sheetobj, editor.ecell.coord);
        if (text.charAt(0) === '\'') {
          text = text.slice(1);
        }
        if (text === '') {
          return;
        }
        var parts = SocialCalc.ParseCellLinkText(text);
        linkInfoUrlDOM.innerHTML = SocialCalc.special_chars(parts.url);
        linkInfoUrlDOM.href = SocialCalc.special_chars(parts.url);

        // Calculate dialog position;
        var dialogW = $(linkInfoDOM).outerWidth(true);
        var dialogH = $(linkInfoDOM).outerHeight(true);
        var setLeft = parseInt(position.left);
        var setTop = parseInt(position.top) + editor.rowheight[editor.ecell.row];
        if (parseInt(position.left) + dialogW > editor.width) {
          setLeft = editor.width - dialogW;
        }
        if (parseInt(position.top) + dialogH > editor.height) {
          setTop = parseInt(position.top) - dialogH + 1;
        }
        linkInfoDOM.style.left = setLeft + 'px';
        linkInfoDOM.style.top = setTop + 'px';
        linkInfoDOM.style.display = 'block';
      };
    };

    /**
     * Hide Link Info dialog. 隱藏「連結資訊」的視窗。
     * @return {function}  Function to hide Link Info dialog. 隱藏「連結資訊」視窗的 function。
     */
    var hideLinkInfo = function () {
      return function () {
        if (linkInfoDOM.style.display === 'block') {
          linkInfoDOM.style.display = 'none';
        }
      };
    };

    /**
     * Change link information, main function of 'change' in 'Link Info' dialog. 改變連結資訊，「連結資訊」視窗中「變更」的功能。
     * @return {function}  Function to excute showDialog(). 去執行 showDialog() 的 function。
     */
    var changeLinkInfo = function () {
      return function () {
        (showDialog())();
      };
    };

    /**
     * Remove link in current selected cell. 移除目前所選擇儲存格中的連結。
     * @return {function}  Function to remove link in current selected cell. 移除目前所選擇儲存格中連結的 function。
     */
    var removeLink = function () {
      return function () {
        // Check link attribute
        var wval = editor.workingvalues;
        wval.ecoord = editor.ecell.coord;
        wval.erow = editor.ecell.row;
        wval.ecol = editor.ecell.col;
        var text = SocialCalc.GetCellContents(editor.context.sheetobj, wval.ecoord);
        if (text.charAt(0) === '\'') {
          text = text.slice(1);
        }

        var parts = SocialCalc.ParseCellLinkText(text);
        // Remove cell text format, set it to sheet's default.
        var cmd = 'set %C textvalueformat ' + '\n';
        cmd += customEditorSaveEdit(wval.ecoord, SocialCalc.special_chars(parts.desc));
        SocialCalc.SpreadsheetControlExecuteCommand(null, cmd, '');
        // editor.EditorSaveEdit(SocialCalc.special_chars(parts.desc));
        (hideLinkInfo())();
      };
    };

    /**
     * Custom EditorSaveEdit() function. Modified from SocialCalc.EditorSaveEdit(), only return command string, not adding command to stack.
     * 自訂的 EditorSaveEdit() function。從 SocialCalc.EditorSaveEdit() 修改，只會回傳命令字串，而不會將命令加入至 stack 中。
     * @param  {string} coord  Interested SocialCalc cell, use SocialCalc cell key. 需要設定的 SocialCalc 儲存格，以儲存格代號表示。
     * @param  {string} text   Text content to set to cell. 需要設定至儲存格中的文字內容。
     * @return {string}        SocialCalc command. SocialCalc 的指令。
     */
    var customEditorSaveEdit = function(coord, text) {
      if (!coord) {
        logger.error('Lack of Parameter.');
        return false;
      }
      var valueinfo, fch, type, value, oldvalue, cmdline;
      var sheetobj = editor.context.sheetobj;

      type = 'text t';
      value = typeof text === 'string' ? text : editor.inputBox.GetText(); // either explicit or from input box

      oldvalue = SocialCalc.GetCellContents(sheetobj, coord) + '';
      if (value === oldvalue) { // no change
        return;
      }
      fch = value.charAt(0);
      if (fch === '=' && value.indexOf('\n') === -1) {
        type = 'formula';
        value = value.substring(1);
      } else if (fch === '\'') {
        type = 'text t';
        value = value.substring(1);
        valueinfo = SocialCalc.DetermineValueType(value); // determine type again
        if (valueinfo.type.charAt(0) === 't') {
          type = 'text ' + valueinfo.type;
        }
      } else if (value.length === 0) {
        type = 'empty';
      } else {
        valueinfo = SocialCalc.DetermineValueType(value);
        if (valueinfo.type === 'n' && value === (valueinfo.value + '')) { // see if don't need "constant"
          type = 'value n';
        } else if (valueinfo.type.charAt(0) === 't') {
          type = 'text ' + valueinfo.type;
        } else if (valueinfo.type === '') {
          type = 'text t';
        } else {
          type = 'constant ' + valueinfo.type + ' ' + valueinfo.value;
        }
      }

      if (type.charAt(0) === 't') { // text
        value = SocialCalc.encodeForSave(value); // newlines, :, and \ are escaped
      }

      cmdline = 'set ' + coord + ' ' + type + ' ' + value;

      return cmdline;
    };

    /**
     * Enable input link mode, to avoid keyboard input event be input to SocialCalc cell. 啟用輸入連結模式，避免鍵盤輸入事件被輸入到 SocialCalc 儲存格內。
     * @param  {Object} obj  DOM element object to set focus input. 要被設定 focus 的 DOM 元件。
     */
    var enableLinkMode = function (obj) {
      SocialCalc.CmdGotFocus(obj);
      keydownObj = obj;
      $(obj).on('keydown', function () {
        SocialCalc.CmdGotFocus(keydownObj);
      });
    };

    /**
     * Disable input link mode, let keyboard input event be input to SocialCalc cell. 關閉輸入連結模式，將鍵盤輸入事件導入至 SocialCalc 儲存格。
     */
    var disableLinkMode = function () {
      SocialCalc.KeyboardFocus();
      $(keydownObj).unbind('keydown');
    };

    /**
     * Apply link to cell. Method is modified from SocialCalc.SpreadsheetControl.DoLinkPaste(). 套用連結設定至儲存格。方法是從 SocialCalc.SpreadsheetControl.DoLinkPaste() 修改而來。
     */
    var applyLink = function () {
      var descele = linkDescInput;
      var urlele = linkUrlInput;
      var pagenameele = document.getElementById(ctrl.idPrefix + 'linkpagename');
      var workspaceele = document.getElementById(ctrl.idPrefix + 'linkworkspace');
      // var formatele = document.getElementById(ctrl.idPrefix + 'linkformat');
      var popupele = document.getElementById(ctrl.idPrefix + 'linkpopup');

      var text = '';

      var ltsym, gtsym, obsym, cbsym;

      if (popupele && popupele.checked) {
        ltsym = '<<'; gtsym = '>>'; obsym = '[['; cbsym = ']]';
      }
      else {
        ltsym = '<'; gtsym = '>'; obsym = '['; cbsym = ']';
      }

      if (pagenameele && pagenameele.value) {
        if (workspaceele.value) {
          text = descele.value + '{' + workspaceele.value + obsym + pagenameele.value + cbsym + '}';
        } else {
          text = descele.value + obsym + pagenameele.value + cbsym;
        }
      } else {
        text = descele.value + ltsym + urlele.value + gtsym;
      }

      if (dialogDOM.style.display === 'block') {
        dialogDOM.style.display = 'none';
        disableLinkMode();
      }

      // Force changing cell text format.
      SocialCalc.SpreadsheetControlExecuteCommand(null, 'set %C textvalueformat text-link', '');
      editor.EditorSaveEdit(text);
    };

    applyLinkBtn.addEventListener('click', applyLink, false);
    linkDescInput.addEventListener('focus', function () {
      enableLinkMode(linkDescInput);
    }, false);
    linkUrlInput.addEventListener('focus', function () {
      enableLinkMode(linkUrlInput);
    }, false);

    keyEvt.addEvent('edit', 'hk-d-ce-ilink', keyEvt.MODKEY.CTRL, 'k', function () {
      (showDialog())();
    });

    return {
      showDialog: showDialog(),
      hideDialog: hideDialog(),
      showLinkInfo: showLinkInfo(),
      hideLinkInfo: hideLinkInfo(),
      changeLinkInfo: changeLinkInfo(),
      removeLink: removeLink()
    };
  }
);

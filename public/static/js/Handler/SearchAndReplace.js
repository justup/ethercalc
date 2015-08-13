'use strict';

/**
 * 尋找與取代相關處理程式。
 */
define(
  [
    'Apollo/Logger',
    'Apollo/KeyboardEvent',
    'Apollo/Global'
  ],
  function (logger, keyEvt, global) {
    var ctrl =  global.getSpreadsheetObject();
    var editor = ctrl.editor;
    var sheet = ctrl.sheet;
    var keydownObj;

    // Assign DOMs to variables.
    var dialogDOM = document.getElementById('apollo-search-and-replace-dialog');
    dialogDOM.innerHTML = document.getElementById('apollo-search-and-replace-dialog-template').innerHTML;
    var removedNode = document.getElementById('apollo-search-and-replace-dialog-template');
    removedNode.parentNode.removeChild(removedNode);

    var searchInput = document.getElementById('apollo-sr-search-input-field');
    var replaceInput = document.getElementById('apollo-sr-replace-input-field');
    var searchCondition = document.getElementById('apollo-sr-search-condition-field');
    var caseSensitiveCheck = document.getElementById('apollo-sr-case-sensitive-check-field');
    var fitAllContentCheck = document.getElementById('apollo-sr-fit-all-content-check-field');
    var searchInFormulaCheck = document.getElementById('apollo-sr-search-in-formula-check-field');
    var messageField = document.getElementById('apollo-sr-message-field');
    var findBtn = document.getElementById('apollo-sr-find-button');
    var replaceBtn = document.getElementById('apollo-sr-replace-button');
    var replaceAllBtn = document.getElementById('apollo-sr-replace-all-button');
    var completeBtn = document.getElementById('apollo-sr-complete-button');

    findBtn.disabled = true;
    replaceBtn.disabled = true;
    replaceAllBtn.disabled = true;

    var searchMode = false;
    var currentCell = '';
    var cellKeys;
    var found = false;
    var startIdx, currentIdx, previousMatchIdx, matchIdx;

    /**
     * Show Search And Replace control dialog. 顯示「尋找與取代」控制視窗。
     * @return {function}  Function to show dialog. 顯示「尋找與取代」控制視窗的 function。
     */
    var showDialog = function () {
      return function () {
        if (dialogDOM.style.display === 'block') {
          return;
        }
        // Calculate center of screen.
        var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var dialogW = $(dialogDOM).outerWidth(true);
        var dialogH = $(dialogDOM).outerHeight(true);
        var top = parseInt(h / 2 - dialogH / 2);
        var left = parseInt(w / 2 - dialogW / 2);
        dialogDOM.style.top = top + 'px';
        dialogDOM.style.left = left + 'px';
        dialogDOM.style.display = 'block';
        searchInput.focus();
        var closeButton = $(dialogDOM).find('button.apollo-dialog-close');
        closeButton.unbind().click((hideDialog)());
        currentCell = editor.ecell.coord;
      };
    };

    /**
     * Hide Search And Replace control dialog. 隱藏「尋找與取代」控制視窗。
     * @return {function}  Function to hide dialog. 隱藏「尋找與取代」控制視窗的 function。
     */
    var hideDialog = function () {
      return function () {
        if (dialogDOM.style.display === 'block') {
          searchInput.value = '';
          replaceInput.value = '';
          caseSensitiveCheck.checked = false;
          fitAllContentCheck.checked = false;
          searchInFormulaCheck.checked = false;
          messageField.innerHTML = '&nbsp;';
          findBtn.disabled = true;
          replaceBtn.disabled = true;
          replaceAllBtn.disabled = true;
          disableInputMode();
          dialogDOM.style.display = 'none';
          searchMode = false;
          found = false;
        }
      };
    };

    /**
     * Enable 'replace' button (and function). 啟用「取代」按鈕。
     */
    var enableReplaceButton = function () {
      replaceBtn.disabled = false;
    };

    /**
     * Disable 'replace' button (and function). 關閉「取代」按鈕。
     */
    var disableReplaceButton = function () {
      replaceBtn.disabled = true;
    };

    /**
     * Check if 'replace button' can be enable. (according to Google Spreadsheet rules.) 檢查「取代」按鈕是否可啟用。（根據 Google 試算表的規則）
     * @param  {Object}  cellData       Interested cell data, 'MUST BE' SocialCalc.Cell object. 要檢查的儲存格資料，「一定」要是 SocialCalc.Cell 物件。
     * @param  {boolean} doNotChangeUI  Decide to 'not' to change replace button UI in function or change directly. 決定是否"不要"直接在此 function 中改變「取代」按鈕 UI，否則直接改變。
     * @return {boolean}                Return TRUE for enable replace button, FALSE for disable replace button. 回傳 TRUE 表示可以啟用「取代」按鈕，FALSE 表示不可啟用「取代」按鈕。
     */
    var checkReplaceEnable = function (cellData, doNotChangeUI) {
      if (!(cellData instanceof SocialCalc.Cell)) {
        if (!doNotChangeUI) {
          disableReplaceButton();
        }
        return false;
      }
      var ntvf, tvf;
      tvf = (cellData.textvalueformat) ? sheet.valueformats[cellData.textvalueformat] : '';
      ntvf = (cellData.nontextvalueformat) ? sheet.valueformats[cellData.nontextvalueformat] : '';
      if (cellData.datatype === 't') {
        if (tvf === 'text-link' || tvf === 'formula') {
          if (!searchInFormulaCheck.checked) {
            if (!doNotChangeUI) {
              disableReplaceButton();
            }
            return false;
          }
        }
        if (!doNotChangeUI) {
          enableReplaceButton();
        }
        return true;
      }
      if (cellData.datatype === 'v') {
        if (ntvf === 'text-link' || ntvf === 'formula') {
          if (!searchInFormulaCheck.checked) {
            if (!doNotChangeUI) {
              disableReplaceButton();
            }
            return false;
          }
        }
        if (!doNotChangeUI) {
          enableReplaceButton();
        }
        return true;
      }
      if (cellData.datatype === 'f') {
        if (!searchInFormulaCheck.checked) {
          if (!doNotChangeUI) {
            disableReplaceButton();
          }
          return false;
        }
        if (!doNotChangeUI) {
          enableReplaceButton();
        }
        return true;
      }
    };

    /**
     * Enable input mode, to avoid keyboard input event be input to SocialCalc cell. 啟用輸入模式，避免鍵盤輸入事件被輸入到 SocialCalc 儲存格內。
     * @param  {Object} obj  DOM element object to set focus input. 要被設定 focus 的 DOM 元件。
     */
    var enableInputMode = function (obj) {
      SocialCalc.CmdGotFocus(obj);
      keydownObj = obj;
      $(obj).on('keydown', function () {
        SocialCalc.CmdGotFocus(keydownObj);
      });
    };

    /**
     * Disable input mode, let keyboard input event be input to SocialCalc cell. 關閉輸入模式，將鍵盤輸入事件導入至 SocialCalc 儲存格。
     */
    var disableInputMode = function () {
      SocialCalc.Keyboard.passThru = null;
      $(keydownObj).unbind('keydown');
    };

    /**
     * Implement Search And Replace dialog 'Search' main function. 實作尋找與取代視窗中「搜尋」的主要功能。
     * @param  {boolean} afterReplace  TRUE to preserve message generate from 'replace' function. 設定為 TRUE 將保留由「取代」功能產生的訊息。
     */
    var search = function (afterReplace) {
      var i;
      if (!searchInput.value || searchInput.value === '') {
        return false;
      }
      if (!searchMode) {
        resetStartIdx();
      }
      var stopSearching = false;
      var str, inputStr;
      var comparedResult;
      while (!stopSearching) {
        inputStr = (caseSensitiveCheck.checked) ? searchInput.value : searchInput.value.toLowerCase();
        for (i = currentIdx; i < cellKeys.length; ++i) {
          str = getStringToSearch(sheet.cells[cellKeys[i]]);
          comparedResult = (fitAllContentCheck.checked) ? (str === inputStr) : (str.indexOf(inputStr) !== -1);
          if (comparedResult) {
            messageField.innerHTML = (afterReplace) ? messageField.innerHTML + '<br>' : '';
            messageField.innerHTML += (found === true && previousMatchIdx === i) ? '找不到其他結果，再從頭尋找' : '&nbsp;';
            found = true;
            editor.MoveECell(cellKeys[i]);
            setWorkingCell();
            checkReplaceEnable(sheet.cells[cellKeys[i]]);
            matchIdx = i;
            currentIdx = i + 1;
            previousMatchIdx = i;
            stopSearching = true;
            break;
          }
        }
        // Handle end-to-start.
        if (!stopSearching) {
          for (i = 0; i <= startIdx; ++i) {
            str = getStringToSearch(sheet.cells[cellKeys[i]]);
            comparedResult = (fitAllContentCheck.checked) ? (str === inputStr) : (str.indexOf(inputStr) !== -1);
            if (comparedResult) {
              found = true;
              editor.MoveECell(cellKeys[i]);
              setWorkingCell();
              checkReplaceEnable(sheet.cells[cellKeys[i]]);
              currentIdx = i + 1;
              matchIdx = i;
              messageField.innerHTML = (afterReplace) ? messageField.innerHTML + '<br>' : '';
              messageField.innerHTML += '找不到其他結果，再從頭尋找';
              stopSearching = true;
              break;
            }
          }
          currentIdx = startIdx + 1;
        }
        if (!stopSearching) {
          stopSearching = true;
          if (!found) {
            messageField.innerHTML = (afterReplace) ? messageField.innerHTML + '<br>' : '';
            messageField.innerHTML += '沒有與「' + searchInput.value + '」相符的項目';
          } else {
            for (i = currentIdx; i < cellKeys.length; ++i) {
              str = getStringToSearch(sheet.cells[cellKeys[i]]);
              comparedResult = (fitAllContentCheck.checked) ? (str === inputStr) : (str.indexOf(inputStr) !== -1);
              if (comparedResult) {
                messageField.innerHTML = (afterReplace) ? messageField.innerHTML + '<br>' : '';
                messageField.innerHTML += '找不到其他結果，再從頭尋找';
                found = true;
                editor.MoveECell(cellKeys[i]);
                setWorkingCell();
                checkReplaceEnable(sheet.cells[cellKeys[i]]);
                currentIdx = i + 1;
                matchIdx = i;
                previousMatchIdx = i;
                stopSearching = true;
                break;
              }
            }
          }
        }
      } // while (!stopSearching)
    };

    /**
     * Set working cell which will be used by SocialCalc.TableEditor.EditorSaveEdit(). 設定 使用中儲存格 ，此資訊會被 SocialCalc.TableEditor.EditorSaveEdit() 使用。
     */
    var setWorkingCell = function () {
      var wval = editor.workingvalues;
      wval.ecoord = editor.ecell.coord;
      wval.erow = editor.ecell.row;
      wval.ecol = editor.ecell.col;
    };

    /**
     * Get all cell keys used by SocialCalc. 取得所有可被 SocialCalc 所使用的 儲存格代號 。
     * @param  {boolean} columnSearch  TRUE to sort keys in Column-major order. (A1, A2,...,B1, B2,...etc.) 設定為 TRUE 將使用 column 為主的排序方式。
     * @return {Array}                 Array include all valid keys in current spreadsheet. 包含目前試算表中所有有效 儲存格代號 的陣列。
     */
    var getAllCellKeys = function (columnSearch) {
      var keys, cellID, i, j;
      keys = [];
      if (columnSearch) {
        if (typeof Object.keys === 'function') {
          keys = Object.keys(sheet.cells);
        } else {
          keys = [];
          for (var key in sheet.cells) {
            keys.push(key);
          }
        }
        if (columnSearch) {
          keys.sort(naturalCompare);
        } else {
          keys.sort(naturalCompare);
        }
        return keys;
      } else {
        // Excel Style (and Google Spreadsheet style) sorted keys.
        keys = [];
        for (i = 1; i <= sheet.attribs.lastrow; ++i) {
          for (j = 1; j <= sheet.attribs.lastcol; ++j) {
            cellID = SocialCalc.crToCoord(j, i);
            if (sheet.cells[cellID]) {
              keys.push(cellID);
            }
          }
        }
        return keys;
      }
    };

    // Method from: http://stackoverflow.com/questions/15478954/sort-array-elements-string-with-numbers-natural-sort
    /**
     * Natural compare method, used in sort() parameter. 自然比較的方法，作為 javascript 中的 sort() 的參數。
     * @param  {[type]} a [description]
     * @param  {[type]} b [description]
     * @return {[type]}   [description]
     */
    var naturalCompare = function (a, b) {
      var ax = [], bx = [];

      a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) {
        ax.push([$1 || Infinity, $2 || '']);
      });
      b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) {
        bx.push([$1 || Infinity, $2 || '']);
      });

      while (ax.length && bx.length) {
        var an = ax.shift();
        var bn = bx.shift();
        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if(nn) {
          return nn;
        }
      }

      return ax.length - bx.length;
    };

    /**
     * According to cell type and user settings, decide actual string to search. 根據儲存格參數與使用者設定，決定實際要搜尋的字串。
     * @param  {Object} cellData  Interested cell data, 'MUST BE' SocialCalc.Cell object. 要檢查的儲存格資料，「一定」要是 SocialCalc.Cell 物件。
     * @return {string}           Actual string to search. 實際要搜尋的字串。
     */
    var getStringToSearch = function (cellData, usedByReplace) {
      if (!(cellData instanceof SocialCalc.Cell)) {
        return '';
      }
      var returnStr = '';
      var text, tempStr, parts;
      var caseSensitive = caseSensitiveCheck.checked;
      if (usedByReplace) {
        caseSensitive = true;
      }
      switch (cellData.datatype) {
        case 'v':
          text = SocialCalc.GetCellContents(editor.context.sheetobj, cellData.coord);
          var ntvf = '';
          if (cellData.textvalueformat) {
            ntvf = sheet.valueformats[cellData.textvalueformat];
          } else if (cellData.nontextvalueformat) {
            ntvf = sheet.valueformats[cellData.nontextvalueformat];
          }
          if (ntvf !== 'formula') {
            if (text.charAt(0) === '\'') {
              text = text.slice(1);
            }
          }
          returnStr = (caseSensitive) ? text.toString() : text.toString().toLowerCase();
          break;
        case 't':
          // Split link if needed.
          var tvf = '';
          if (cellData.textvalueformat) {
            tvf = sheet.valueformats[cellData.textvalueformat];
          } else if (cellData.nontextvalueformat) {
            tvf = sheet.valueformats[cellData.nontextvalueformat];
          }
          text = SocialCalc.GetCellContents(editor.context.sheetobj, cellData.coord);
          if (tvf === 'text-link') {
            if (text.charAt(0) === '\'') {
              text = text.slice(1);
            }
            if (searchInFormulaCheck.checked) {
              tempStr = text;
            } else {
              parts = SocialCalc.ParseCellLinkText(text);
              tempStr = SocialCalc.special_chars(parts.desc);
            }
            returnStr = (caseSensitive) ? tempStr.toString() : tempStr.toString().toLowerCase();
          } else if (tvf === 'formula') {
            returnStr = (caseSensitive) ? text.toString() : text.toString().toLowerCase();
          } else {
            if (text.charAt(0) === '\'') {
              text = text.slice(1);
            }
            returnStr = (caseSensitive) ? text.toString() : text.toString().toLowerCase();
          }
          break;
        case 'f':
          if (searchInFormulaCheck.checked) {
            text = SocialCalc.GetCellContents(editor.context.sheetobj, cellData.coord);
            returnStr = (caseSensitive) ? text.toString() : text.toString().toLowerCase();
          } else {
            returnStr = (caseSensitive) ? cellData.datavalue.toString() : cellData.datavalue.toString().toLowerCase();
          }
          break;
        default:
          text = SocialCalc.GetCellContents(editor.context.sheetobj, cellData.coord);
          if (text.charAt(0) === '\'') {
            text = text.slice(1);
          }
          returnStr = (caseSensitive) ? text.toString() : text.toString().toLowerCase();
          break;
      }
      return returnStr;
    };

    /**
     * Replace match string. Main function of 'replace' in Search And Replace dialog. 取代相符的字串。「尋找與取代」中「取代」的主要功能。
     * @return {boolean}  Only return FALSE when there is not found in searching. 只會在搜尋沒有結果時回傳 FALSE。
     */
    var replaceMatch = function () {
      if (!found) {
        return false;
      }
      var cellData;
      var str;
      var afterReplace = false;
      if (matchIdx !== -1) {
        cellData = sheet.cells[cellKeys[matchIdx]];
        str = getStringToSearch(cellData, true);
        // Initialize Regular Expression.
        var inputStr = searchInput.value;
        var replaceStr = replaceInput.value;
        var condition = (caseSensitiveCheck.checked) ? 'g' : 'gi';
        var regexp = new RegExp(inputStr, condition);
        var newStr = str.replace(regexp, replaceStr);
        // editor.EditorSaveEdit(SocialCalc.special_chars(newStr));
        var cmd = customEditorSaveEdit(cellData.coord, newStr);
        editor.EditorScheduleSheetCommands(cmd, true, false);
        messageField.innerHTML = '使用「' + newStr + '」取代「' + str + '」';
        afterReplace = true;
      }
      search(afterReplace);
    };

    /**
     * Replace all matched strings. Main function of 'replace all' in Search And Replace dialog. 取代所有相符的字串。「尋找與取代」中「取代全部」的主要功能。
     */
    var replaceAllMatches = function () {
      var i, cmd, keys, matchKeys, str, inputStr, replaceStr, comparedResult, cellData, condition, regexp, newStr;
      keys = getAllCellKeys();
      matchKeys = [];
      inputStr = (caseSensitiveCheck.checked) ? searchInput.value : searchInput.value.toLowerCase();
      for (i = 0; i < keys.length; ++i) {
        str = getStringToSearch(sheet.cells[keys[i]]);
        comparedResult = (fitAllContentCheck.checked) ? (str === inputStr) : (str.indexOf(inputStr) !== -1);
        if (comparedResult) {
          matchKeys.push(keys[i]);
        }
      }
      cmd = '';
      // Initialize Regular Expression.
      inputStr = searchInput.value;
      replaceStr = replaceInput.value;
      condition = (caseSensitiveCheck.checked) ? 'g' : 'gi';
      regexp = new RegExp(inputStr, condition);
      for (i = 0; i < matchKeys.length; ++i) {
        cellData = sheet.cells[matchKeys[i]];
        if (!checkReplaceEnable(cellData, true)) {
          continue;
        }
        if (cmd !== '') {
          cmd += '\n';
        }
        str = getStringToSearch(cellData, true);
        newStr = str.replace(regexp, replaceStr);
        cmd += customEditorSaveEdit(cellData.coord, newStr);
      }
      if (cmd !== '') {
        editor.EditorScheduleSheetCommands(cmd, true, false);
      }
      messageField.innerHTML = '已使用「' + replaceInput.value + '」取代所有「' + searchInput.value + '」';
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
     * Reset start idx of searching. 重置搜尋的起始 index。
     */
    var resetStartIdx = function () {
      var i;
      cellKeys = [];
      cellKeys = getAllCellKeys();
      searchMode = true;
      found = false;
      disableReplaceButton();
      matchIdx = -1;
      if (!Array.prototype.indexOf) {
        for (i = 0; i < cellKeys.length; ++i) {
          if (cellKeys[i] === currentCell) {
            startIdx = i;
            break;
          }
        }
      } else {
        startIdx = cellKeys.indexOf(currentCell);
      }
      currentIdx = startIdx + 1;
      if (startIdx === -1) {
        startIdx = 0;
        currentIdx = startIdx;
      }
    };

    $(dialogDOM).find('input').on('focus', function () {
      enableInputMode(this);
    });

    $(dialogDOM).on('keydown', function (evt) {
      if (evt.keyCode === 27) {
        (hideDialog())();
      } else if (evt.keyCode === 13) {
        findBtn.click();
        searchInput.focus();
      }
    });

    $(searchCondition).find('div > label').on('click', function (evt) {
      var checked = $(evt.currentTarget.parentNode).find('input').prop('checked');
      if (checked) {
        $(evt.currentTarget.parentNode).find('input').prop('checked', false);
      } else {
        $(evt.currentTarget.parentNode).find('input').prop('checked', true);
      }
      resetStartIdx();
    });

    $(searchInput).on('input', function () {
      if (searchInput.value && searchInput.value !== '') {
        findBtn.disabled = false;
        replaceAllBtn.disabled = false;
      } else {
        findBtn.disabled = true;
        replaceAllBtn.disabled = true;
      }
      resetStartIdx();
    });

    caseSensitiveCheck.addEventListener('change', function () {
      resetStartIdx();
    }, false);

    fitAllContentCheck.addEventListener('change', function () {
      resetStartIdx();
    }, false);

    searchInFormulaCheck.addEventListener('change', function () {
      resetStartIdx();
    }, false);

    completeBtn.addEventListener('click', function () {
      (hideDialog())();
    });

    findBtn.addEventListener('click', function () {
      search();
    });

    replaceBtn.addEventListener('click', function () {
      replaceMatch();
    });

    replaceAllBtn.addEventListener('click', function () {
      replaceAllMatches();
    });

    keyEvt.addEvent('move', 'hk-d-cmv-search', keyEvt.MODKEY.CTRL, 'h', function () {
      (showDialog())();
    });
    // keyEvt.addSpecialKeyEvent('移動', '尋找與取代', keyEvt.MODKEY.SHIFT, keyEvt.SPKEY.F2, function () {
    //   (showDialog())();
    // });

    // dialogDOM.addEventListener('mousedown', function () {
    //   focusOnInputField();
    // });

    return {
      showDialog: showDialog(),
      hideDialog: hideDialog()
    };
  }
);

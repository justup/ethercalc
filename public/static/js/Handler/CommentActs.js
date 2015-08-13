'use strict';

define(
  [
    'Apollo/Global'
  ],
  function (global) {
    var spreadsheet = global.getSpreadsheetObject(),
        editor = spreadsheet.editor;
    var commentArea, mouseoverTimer, currentECell,
        commentAttr = {
          editingMode: null,
          displayMode: null
        };
    var clickDisplayEditor, mouseoverDisplayEditor, locateAndShowCA;
    var initCommentArea, enableInputMode, disableInputMode, closeEditor, saveComment,
        renderComment, placeCaretAtEnd, setSelectionForDiv;

    mouseoverDisplayEditor = function () {
      return function (event) {
        // console.log('mouseover');
        if (commentAttr.displayMode === 'click' ||
          commentAttr.editingMode === 'edit') { return; }

        window.clearTimeout(mouseoverTimer);

        mouseoverTimer = window.setTimeout(
          function () {
            currentECell = null;
            commentAttr.editingMode = null;
            locateAndShowCA(event);
            renderComment();
          }
        , 200);
      };
    };

    clickDisplayEditor = function () {
      return function () {
        // console.log('click');
        commentAttr.displayMode = 'click';
        commentAttr.editingMode = 'edit';
        currentECell = editor.ecell;
        renderComment();
      };
    };

    locateAndShowCA = function (event) {
      var pos = SocialCalc.GetElementPositionWithScroll(editor.toplevel),
          clientX = event.clientX - pos.left,
          clientY = event.clientY - pos.top;

      var ecell = SocialCalc.GridMousePosition(editor, clientX, clientY);

      if (!ecell || !ecell.coord) { return; }

      // 檢查這個cell是否有任何資料存在目前的sheet
      var result = spreadsheet.sheet.cells[ecell.coord];
      if (typeof result === 'undefined') { return; }

      // 檢查這個cell是否有comment
      result = spreadsheet.sheet.cells[ecell.coord].comment;
      if (typeof result === 'undefined' || result === '') { return; }

      currentECell = ecell;
      commentAttr.editingMode = 'view';
    };

    initCommentArea = function () {
      commentArea = document.createElement('div');
      commentArea.id = 'comment-editor';
      commentArea.style.display = 'none';
      commentArea.contentEditable = true;
      commentArea.title = L10n.get('ic-d-prompt.title');
      commentArea.setAttribute('data-l10n-id', 'ic-d-prompt');
      spreadsheet.spreadsheetDiv.appendChild(commentArea);

      commentArea.onblur = closeEditor;
      commentArea.onmouseover = function () {
        window.clearTimeout(mouseoverTimer);
      };
      commentArea.onfocus = function () {
        enableInputMode();
        commentAttr.editingMode = 'edit';
      };
    };

    renderComment = function () {

      // init and bind event
      if (typeof commentArea === 'undefined') {
        initCommentArea();
      }

      if (commentAttr.editingMode === null) {
        commentArea.style.display = 'none';
        disableInputMode();
        return;
      }

      var cell = SocialCalc.GetEditorCellElement(editor, currentECell.row, currentECell.col),
          position = SocialCalc.GetElementPosition(cell.element);
      commentArea.style.left = position.left + editor.colwidth[currentECell.col] + 'px';
      commentArea.style.top = position.top + 'px';
      commentArea.style.display = 'block';
      var comment = spreadsheet.sheet.cells[currentECell.coord].comment || '';

      if (commentAttr.editingMode === 'view') {
        commentArea.innerHTML = comment;
        disableInputMode();
        return;
      }

      if (commentAttr.editingMode === 'edit') {
        enableInputMode();

        if (comment.length === 0) {
          commentArea.innerHTML = '';
          setSelectionForDiv(commentArea);
        } else {
          commentArea.innerHTML = comment;
          placeCaretAtEnd(commentArea);
        }
        return;
      }
    };

    closeEditor = function() {
      return function () {
        if (typeof commentArea === 'undefined') { return; }

        if (commentArea.style.display === 'block') {
          if (commentAttr.editingMode === 'edit') {
            saveComment();
          }
          commentAttr.editingMode = null;
          commentAttr.displayMode = null;
          currentECell = null;
          renderComment();
        }
      };
    };

    saveComment = function () {
      if (!editor.noEdit && !editor.ECellReadonly()) {
        if (commentArea.innerHTML.replace(/(<([^>]+)>)/ig, '').trim() === '') {
          spreadsheet.ExecuteCommand('set ' + currentECell.coord + ' comment');
          return;
        }
        spreadsheet.ExecuteCommand(
          'set ' + currentECell.coord + ' comment ' + SocialCalc.encodeForSave(commentArea.innerHTML)
        );
      }
    };



    placeCaretAtEnd = function (el) {
        el.focus();
        if (typeof window.getSelection !== 'undefined' &&
          typeof document.createRange !== 'undefined') {
          var range, sel;
          range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);  // false, to its end.
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (typeof document.body.createTextRange !== 'undefined') {
          // for ie, no test now.....
          var textRange = document.body.createTextRange();
          textRange.moveToElementText(el);
          textRange.collapse(false); // false, to its end.
          textRange.select();
        }
    };

    setSelectionForDiv = function (el) {
        el.focus();
        if (typeof window.getSelection !== 'undefined' &&
          typeof document.createRange !== 'undefined') {
          var range, sel;
          range = document.createRange();
          range.selectNodeContents(el);
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (typeof document.body.createTextRange !== 'undefined') {
          // for ie, no test now.....
          var textRange = document.body.createTextRange();
          textRange.moveToElementText(el);
          textRange.select();
        }
    };

    enableInputMode = function () {
      SocialCalc.CmdGotFocus(commentArea);
    };

    disableInputMode = function () {
      SocialCalc.KeyboardFocus();
    };

    // 取消插入備註的keyevent 因為會觸發原本的F2輸入事件
    // 待有人反應需要有插入備註的hotkey, 再討論適合的組合
    // keyEvt.addSpecialKeyEvent('insert', 'm-i-note', keyEvt.MODKEY.SHIFT, keyEvt.SPKEY.F2, function () {
    //   (clickDisplayEditor())();
    // });

    return {
      clickDisplayEditor: clickDisplayEditor(),
      mouseoverDisplayEditor: mouseoverDisplayEditor(),
      closeEditor: closeEditor()
    };
  }
);

'use strict';

define(
  [
    'Apollo/UIManager',
    'Apollo/Global',
    'Apollo/Logger'
  ],
  function (uiManager, global, logger) {

      var insertFormula = function (f) {
        return function () {
          var spreadsheet = global.getSpreadsheetObject(),
              editor = spreadsheet.editor;
          var text = f + '(';
          editor.EditorAddToInput(text, '=');
        };
      };

      SocialCalc.SpreadsheetControl.GetFunctionInfoStr = function(fname) {

        var scf = SocialCalc.Formula;
        // var f = scf.FunctionList[fname];
        var scsc = SocialCalc.special_chars;

        var str = '<b>'+fname+'('+scsc(scf.FunctionArgString(fname))+')</b>';

        var l10nId = 's_fdef_'+fname;
        var fdes = scsc(L10n.get(l10nId));
        str += '<p data-l10n-id="'+l10nId+'">'+fdes+'</p>';

        return str;

      };

      var showFormulaSelector = function () {

        var dialogDOM = document.getElementById('apollo-formula-dialog');
        var cfidPrefix  = 'apollo-formula-dialog-content-function';
        var fcDOM       = document.getElementById(cfidPrefix + 'class'),
            fnDOM       = document.getElementById(cfidPrefix + 'name'),
            fdDOM       = document.getElementById(cfidPrefix + 'desc');

        var initFormulaSelector, doFormulaPaste, formulaClassChosen, fillFormulaNames,
            formulaChosen = SocialCalc.SpreadsheetControl.GetFunctionInfoStr;

        initFormulaSelector = function () {
          var i;

          var scf = SocialCalc.Formula;
          var fcl = SocialCalc.Constants.function_classlist;

          scf.FillFunctionInfo();

          fcDOM.size = fcl.length;
          fnDOM.size = fcl.length;

          for (i=0; i<fcl.length; i++) {
            //s_fclass_all
            var o = new Option(
                scf.FunctionClasses[fcl[i]].name,
                fcl[i],
                (i===0),
                (i===0)
              );

            // set l10n attr
            o.setAttribute('data-l10n-id', 's_fclass_' + fcl[i]);

            fcDOM.options.add(o);
          }
          L10n.translate(fcDOM);

          fcDOM.onchange = formulaClassChosen;

          // setup default fn name
          fillFormulaNames(fcl[0], fnDOM);
          fnDOM.onchange = function () {
            var fname = fnDOM.options[fnDOM.selectedIndex].value;
            fdDOM.innerHTML = formulaChosen(fname);
          };
          fnDOM.ondblclick=doFormulaPaste;

          // setup default fn desc
          fdDOM.innerHTML = formulaChosen(scf.FunctionClasses[fcl[0]].items[0]);
        };

        formulaClassChosen = function() {
          var cname = fcDOM.options[fcDOM.selectedIndex].value;
          var scf = SocialCalc.Formula;

          fillFormulaNames(cname, fnDOM);

          // setup default class
          var fname = scf.FunctionClasses[cname].items[0];
          fdDOM.innerHTML = formulaChosen(fname);
        };

        fillFormulaNames = function(cname, ele) {

          var i, f;
          var scf = SocialCalc.Formula;

          ele.length = 0;
          f = scf.FunctionClasses[cname];
          for (i=0; i<f.items.length; i++) {
            ele.options[i] = new Option(f.items[i], f.items[i]);
            if (i===0) {
              ele.options[i].selected = true;
            }
          }
        };

        doFormulaPaste = function() {
          var spreadsheet = global.getSpreadsheetObject();
          var editor = spreadsheet.editor;
          var text = fnDOM.value+'(';

          uiManager.hideDialog();

          editor.EditorAddToInput(text, '=');

        };

        return function () {

          if (fcDOM.options.length === 0) {
            initFormulaSelector();
          }

          uiManager.showDialog(
            dialogDOM,
            doFormulaPaste
          );
        };

      };

      // Rewrite or hack inputecho(box) related stuff
      (function hackInputEchoClousre() {

        // decide to show prompt or not
        var checkprompt = function(inputstr, inputecho) {
          var scc = SocialCalc.Constants;
          var parts = inputstr.match(/.*[\+\-\*\/\&\^\\<\>\=\,\(]([A-Za-z][A-Za-z][\w\.]*?)\([^\)]*$/);
          var fname, fstr;

          // formula
          if (inputstr.charAt(0) === '=' && parts) {

            fname = parts[1].toUpperCase();
            if (SocialCalc.Formula.FunctionList[fname]) {
              SocialCalc.Formula.FillFunctionInfo(); //  make sure filled
              fstr = SocialCalc.SpreadsheetControl.GetFunctionInfoStr(fname);
            }
            else {
              fstr = scc.ietUnknownFunction+fname;
            }

            if (inputecho.prompt.innerHTML !== fstr) {
              inputecho.prompt.innerHTML = fstr;
              inputecho.prompt.style.display = 'block';
            }
          }
          // normal text
          else if(inputecho.prompt.style.display !== 'none') {
            inputecho.prompt.innerHTML = '';
            inputecho.prompt.style.display = 'none';
          }
        };

        // close parenthesis if input formula
        var checkParen = function (editor) {
          var inputtext = editor.inputBox.GetText(),
              parts, needRightParen;
          var i;
          parts = inputtext.match(/.*[\+\-\*\/\&\^\\<\>\=\,\(]([A-Za-z][A-Za-z][\w\.]*?)\([^\)]*$/);
          if (inputtext.charAt(0) === '=' && parts) {
            needRightParen = (inputtext.match(/\(/g) || []).length - (inputtext.match(/\)/g) || []).length;
            if (needRightParen > 0) {
              for (i = 0; i < needRightParen; i++) {
                inputtext += ')';
              }
              editor.inputBox.SetText(inputtext);
            }
          }
        };

        // do the same work as SocialCalc.GetCellContents
        // except that we don't want a leading apostrophe for a text string
        var getCellContent = function(sheetobj, coord) {
          var result = '';
          var cellobj = sheetobj.cells[coord];

          if (cellobj) {
            switch (cellobj.datatype) {
              case 'v':
                result = cellobj.datavalue + '';
                break;
              case 't':
                // not to add a leading apostrophe here
                result = '' + cellobj.datavalue;
                break;
              case 'f':
                result = '=' + cellobj.formula;
                break;
              case 'c':
                result = cellobj.formula;
                break;

              default:
                break;
            }
          }

          return result;
        };

        // hack EditorProcessKey for preprocessing some keys:
        //  left, right, up, down
        var orgEditorProcessKey = SocialCalc.EditorProcessKey;
        SocialCalc.EditorProcessKey = function(editor, ch, e) {
          if(!ch || !editor) { return false; } // just in case

          if (editor.state === 'input' && ch === '[enter]') {
            checkParen(editor);
          }

          if(!editor.inputFocus) {
            return orgEditorProcessKey(editor, ch, e);
          }

          if(ch.substr(0,2)==='[a') {
            return; // ignore keys for [aleft], [aright], [aup] or [adown]
          }

          // TODO: ctrl-enter
          /*if(e.ctrlKey && ch==='[enter]') {
          }*/

          return orgEditorProcessKey(editor, ch, e);
        };

        // add InputBoxHeartbeat for inputbox to sync with editable inputecho
        SocialCalc.InputBoxHeartbeat = function() {
          var editor = SocialCalc.Keyboard.focusTable;
          if (!editor) { return true; }
          var inputecho = editor.inputEcho;
          var inputbox = editor.inputBox;

          var parseEcho = function(html) {
            var str;
            str = html.replace(/\/div/g, '');
            str = str.replace(/<div>/g, '\n');
            str = str.replace(/<br>/g, '\n');
            str = str.replace(/&nbsp;/g, ' ');
            str = str.replace(/&lt;/g, '<');
            str = str.replace(/&gt;/g, '>');
            str = str.replace(/&amp;/g, '&');
            return str;
          };

          var val = parseEcho(inputecho.main.innerHTML);
          inputbox.element.value = val;
          inputecho.text = val;
          checkprompt(val, inputecho);
        };

        // rewrite SetInputEchoText to show detailed formula instruction
        SocialCalc.SetInputEchoText = function(inputecho, str) {
          var newstr = SocialCalc.special_chars(str);
          newstr = newstr.replace(/\n/g, '<br>');

          if (inputecho.text !== newstr) {
            inputecho.main.innerHTML = newstr;
            inputecho.text = newstr;
          }
          if (inputecho.editor.echoEditing) {
            inputecho.Focus();
          }

          checkprompt(str, inputecho);
        };

        // rewrite ShowInputEcho to adjust inputecho style
        SocialCalc.ShowInputEcho = function(inputecho, show) {
          var cell, position;
          var editor = inputecho.editor;

          if (!editor) { return;}

          if (show) {
            editor.cellhandles.ShowCellHandles(false);
            cell=SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);

            if (cell) {
              position = SocialCalc.GetElementPosition(cell.element);
              inputecho.container.style.left = position.left +'px';
              inputecho.container.style.top =  position.top +'px';

              // match inputecho with cell's attr.
              inputecho.main.style.font = cell.element.style.font;
              inputecho.main.style.color = cell.element.style.color;
              inputecho.main.style.textDecoration = cell.element.style.textDecoration;
              inputecho.main.style.backgroundColor = cell.element.style.backgroundColor;
              inputecho.main.style.minWidth = cell.element.offsetWidth + 'px';
              inputecho.main.style.minHeight = cell.element.offsetHeight + 'px';

              inputecho.main.contentEditable = true;
            }

            inputecho.prompt.id = 'inputecho-prompt';

            inputecho.container.style.display = 'block';

            if(editor.state === 'input') {  // focus on editable inputecho
              SocialCalc.HeartbeatExchange(editor, 'cell');
            }
            else if (editor.state === 'inputboxdirect') { // focus on formulabar input
              editor.inputBox.Focus();
              editor.inputBox.Select('end');
              SocialCalc.HeartbeatExchange(editor);
            }

            // editing state
            editor.inputFocus = true;
          }
          // leave editing state
          else {
            if (inputecho.interval) { window.clearInterval(inputecho.interval);}
            inputecho.container.style.display = 'none';

            editor.inputFocus = false;
            editor.echoEditing = false;
          }

          if(inputecho.hint) {
            inputecho.hint.style.display = 'none';
            inputecho.hint.innerHTML = '';
          }
        };

        // rewrite EditorOpenCellEdit to not focus on inputbox
        SocialCalc.EditorOpenCellEdit = function(editor) {
          var wval;

          if(!editor.ecell || !editor.inputBox|| !editor.inputEcho) { return true; }
          if(editor.inputBox.element.disabled)  { return true; } // multi-line: ignore

          editor.state = 'input';

          editor.inputBox.ShowInputBox(true);
          editor.inputBox.SetText('');
          editor.inputBox.DisplayCellContents();

          editor.inputEcho.Focus();

          // set working values
          wval = editor.workingvalues;
          wval.partialexpr = '';
          wval.ecoord = editor.ecell.coord;
          wval.erow = editor.ecell.row;
          wval.ecol = editor.ecell.col;
        };

        // rewrite InputBoxDisplayCellContents
        // do the same work as original one, except that the cell content is retrieved via getCellContent
        SocialCalc.InputBoxDisplayCellContents = function(inputbox, coord) {
          var scc = SocialCalc.Constants;

          if (!inputbox) { return; }
          if (!coord) { coord = inputbox.editor.ecell.coord; }

          var text = getCellContent(inputbox.editor.context.sheetobj, coord);

          if (text.indexOf('\n')!==-1) {
            text = scc.s_inputboxdisplaymultilinetext;
            inputbox.element.disabled = true;
          }
          else if (inputbox.editor.ECellReadonly()) {
            inputbox.element.disabled = true;
          }
          else {
            inputbox.element.disabled = false;
          }

          inputbox.SetText(text);
        };

        // rewrite GetText method of an InputBox to add apostrophe (if required)
        // since EditorSaveEdit takes the string after apostrophe as the real value
        SocialCalc.InputBox.prototype.GetText = function() {
          var value = this.element.value;
          if(value.charAt(0)==='\'') {
            return '\'' + value;
          }

          return value;
        };

        // add HeartbeatExchange to reset input heartbeat callback
        // @param {string} tp 'cell' for editing on inputecho
        //  and sync formulabar's input with editable inputecho
        SocialCalc.HeartbeatExchange = function(editor, tp) {
          if(!editor||!editor.inputEcho) { return; }

          if(editor.inputEcho.interval) {
            window.clearInterval(editor.inputEcho.interval);
          }

          // focus on cell, heartbeat goes to inputbox
          if(tp && tp ==='cell') {
            editor.echoEditing = true;
            editor.inputEcho.interval = window.setInterval(SocialCalc.InputBoxHeartbeat, 50);
            editor.inputEcho.Focus();
          }
          else {
            editor.echoEditing = false;
            editor.inputEcho.interval = window.setInterval(SocialCalc.InputEchoHeartbeat, 50);
          }

          logger.debug('HeartbeatExchange: echoEditing = ' + editor.echoEditing);
        };

        // add Focus method to InputEcho
        SocialCalc.InputEcho.prototype.Focus = function() {
          var element = this.main;

          // update caret position
          if(element.isContentEditable && document.createRange && element.lastChild) {
            var range =  document.createRange();
            var sel = window.getSelection();

            range.selectNodeContents(element);
            range.collapse(false);

            sel.removeAllRanges();
            sel.addRange(range);
          }
          else {
            element.focus();
          }

        };

      })(); // END OF hackInputEcho

      return {
        insertSum: insertFormula('sum'),
        insertAverage: insertFormula('average'),
        insertCount: insertFormula('count'),
        insertMax: insertFormula('max'),
        insertMin: insertFormula('min'),
        insertFormulas: showFormulaSelector()
      };

    }
);

'use strict';

define(
  [
    'Apollo/Global'
  ],
  function (global) {

    var toolbarPaintFormat, copyFormats, pasteFormats, hookProcessEditorMouseUp, init;

    var spreadsheet = global.getSpreadsheetObject();
    var editor = spreadsheet.editor;
    
    copyFormats = function () {      
      var cmd = 'copy %C formats';
      spreadsheet.ExecuteCommand(cmd, '');
      editor.paintformatstate = 'start';
      toolbarPaintFormat.closest('li').addClass('selected');

    };

    pasteFormats = function () {
      if (editor.paintformatstate === 'start') {
        var cmd = 'paste %C formats';
        spreadsheet.ExecuteCommand(cmd, '');
        delete editor.paintformatstate;
        toolbarPaintFormat.closest('li').removeClass('selected');
      }
    };

    hookProcessEditorMouseUp = function () {
      var oriProcessEditorMouseUp = SocialCalc.ProcessEditorMouseUp;
      SocialCalc.ProcessEditorMouseUp = function (e) {
        
        oriProcessEditorMouseUp(e);

        pasteFormats();
      };
    };

    init = function (elementIdStr) {
      toolbarPaintFormat = $(elementIdStr);
      
      toolbarPaintFormat.click(copyFormats);
      hookProcessEditorMouseUp();
    };

    return {
      initPF: init,
      copyFormats: copyFormats,
      pasteFormats: pasteFormats
    };
  }
);
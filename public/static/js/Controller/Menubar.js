'use strict';

/**
 * 用來控制 Menubar 的 Controller
 */
define(
  [
    'Apollo/Topbar',
    'Apollo/Controller/File',
    'Apollo/Controller/Editor',
    'Apollo/Controller/View',
    'Apollo/Controller/Insert',
    'Apollo/Controller/Format',
    'Apollo/Controller/Help'
  ],
  function(topbar, file, editor, view, insert, format, help) {

    // 第一次進入試算表要 fire cell focus 這樣 topbar 才會同步 A1 儲存格資訊
    topbar.onload(function() {
      var e = SocialCalc.GetSpreadsheetControlObject().editor;
      Apollo.EventListener.fireCellFocus(e);
    });


    return {
      file: file,
      editor: editor,
      view: view,
      insert: insert,
      format: format,
      help: help
    };

  }
);

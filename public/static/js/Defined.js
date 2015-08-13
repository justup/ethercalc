'use strict';

/**
 * Apollo Define (Singleton)
 *
 * 用來存放一些全域的靜態宣告值，最後的 key name 請用全大寫英數+底線
 */
define(function () {

  window.Apollo = window.Apollo || {};

  var def = window.Apollo.Defined = {
    Environment: {
      PRODUCTION: 'PRODUCTION',
      DEVELOPMENT: 'DEVELOPMENT',
      TESTING: 'TESTING'
    },

    Classes: {
      COL: 'ccol-head', // column heading
      ROW: 'crow-head', // row heading
      SELECTED_COL: 'selected ccol-head',
      SELECTED_ROW: 'selected crow-head'
    }
  };

  // Hack ethercalc default style
  if (typeof(SocialCalc) !== 'undefined' && typeof(SocialCalc.Constants) !== 'undefined') {

    //** heading row
    SocialCalc.Constants.defaultRownameClass = def.Classes.ROW;
    SocialCalc.Constants.defaultSelectedRownameClass = def.Classes.SELECTED_ROW;
    SocialCalc.Constants.defaultRownameStyle = 'position:relative;overflow:visible;border:1px solid #C0C0C0;font-size:small;text-align:center;vertical-align: middle;color:black;background-color:#F3F3F3;direction:rtl;';
    SocialCalc.Constants.defaultSelectedRownameStyle = 'position:relative;overflow:visible;border:1px solid #C0C0C0;font-size:small;text-align:center;vertical-align: middle;color:#black;background-color:#DDDDDD;';

    //** heading col
    SocialCalc.Constants.defaultColnameClass = def.Classes.COL;
    SocialCalc.Constants.defaultSelectedColnameClass = def.Classes.SELECTED_COL;
    SocialCalc.Constants.defaultColnameStyle = 'overflow:visible;width:64px;border:1px solid #C0C0C0;font-size:small;text-align:center;color:#black;background-color:#F3F3F3;';
    SocialCalc.Constants.defaultSelectedColnameStyle = 'overflow:visible;border:1px solid #C0C0C0;font-size:small;text-align:center;color:#black;background-color:#DDDDDD;';

    SocialCalc.Constants.defaultRowNameWidth = '46';
    SocialCalc.Constants.defaultColWidth = '121';
    SocialCalc.Constants.defaultAssumedRowHeight = 19;
    SocialCalc.Constants.defaultHighlightTypeCursorStyle = '';
    SocialCalc.Constants.defaultHighlightTypeCursorStyle = '';
    SocialCalc.Constants.defaultHighlightTypeRangeStyle = '';
    SocialCalc.Constants.defaultHighlightTypeRangeStyle = 'background-color:#ECF3FF;';

    SocialCalc.Constants.TCscrollareaStyle = 'backgroundColor:#EEEEEE;';

    //** SocialCalc.InputEcho
    SocialCalc.Constants.defaultInputEchoStyle = 'fontSize:small;padding:2px 10px 1px 2px;';
    SocialCalc.Constants.defaultInputEchoPromptStyle = 'borderLeft:1px solid #884;borderRight:1px solid #884;borderBottom:1px solid #884;fontSize:small;fontStyle:italic;padding:2px 10px 1px 2px;cursor:default;';

  }

  return window.Apollo.Defined;
});

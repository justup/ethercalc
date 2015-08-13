'use strict';

/**
 * Apollo Context-Menu Handler
 */
define([
    'Apollo/Logger',
    'Apollo/Global',
    'Apollo/Controller/Menubar',
    'Apollo/Controller/Insert',
    'Apollo/ContextMenu',
    'Apollo/Headings',
    'Apollo/Handler/Clipboard',
    'Apollo/Handler/CommentActs',
    'Apollo/Handler/DeleteActs'
  ],
  function (logger, global, menubar, insert, ctxmgr, headings, clipboard, commentActs, deleteActs) {

    // menubar controllers
    var editor = menubar.editor;

    // constants
    var def = window.Apollo.Defined;

    // spreadsheet view mode
    var readonly = false;

    // objects of context menu
    var cmHeadRow = null,  // for heading rows
        cmHeadCol = null,  // for heading columns
        cmMain = null;     // for main editor

    /*-----------------------------------------------------
     * Context Menu configs {items:Array.menuObj[,keepnative:{tags, classes, ids}, cond:bool]}
     * each menuObj should contanin its literal text and key
     *  the key can be later used to switch on/off the menu
     *  ex: ctxmenu.setMenuEnable('pastefomula', false);
     *
     *  optional params for a menuObj are:
     *    action:callback, items(subitems), disable:bool
     *    cond:bool(this menu will not be created if config.cond is true)
     *    sepline:bool (add separator for this menu item)
     *----------------------------------------------------*/

    // config for main table
    var tconf = {
      items: [
        {text: '剪下', key: 'cut', l10nId: 'm-e-cut', action: clipboard.cutHandler, cond:true},
        {text: '複製', key: 'copy', l10nId: 'm-e-copy', action: clipboard.copyHandler, cond:true},
        {text: '貼上', key: 'paste', l10nId: 'm-e-paste', action: clipboard.pasteHandler, cond:true},
        {text: '選擇性貼上', key: 'pasetspecial', l10nId: 'm-e-pastesp', sepline:true, cond:true,
          items: [{text: '僅貼上<b>值</b>', key: 'pastevalue', l10nId: 'm-e-ps-pvo', action:editor.specialPaste.pasteVal },
                {text: '僅貼上<b>格式</b>', key: 'pasteformat', l10nId: 'm-e-ps-pfo', action:editor.specialPaste.pasteFormat },
                {text: '僅貼上<b>公式</b>', key: 'pastefomula', l10nId: 'm-e-ps-pflo', action:editor.specialPaste.pasteFormula },
                {text:'貼上全部但<b>邊框除外</b>', key: 'pastexborder', l10nId: 'm-e-ps-paeb', action:editor.specialPaste.pasteAllxBorder }]
        },
        {text: '刪除第&nbsp;<strong data-num="0">0</strong>&nbsp;欄', key: 'cm-remove-col', action: editor.delcol, cond:true },
        {text: '刪除第&nbsp;<strong data-num="0">0</strong>&nbsp;列', key: 'cm-remove-row', action: editor.delrow, sepline:true, cond:true },
        {text: '插入備註', key: 'insertcomment', l10nId: 'cm-t-inote', action: commentActs?commentActs.clickDisplayEditor:null, cond:true },
        {text: '清除備註', key: 'clearcomment',  l10nId: 'm-e-cn', action: deleteActs?deleteActs.clearComment:null,cond:true }
      ],

      // global exception list
      keepnative: {
        //  show native contextmenu on editable elements
        tags: ['INPUT'],
        attr: ['contentEditable']
      },

      cond:readonly
    };

    // config for heading columns
    var hcconf = {
      items: [
        {text: '排序工作表 (A → Z)', key: 'sortcolAsc', l10nId:'cm-hc-asort', action:function() { headings.columns.sort('up'); } },
        {text: '排序工作表 (Z → A)', key: 'sortcolDesc', l10nId:'cm-hc-dsort', action:function() { headings.columns.sort('down');}, sepline:true },
        {text: '設定欄寬', key: 'setcolWidth', l10nId:'cm-hc-resize', disable:true,  cond:true },
        {text: '刪除欄', key: 'delcol', l10nId:'cm-hc-delcol', action:editor.delcol, cond:true },
        {text: '向左插入 1 欄', l10nId:'cm-hc-linsert', key: 'insertColLeft', action: insert.insertColLeft, cond: true },
        {text: '向右插入 1 欄', l10nId:'cm-hc-rinsert', key: 'insertColRight', action: insert.insertColRight, cond: true }
      ],

      cond:readonly
    };

    // config for heading rows
    var hrconf = {
      items: [
        {text: '設定列高', key: 'setrowHeight', l10nId:'cm-hr-resize', disable: true, cond: true },
        {text: '刪除列', key: 'delrow', l10nId:'cm-hr-delrow', action: editor.delrow,  cond: true },
        {text: '向上插入 1 列', key: 'insertRowUp', l10nId:'cm-hr-ainsert', action: insert.insertRowUp, cond: true },
        {text: '向下插入 1 列', key: 'insertRowDown', l10nId:'cm-hr-binsert', action: insert.insertRowDown, cond: true }
      ],
      cond: readonly
    };

    function setReadonly() {
      readonly = global.getReadOnly();

      hrconf.cond = readonly;
      hcconf.cond = readonly;
      tconf.cond  = readonly;
    }

    // create context-menu panes and bind elements
    function buildContextMenus() {
      setReadonly();

      // apply hcconf on cmHeadCol
      cmHeadCol = ctxmgr.add('hcconf', hcconf);
      cmHeadCol.bindTarget('.' + def.Classes.COL, {
        before: function(e) {
          var pos = headings.getColPosition((e.target||e.srcElement), e.clientX, e.clientY);
          if(!pos) { return false; }

          // {row: 1, col: 5, colheader: true, distance: 8, coltoresize: 4}
          headings.columns.select(pos.col);
          return true;
        }
      });

      // apply hrconf on cmHeadRow
      cmHeadRow = ctxmgr.add('hrconf', hrconf);
      cmHeadRow.bindTarget('.' + def.Classes.ROW, {
        before: function(e) {
          var pos = headings.getRowPosition((e.target||e.srcElement), e.clientX, e.clientY);
          if(!pos) { return false; }

          // {row: 7, col: 1, rowheader: true, distance: 12, rowtoresize: 6}
          headings.rows.select(pos.row);
          return true;
        }
      });

      // apply tconf on cmMain
      cmMain = ctxmgr.add('tconf', tconf);
      cmMain.bindTarget('#te_toplevel', {
        // allow browser's context menu
        excep: {
          tags: ['INPUT', 'textarea'],
          classes:[def.Classes.COL, def.Classes.ROW],
          attr: ['contentEditable']
        },

        // check before real right-click action
        // return false if not clicked on cell
        before:function(e) {
          var target = e.target||e.srcElement;
          if(!target) { return false; }

          // incase of clicking on the text node
          if (target.tagName !== 'TD') {
            target = $(target).closest('td')[0];
          }

          if(target && target.id && /^cell/.test(target.id)) {
            return true;
          }

          return false;
        }
      });

      // init language of menu-panes

      // @param{Object.Panes}
      var transPanes = function(panes) {
        var pkeys = Object.keys(panes);

        // translate each menu pane
        pkeys.forEach(function(k) {
          if(panes[k].mPane) {
            L10n.translate(panes[k].mPane[0]);
          }

        });
      };

      ctxmgr.items.forEach(function(ctxmenu) {
        if(ctxmenu.panes) {
          transPanes(ctxmenu.panes);
        }
      });

      var spreadsheet = global.getSpreadsheetObject();
      if(spreadsheet && spreadsheet.editor && spreadsheet.editor.StatusCallback) {

        spreadsheet.editor.StatusCallback.ctxMenuRefresh = {

          func: function(e, st) {
            if(st==='doneposcalc') {

              // rebind heading (row)column elements
              // update row(column) selections
              if(cmHeadCol) {
                cmHeadCol.rebindTarget();
                headings.columns.updateRange(e);
              }
              if(cmHeadRow) {
                cmHeadRow.rebindTarget();
                headings.rows.updateRange(e);
              }
            }
          },
          params: {}
        };
      }

    } // END OF buildContextMenus

    return {
      init:buildContextMenus
    };
  }
);

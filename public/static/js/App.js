'use strict';

/**
 * Apollo App
 *
 * 帶起整的 Apollo 程式的起點，在這裡可以載入相關的 Controller 與 View
 */
define(
  [
    'Apollo/Global',
    'API/foxdrive-api',
    'API/foxdocs-api',
    'Static/l10n',
    'Apollo/UIManager',
    'Apollo/Topbar',
    'Apollo/Controller/TitleBar',
    'Apollo/Utility',
    'Apollo/Logger',
    'Apollo/Config',
    'Apollo/OAuth',
    'Apollo/Permission',
    'Apollo/Navigator',
    'Apollo/Defined',
    'Apollo/EventListener'
  ],
  function (global, sasApi, docsApi, l10n, uiManager, topbar, titleBar, utility, logger, config, oauth, permission, navigator) {

    // for player.js getCookie()
    window.getCookie = utility.getCookie;
    window.setCookie = utility.setCookie;

    // register global namespace
    window.Utility = utility;
    window.L10n = l10n;

    /**
     * 封裝 EtherCalc 之後的 Apollo 進入點 (Single Sheet)
     */
    var main = function (socialCalc, sheetId) {

      var cbPermissionChecked = function (fileId, accessToken, result, readonly) {
        start(socialCalc, fileId, accessToken, result, readonly);
      };

      var onl10nReady = function (accessToken, fileId) {

        $('#screen-overlay').load('./static/templates/dialog.html', null, function () {
          uiManager.init();

          var d = document.querySelectorAll('.apollo-dialog');
          var i, len = d.length;
          for (i = 0; i < len; i++) {
            l10n.translate(d[i]);
          }

          var password = '';
          var matches = window.location.search.match(/^\?.*password=([^&]*)/);
          if (matches !== null) {
            password = matches[1];
          }

          permission.checkPermission(fileId, $('#apollo-password-field').val(), accessToken, cbPermissionChecked);
        });
      };

      logger.debug('Load spreadsheet: ' + sheetId);

      // load config
      config.load(function () {
        logger.debug('Environment: ' + config.Environment);

        sasApi.setApiVersion(config.SAS_API_VERSION);

        // oauth login
        oauth.setSasHostname(config.SAS_HOSTNAME);
        oauth.checkToken(function () {

          var fileId, accessToken = utility.getCookie('access_token');

          uiManager.showLoading();

          // data init
          global.setSheetId(sheetId);
          if (/(.+)\.\d+/.exec(sheetId)) {
            fileId = RegExp.$1;
          } else {
            fileId = sheetId;
          }
          global.setFileId(fileId);

          sasApi.setServiceHost(config.SAS_HOSTNAME);
          sasApi.setAccessToken(accessToken);

          l10n.ready(onl10nReady.bind(null, accessToken, fileId));

        });

      });

    };

    /**
     * 啟動應用程式並載入試算表
     *
     * @param {SocialCalc} socialCalc
     * @param {string} fileId
     * @param {string} accessToken
     * @param {object} fileInfo
     * @param {boolean} readonly
     */
    var start = function (socialCalc, fileId, accessToken, fileInfo, readonly) {

      if (typeof(socialCalc) !== 'object') {
        logger.error('SocialCalc not defined.');
        return;
      }

      if (typeof(readonly) === 'undefined') {
        if (!readonly) {
          readonly = false;
          logger.debug('Writable mode.');
        } else {
          readonly = true;
        }
      }

      if (readonly) {
        socialCalc._view = readonly;
        logger.debug('Readonly mode.');
      } else {
        logger.debug('Writable mode.');
      }

      global.setReadOnly(readonly);

      // load topbar (title + menubar + toolbar)
      var node = $('#tableeditor');
      node.load('./static/templates/topbar.html', null, function () {

        FoxDocsAPI.addPeerLoginListener(function (seqid, displayName, avatarUrl) {
          console.log(avatarUrl);
          if ($('#temp-user-' + seqid).size() === 0) {
            $('<img/>', {
              id: 'temp-user-' + seqid,
              src: avatarUrl,
              class: 'online-user-photo',
              title: displayName
            }).appendTo('#current-online-user-container');
          }
        });

        topbar.createTopbar(node[0]);

        // docsApi init
        docsApi.setAccessToken(accessToken);
        if (window.location.pathname.match(/^\/spreadsheet\/([^\/]+)/) !== null) {
          // for local development
          docsApi.setServiceHost(window.location.origin + '/spreadsheet');
        } else {
          docsApi.setServiceHost(window.location.origin);
        }

        // update title bar
        titleBar.update(fileInfo);

        if (!readonly) {
          topbar.enabled();
        } else {
          // 關閉 SocialCalc key event
          SocialCalc.CmdGotFocus(null);
        }

        // 顯示登入/登出按鈕
        if (oauth.isLogin() === false) {
          $('#apollo-button-login').show();
          $('#apollo-button-login').click(function () {
            oauth.startOAuth(navigator.getWindowUrl(), navigator.getMainDocument());
          });
        } else {
          $('#apollo-button-logout').show();
          $('#apollo-button-logout').click(function () {
            oauth.logout(function () {
              navigator.gotoHadesLogout();
            });
          });
        }

        // load ethercalc
        $.getScript('./player/main.js', function () {
          // close loading screen
          uiManager.hideLoading();

          Apollo.EventListener.init(socialCalc);
          topbar.initMenubar();

          hookHighlightColor(readonly);

          hookFormatValueForDisplay();

          hookEditorApplySetCommandsToRange();
        });

      });
    };

    // hack SocialCalc.FormatValueForDisplay
    function hookFormatValueForDisplay() {
      var oriFormatValueForDisplay = SocialCalc.FormatValueForDisplay;
      SocialCalc.FormatValueForDisplay = function (sheetobj, value, cr, linkstyle) {
        var oriDisplayValue = oriFormatValueForDisplay(sheetobj, value, cr, linkstyle);
        if (oriDisplayValue === '&nbsp;') {
          oriDisplayValue = '';
        }
        return oriDisplayValue;
      };
    }

    // hack original highlight style in case of bg-color gone issue
    // tp will only be defined for rendering highlightedcells
    function hookHighlightColor(readonly) {
      var SocialCalcOrigSetStyles = SocialCalc.setStyles;
      SocialCalc.setStyles = function (element, cssText, tp) {
        var spreadsheet = (readonly) ? SocialCalc.GetSpreadsheetViewerObject():SocialCalc.GetSpreadsheetControlObject();

        if (!spreadsheet || !element) {
          return;
        }

        if (tp && tp === 'range' && element.id && /^cell/.test(element.id)) {
          var sheet, rgb, rgba, hex, opacity = 0.6;

          sheet =  spreadsheet.sheet;

          rgb = function (bgcolor) { // rgb(c1,c2,c3) to [c1, c2, c3]
            var result = bgcolor.substring(4, bgcolor.length - 1).replace(/ /g, '').split(',');
            if (result.length !== 3) { return false; }
            return result;
          };
          rgba = function (p) {      // [c1, c2, c3] to rgba(c1,c2,c3,a)
            if (p.length < 3) { return; }
            var sp = ',';
            return 'background-color:rgba(' + p[0] + sp + p[1] + sp + p[2] + sp + opacity + ');';
          };
          hex = function (str) {
            if (str.length !== 6) { return false; }
            var result = [];
            result[0] = parseInt(str.substring(0, 2), 16);
            result[1] = parseInt(str.substring(2, 4), 16);
            result[2] = parseInt(str.substring(4, 6), 16);
            return result;
          };

          var bg, val, newVal = '';
          var c = sheet.cells[element.id.slice(5)]; // cell_id

          // change style only when cells have bgcolor
          if (c && c.bgcolor && sheet.colors[c.bgcolor]) {
            val = sheet.colors[c.bgcolor];

            if (/^rgba\(/.test(val)) { newVal = val; }
            else if (val[0] === '#') {
              bg = hex(val.slice(1));
              if (bg && bg.length === 3) {
                newVal = rgba(bg);
              }
            }
            else if (/^rgb/.test(val)) {
              bg = rgb(val);
              if (bg && bg.length === 3) {
                newVal = rgba(bg);
              }
            }
            else {
              console.debug(element.id, val);
            }

            if (newVal && newVal.length > 1) {
              cssText = newVal;
            }
          }
        }

        return SocialCalcOrigSetStyles(element, cssText);
      };
    }

    // Overwrite original SocialCalc.EditorApplySetCommandsToRange().
    // Since we need to reset cell textvalueformat when we delete cell content.
    function hookEditorApplySetCommandsToRange() {
      var SocialCalcOrigEditorApplySetCommandsToRange = SocialCalc.EditorApplySetCommandsToRange;
      SocialCalcOrigEditorApplySetCommandsToRange = SocialCalcOrigEditorApplySetCommandsToRange;
      var customEmptyCell = function (editor) {
        var line, errortext, i;

        var ecell = editor.ecell;
        var range = editor.range;

        line = '';

        if (range.hasrange) {
          var cells = utility.getSelectedRangeIDs(editor.range);
          if (!cells) {
            return false;
          }
          for (i = 0; i < cells.length; ++i) {
            if (line !== '') {
              line += '\n';
            }
            line += 'set ' + cells[i] + ' ' + 'empty' + '\n';
            line += 'set ' + cells[i] + ' ' + 'textvalueformat ';
          }
          errortext = editor.EditorScheduleSheetCommands(line, true, false);
        } else {
          line += 'set ' + ecell.coord + ' ' + 'empty' + '\n';
          line += 'set ' + ecell.coord + ' ' + 'textvalueformat ';
          errortext = editor.EditorScheduleSheetCommands(line, true, false);
        }
      };

      SocialCalc.EditorApplySetCommandsToRange = function(editor, cmd) {
        var coord, line, errortext;

        var ecell = editor.ecell;
        var range = editor.range;

        if (cmd === 'empty') {
          customEmptyCell(editor);
        } else {
          if (range.hasrange) {
            coord = SocialCalc.crToCoord(range.left, range.top) + ':' + SocialCalc.crToCoord(range.right, range.bottom);
            line = 'set ' + coord + ' ' + cmd;
            errortext = editor.EditorScheduleSheetCommands(line, true, false);
          } else {
            line = 'set ' + ecell.coord + ' ' + cmd;
            errortext = editor.EditorScheduleSheetCommands(line, true, false);
          }
        }

        editor.DisplayCellContents();
      };
    }

    return {
      main: main
    };
  }
);


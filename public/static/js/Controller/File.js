'use strict';

/**
 * 功能列表「檔案」選單相關的控制邏輯
 */
define(
  [
    'API/foxdrive-api',
    'API/foxdocs-api',
    'Apollo/Topbar',
    'Apollo/UIManager',
    'Apollo/Global',
    'Apollo/Config',
    'Apollo/Logger',
    'Apollo/Controller/TitleBar',
    'Apollo/KeyboardEvent',
    'Apollo/Handler/ImportActs',
    'Apollo/Navigator',
    'Apollo/EventListener'
  ],
  function (sasApi, docsApi, toolbar, uiManager, global, config, logger, titleBar, keyboardEvent, importActs, navigator) {
    var l10n = window.L10n;

    // show warning alertBox
    function showWarningBox(msg) {
      uiManager.showAlertBox(l10n.get('d-title-warning'), msg);
    }

    toolbar.onload(function () {

      // 轉檔下載
      $('#apollo-menubar-excel-dl').attr('target', '_blank').attr(
        'href',
        docsApi.getServiceHost() + '/' + global.getSheetId() + '.xlsx'
      );
      $('#apollo-menubar-csv-dl').attr('target', '_blank').attr(
        'href',
        docsApi.getServiceHost() + '/' + global.getSheetId() + '.csv'
      );
      $('#apollo-menubar-html-dl').attr('target', '_blank').attr(
        'href',
        docsApi.getServiceHost() + '/' + global.getSheetId() + '.html'
      );

      $('#apollo-menubar-addexcel').click(function () {
        sasApi.createFileByString('', '雲端試算表.fds', 0, function (error, result, statusCode) {
          if (error === null && statusCode === 200) {
            var targetWindow = window.open('./' + result.fileid, 'fd-spreadsheet-' + result.fileid);
            if (typeof(targetWindow) !== 'undefined') {
              targetWindow.focus();
            }
          } else {
            showWarningBox(l10n.get('file-create-err'));
          }
        });
      });

      $('#apollo-menubar-rename').click(function () {
        $('#apollo-title-button').click();
      });

      $('#apollo-menubar-copy').click(function () {

        var filename;
        var matches = titleBar.getFilename().match(/(^.+?)(\.fds$)/);
        if (matches !== null) {
          filename = matches[1] + ' (副本)' + matches[2];
        } else {
          filename = titleBar.getFilename() + ' (副本)';
        }

        $('#apollo-copy-filename-field').val(filename);
        uiManager.showDialog(
          $('#apollo-copy-dialog'),
          function () {
            uiManager.hideDialog();

            docsApi.getSnapshot(global.getFileId(), function (error, result, statusCode) {
              if (error !== null && statusCode !== 200) {
                showWarningBox(l10n.get('copy-err-onretrieval'));
                logger.error('Get snapshot fail. file=' + global.getFileId());
                return;
              }

              sasApi.createFileByString(result, $('#apollo-copy-filename-field').val() + '.fds', 0, function (error, result, statusCode) {
                if (error !== null && statusCode !== 200) {
                  showWarningBox(l10n.get('cannot-copy-file'));
                  logger.error('Create file fail.');
                  return;
                }

                var targetWindow = window.open('./' + result.fileid, 'fd-spreadsheet-' + result.fileid);
                if (typeof(targetWindow) !== 'undefined') {
                  targetWindow.focus();
                }
              });
            });
          }
        );

        // 強制前景
        $('#apollo-copy-filename-field').focus();

      });

      var openFileHandler = function () {
        var hash = '#/6/all/LV';
        var url = config.DRIVE_HOSTNAME + '/main.html';
        var targetWindow = window.open(url + hash, 'fd-browser-' + hash);
        if (typeof(targetWindow) !== 'undefined') {
          targetWindow.focus();
        }
      };

      // 開啟檔案
      $('#apollo-menubar-open').click(openFileHandler);

      // 移動資料夾
      $('#apollo-menubar-movedir, #apollo-move-file-btn').click(function () {
        var hash = '#/0/' + global.getParentId() + '/LV';
        var url = config.DRIVE_HOSTNAME + '/main.html';
        var targetWindow = window.open(url + hash, 'fd-browser-' + hash);
        if (typeof(targetWindow) !== 'undefined') {
          targetWindow.focus();
        }
      });

      // 刪除檔案
      $('#apollo-menubar-remove').click(function () {
        sasApi.moveFilesToTrashcan([global.getFileId()], function (error, result, statusCode) {
          if (error !== null || statusCode !== 200) {
            showWarningBox(l10n.get('trash-err-ondel'));
            logger.error('Move to trashcan fail. file=' + global.getFileId());
            return;
          }

          uiManager.showDialog(
            $('#apollo-remove-dialog'),
            function () {
              navigator.gotoFoxDrive();
            },
            function () {
              sasApi.restoreTrashcanFiles([global.getFileId()], function (error, result, statusCode) {
                if (error !== null || statusCode !== 200) {
                  showWarningBox(l10n.get('trash-err-onrestore'));
                  logger.error('Trashcan restore file fail. file=' + global.getFileId());
                  return;
                } else {
                  uiManager.hideDialog();
                }
              });
            }
          );
        });
      });

      // bind hot key
      keyboardEvent.addEvent('file', 'hk-d-cf-open', keyboardEvent.MODKEY.CTRL, 'o', openFileHandler);

      $('#apollo-menubar-import').click(importActs.showImportDialog);
    });
  }
);

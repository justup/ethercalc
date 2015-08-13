'use strict';

/**
 * 試算表標題列相關的控制邏輯
 */
define(
  [
    'API/foxdrive-api',
    'Apollo/UIManager',
    'Apollo/Global',
    'Apollo/Logger',
    'Apollo/Topbar',
    'Apollo/EventListener'
  ],
  function (sasApi, uiManager, global) {
    var update;

    /**
     * 刷新 Title Bar 相關顯示資訊
     *
     * @param data {object} 檔案 Metadata
     */
    update = function (data) {
      var filename = '', matches;

      // update title and filename
      if (typeof(data.name) === 'string') {
        filename = data.name;
        matches = data.name.match(/(^.+)\.fds$/);
        if (matches !== null) {
          filename = matches[1];
        }

        if (data.owner) {
          $('#apollo-move-file-btn').show();
          $('#apollo-favorite-btn').show();
        }

        uiManager.setTitle(data.name + ' - 雲盤試算表');
        $('#apollo-title-button').text(filename);
        $('#apollo-filename-field').val(filename);
      } else {
        uiManager.setTitle('雲盤試算表');
      }

      // update favorite button status
      if (typeof(data.favorite) === 'boolean' && data.favorite) {
        $('#apollo-favorite-btn i').removeAttr('class').addClass('fa fa-star');
      } else {
        $('#apollo-favorite-btn i').removeAttr('class').addClass('fa fa-star-o');
      }

    };

    Apollo.Topbar.onload(function () {

      $('#apollo-filename-field').on('keydown', function (event) {
        event.stopPropagation();
      });

      $('#screen-overlay').on('keydown', function (event) {
        event.stopPropagation();
      });

      $('#apollo-title-button').click(function (event) {

        var filenameStore = $('#apollo-filename-field').val();
        var matches = $('#apollo-filename-field').val().match(/(^.+)\.fds$/);
        if (matches !== null) {
          filenameStore = matches[1];
        }

        uiManager.showDialog($('#apollo-filename-dialog:first'), function () {

          var filename = $('#apollo-filename-field').val();
          var matches = $('#apollo-filename-field').val().match(/(^.+)\.fds$/);
          if (matches !== null) {
            filename = matches[1];
          }

          if (filename === filenameStore) {
            uiManager.hideDialog();
            return;
          }

          uiManager.hideDialog();

          // call api
          sasApi.fileRename(
            global.getFileId(),
            filename + '.fds',
            function (error) {
              if (error === null) {
                $('#apollo-title-button').text(filename);
              } else {
                uiManager.showAlertBox('警告', '檔案更名發生錯誤！');
              }
              SocialCalc.KeyboardFocus();
            }
          );
        }, function () {
          $('#apollo-filename-field').val(filenameStore);
          uiManager.hideDialog();
        });

        // 強制前景
        $('#apollo-filename-field').focus();

        event.stopPropagation();
      });

      // favorite button
      $('#apollo-favorite-btn').click(function () {
        var favorite = ($('#apollo-favorite-btn i.fa.fa-star').size() > 0);

        if (favorite) {
          // unset favorite
          sasApi.unsetFilesTag(
            [global.getFileId()],
            'My Favorite',
            function (error) {
              if (error === null) {
                update({favorite: !favorite});
              } else {
                uiManager.showAlertBox('警告', '設定標籤發生錯誤！');
              }
            }
          );
        } else {
          // set favorite
          sasApi.setFilesTag(
            [global.getFileId()],
            'My Favorite',
            function (error) {
              if (error === null) {
                update({favorite: !favorite});
              } else {
                uiManager.showAlertBox('警告', '設定標籤發生錯誤！');
              }
            }
          );
        }

      });

    });

    return {
      update: update,
      /**
       * 取得文件檔案名稱
       *
       * @return {string} 檔名
       */
      getFilename: function () {
        return $('#apollo-title-button').text();
      }
    };
  }
);

'use strict';

/**
 * Apollo Permission
 *
 */
define(
  [
    'Apollo/Utility',
    'Apollo/Global',
    'Apollo/Logger',
    'Apollo/UIManager',
    'Apollo/OAuth',
    'Apollo/Navigator',
    'API/foxdrive-api'
  ],
  function (utility, global, logger, uiManager, oauth, navigator, sasApi) {
    var l10n;
    /**
     * 顯示登入提醒訊息
     *
     * @param {string} message
     */
    var showDocLoginAlert = function (message) {
      uiManager.showAlertBox(
        l10n.get('d-title-notice'),
        message,
        function () {
          var origUrl = window.location.origin + window.location.pathname;
          oauth.startOAuth(origUrl);
        },
        l10n.get('apollo-login')
      );
    };

    /**
     * 顯示檔案開啟錯誤相關訊息
     *
     * @param {string} message
     */
    var showDocOpenError = function (message) {
      uiManager.showAlertBox(
        l10n.get('d-title-warning'),
        message,
        function () {
          window.location.reload();
        },
        l10n.get('d-btn-tryagain')
      );
    };

    /**
     * 驗證試算表權限
     *
     * @param {string} fileId
     * @param {string} password
     * @param {string} accessToken
     * @param {function} successCallback  ex: function (fileId, accessToken, result, readonly)
     */
    var checkPermission = function (fileId, password, accessToken, successCallback) {
      l10n = window.L10n;

      // fix fileId on multi sheet
      if (/(.+)\.\d+/.exec(fileId)) {
        fileId = RegExp.$1;
      }

      // for auto function test will accept all
      if (/^.+_TEST$/.exec(fileId)) {
        successCallback(fileId, accessToken, {name: 'TEST_FILENAME'}, false);
        return;
      }

      // get old passwd from cookie
      if (password === '' && navigator.getPassword(fileId) !== '') {
        password = navigator.getPassword(fileId);
      } else if (typeof(password) === 'undefined') {
        navigator.setPassword(fileId, '');
      } else {
        navigator.setPassword(fileId, password);
      }

      // 驗證權限
      sasApi.getFilePermission(
        fileId,
        password,
        function (error, result, statusCode) {

          if (error === null && statusCode === 200) {

            global.setParentId(result.parentid);

            if (sasApi.hasPermission(sasApi.PERMISSION_UPDATE, result.permission)) {
              // writable
              successCallback(fileId, accessToken, result, false);
            } else if (sasApi.hasPermission(sasApi.PERMISSION_READ, result.permission)) {
              // readonly
              successCallback(fileId, accessToken, result, true);
            } else {
              showDocOpenError(l10n.get('permission-error'));
            }
          } else  if (statusCode === 401) {
            // 需要密碼
            uiManager.showDialog($('#apollo-password-dialog'));

            $('#apollo-password-dialog .dialog-confirm').unbind();
            $('#apollo-password-dialog .dialog-confirm').click(function () {
              var password = $('#apollo-password-field').val();
              uiManager.hideDialog();
              checkPermission(fileId, password, accessToken, successCallback);
            });

          } else if (statusCode === 403) {
            var msg = l10n.get('no-access-permission');
            if (accessToken !== '') {
              showDocOpenError(msg);
            } else {
              showDocLoginAlert(msg);
            }
          } else if (statusCode === 404) {
            showDocOpenError(l10n.get('file-not-exist'));
          } else {
            logger.error(error);
            showDocOpenError(l10n.get('cannot-get-finfo'));
          }
        }
      );
    };

    return {
      checkPermission: checkPermission
    };
  }
);

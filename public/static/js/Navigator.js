'use strict';

/**
 * 處理網頁跳轉相關副程式
 */
define(
  [
    'Apollo/Config',
    'Apollo/Utility'
  ],
  function (config, utility) {
    return {

      /**
       * 取得存在 Cookie 中的文件密碼
       *
       * @param {string} fileId
       * @return {string}
       */
      getPassword: function (fileId) {
        var windowObj;
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          windowObj = window.parent;
        } else {
          windowObj = window;
        }
        return utility.getCookie(fileId + '-password', windowObj.document);
      },

      /**
       * 設定存在 Cookie 中的文件密碼
       *
       * @param {string} fileId
       * @param {string} password
       */
      setPassword: function (fileId, password) {
        var windowObj;
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          windowObj = window.parent;
        } else {
          windowObj = window;
        }
        utility.setCookie(fileId + '-password', password, 3600, windowObj.location.pathname, windowObj.document);
      },

      /**
       * 跳轉到雲盤
       *
       * @param {string} [uri] 需要附加的 URL 或 Query String
       */
      gotoFoxDrive: function (uri) {
        if (typeof(uri) === 'undefined') {
          uri = '';
        }
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          window.parent.location.href = config.DRIVE_HOSTNAME + uri;
        } else {
          window.location.href = config.DRIVE_HOSTNAME + uri;
        }
      },

      /**
       * 登出 Hades
       *
       */
      gotoHadesLogout: function () {
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          window.parent.location.href = config.SAS_HOSTNAME + '/v1/auth?method=logout';
        } else {
          window.location.href = config.SAS_HOSTNAME + '/v1/auth?method=logout';
        }
      },

      /**
       * 跳轉到登入網頁
       *
       */
      gotoAccountLogin: function () {
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          window.parent.location.href = config.ACCOUNT_HOSTNAME + '/cas/logout?service=' +
            encodeURIComponent(config.DOCS_HOSTNAME);
        } else {
          window.location.href = config.ACCOUNT_HOSTNAME + '/cas/logout?service=' +
            encodeURIComponent(config.DOCS_HOSTNAME);
        }
      },

      /**
       * 回傳瀏覽器網址，在 Multi 環境下將自動回傳 parent url
       *
       * @returns {string}
       */
      getWindowUrl: function () {
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          return window.parent.location.origin + window.parent.location.pathname;
        } else {
          return window.location.origin + window.location.pathname;
        }
      },

      /**
       * 回傳主要的 Document 物件，在 Multi 環境下將自動回傳 parent document
       *
       * @returns {string}
       */
      getMainDocument: function () {
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          return window.parent.document;
        } else {
          return window.document;
        }
      },

      /**
       * 回傳 window 物件，在 Multi 環境下將自動回傳 parent window
       *
       * @returns {string}
       */
      getMainWindow: function () {
        if (window.parent.$('#apollo-multi-main').size() === 1) {
          return window.parent;
        } else {
          return window;
        }
      }
    };
  }
);

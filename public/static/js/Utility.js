'use strict';

/**
 * Apollo Utility
 *
 * 一些常用與業務邏輯無關的函式庫可以建立在這裡
 */
define(function () {
  return {
    /**
     *
     * @param rangeObj
     * @returns {*}
     */
    getSelectedRangeIDs: function (rangeObj) {
      if (rangeObj.hasrange !== true ||
        typeof rangeObj.top !== 'number' || typeof rangeObj.right !== 'number' ||
        typeof rangeObj.bottom !== 'number' || typeof rangeObj.left !== 'number') {
        return false;
      }
      var returnObj = [];
      var colIdx, rowIdx = 0;
      // From left-top to right-bottom, and top to bottom then left to right.
      for (colIdx = rangeObj.left; colIdx <= rangeObj.right; ++colIdx) {
        for (rowIdx = rangeObj.top; rowIdx <= rangeObj.bottom; ++rowIdx) {
          returnObj.push(SocialCalc.crToCoord(colIdx, rowIdx));
        }
      }
      return returnObj;
    },

    /**
     * Get browser cookie value by name
     *
     * @param {string} cookieName  Cookie name
     * @param {object} document    document
     * @returns {string}
     */
    getCookie: function (cookieName, document) {
      if (typeof(document) === 'undefined') {
        document = window.document;
      }
      var name = cookieName + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
      return '';
    },

    /**
     * Set browser cookie
     *
     * @param {string} cookieName  Cookie name
     * @param {string} value       Cookie value
     * @param {string} expire      Expire time (sec)
     * @param {string} path        Cookie path
     * @param {object} document    document
     */
    setCookie: function (cookieName, value, expire, path, document) {
      if (typeof(document) === 'undefined') {
        document = window.document;
      }
      var d = new Date();
      d.setTime(d.getTime() + expire * 1000);
      var expireStr = 'expires=' + d.toGMTString();
      var cookie = cookieName + '=' + escape(value) + '; ' + expireStr + ((path) ? '; path=' + path : '');
      document.cookie = cookie;
    }

  };
});

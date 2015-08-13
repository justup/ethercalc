'use strict';

/**
 * Logger (Singleton)
 * 記錄器，使用這個記錄器可以自動控制不同瀏覽器的行為，避免過度使用 console 在部份瀏覽器發生錯誤
 */
define(
  [
    'Apollo/Defined',
    'Apollo/Config'
  ],
  function (defined, config) {

    window.Apollo = window.Apollo || {};
    window.Apollo.Logger = {
      /**
       * Debug log output
       * 盡管輸出，在產品上線(PRODUCTION)的時候 debug 並不會被執行與輸出
       *
       * @param {object} message 輸出資料
       */
      debug: function (message) {
        if (config.Environment === Apollo.Defined.PRODUCTION) {
          return;
        }

        if (typeof(console) !== 'undefined') {
          if (arguments.length === 1) {
            console.debug(message);
          } else {
            var prepareArgs = [];
            for (var i in arguments) {
              if (arguments.hasOwnProperty(i)) {
                prepareArgs.push(arguments[i]);
              }
            }
            console.debug(prepareArgs);
          }
        }
      },
      /**
       * Error log output
       *
       * @param {object} message 輸出資料
       */
      error: function (message) {
        if (typeof(console) !== 'undefined') {
          if (arguments.length === 1) {
            console.warn(message);
          } else {
            var prepareArgs = [];
            for (var i in arguments) {
              if (arguments.hasOwnProperty(i)) {
                prepareArgs.push(arguments[i]);
              }
            }
            console.warn(prepareArgs);
          }
        }
      }
    };
    return window.Apollo.Logger;
  }
);

'use strict';

/**
 * Apollo Config (Singleton)
 *
 * 顧名思義...
 */
define(['Apollo/Defined'], function () {

  window.Apollo = window.Apollo || {};
  window.Apollo.Config = {
    /**
     * 目前的執行環境
     */
    Environment: Apollo.Defined.Environment.DEVELOPMENT,
    MenuBar: {
      /**
       * 選單的顯示 Delay Time
       */
      DelayTime: 300
    },
    ACCOUNT_HOSTNAME: 'https://account.9ifriend.com'
  };

  /**
   * 設定檔 environment.json 載入完成後會被呼叫
   *
   * @param callback
   */
  window.Apollo.Config.load = function (callback) {
    // import config from environment.json
    $.getJSON(
      './config.json',
      function (config) {
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            window.Apollo.Config[key] = config[key];
          }
        }
        callback();
      }
    );
  };

  return window.Apollo.Config;
});

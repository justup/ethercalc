'use strict';

/**
 * Apollo OAuth
 *
 */
define(
  [
    'Apollo/Utility'
  ],
  function (utility) {

    var sasHostname = 'https://sas.9ifriend.com';

    /**
     * Set Sas hostname
     *
     * @param {string} hostname
     */
    var setSasHostname = function (hostname) {
      sasHostname = hostname;
    };

    /**
     * Get Sas hostname
     *
     * @returns {string} Default is 'https://sas.9ifriend.com'
     */
    var getSasHostname = function () {
      return sasHostname;
    };

    var checkToken = function (cb) {
      var access_token, valid_time;
      var nowDataU = Math.floor(((new Date()).getTime()) / 1000);
      var matches = window.location.search.match(/^\?.*access_token=([^&]*).*valid_time=([^&]*)/);

      if (matches !== null) {
        access_token = matches[1];
        valid_time = matches[2];

        var expireTimeU = valid_time;
        var validDataU = nowDataU + parseInt(expireTimeU);

        utility.setCookie('access_token_expireDataU', validDataU, expireTimeU);
        utility.setCookie('access_token', access_token, expireTimeU);

        //redirect to home
        if (window.location.search !== '') {
          window.location = window.location.origin + window.location.pathname;
        }
        
      } else if (typeof(cb) === 'function') {
        cb(utility.getCookie('access_token'));
      }
    };

    var resetAccessTokenData = function () {
      utility.setCookie('access_token_expireDataU', '', 0);
      utility.setCookie('access_token', '', 0);
    };

    var startOAuth = function (orgPath, dom) {

      if (typeof(dom) === 'undefined') {
        dom = document;
      }

      if (typeof(orgPath) === 'undefined') {
        orgPath = window.location.origin + window.location.pathname;
      }

      resetAccessTokenData();

      var post_data = [];
      post_data.callback_url = orgPath;
      post2Url(getSasHostname() + '/v1/auth?method=doauth1', post_data, dom);

    };

    var post2Url = function (path, params, document) {

      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      var form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', path);

      for (var key in params) {
        if (params.hasOwnProperty(key)) {
          var hiddenField = document.createElement('input');
          hiddenField.setAttribute('type', 'hidden');
          hiddenField.setAttribute('name', key);
          hiddenField.setAttribute('value', params[key]);

          form.appendChild(hiddenField);
        }
      }

      document.body.appendChild(form);

      form.submit();
    };

    /**
     * 檢查登入狀態
     *
     * @returns {boolean} 是否登入
     */
    var isLogin = function () {
      var accessToken = utility.getCookie('access_token');
      return (typeof(accessToken) === 'string' &&
        accessToken !== null &&
        accessToken !== '');
    };

    /**
     * 登出，重置 Cookie 並登出 sas
     *
     * @param {function} callback
     */
    var logout = function (callback) {
      resetAccessTokenData();
      callback();
    };

    return {
      checkToken: checkToken,
      startOAuth: startOAuth,
      logout: logout,
      setSasHostname: setSasHostname,
      getSasHostname: getSasHostname,
      isLogin: isLogin
    };

  }
);
'use strict';

/**
 * Docs JavaScript SDK
 * 這支 JavaScript 可以在 Browser 與 node.js 中工作
 */
(function (name, definition) {
  if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = definition;
  } else if (typeof(define) === 'function') {
    define(definition);
  } else {
    window[name] = definition();
  }
}('FoxDocsAPI', function (initServerHostname, initLogger, request) {

  var serverHostname = 'https://docs.9ifriend.com/spreadsheet';
  var defaultAccessToken = '';
  var logger = initLogger;
  var httpClientAdapter;
  var peerLoginListener = [];
  var multiSheetIndexTpl = [
    'socialcalc:version:1.0',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    '# SocialCalc Spreadsheet Control Save',
    'version:1.0',
    'part:sheet',
    'part:edit',
    'part:audit',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    'version:1.5',
    'cell:A1:t:#url',
    'cell:B1:t:#title',
    '{MULTI_SHEET_INDEX}',
    'sheet:c:2:r:{MULTI_SHEET_MAX_ROW}:tvf:1',
    'valueformat:1:text-wiki',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    'version:1.0',
    'rowpane:0:1:1',
    'colpane:0:1:1',
    'ecell:A1',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    '--SocialCalcSpreadsheetControlSave--',
    ''
  ].join('\n');
  var emptySheetTpl = [
    'socialcalc:version:1.0',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    '# SocialCalc Spreadsheet Control Save',
    'version:1.0',
    'part:sheet',
    'part:edit',
    'part:audit',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    'version:1.5',
    'sheet:c:1:r:1:tvf:1',
    'valueformat:1:text-wiki',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    'version:1.0',
    'rowpane:0:1:1',
    'colpane:0:1:1',
    'ecell:A1',
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
    '--SocialCalcSpreadsheetControlSave--',
    ''
  ].join('\n');

  // use console replace logger
  if (typeof(logger) !== 'object' || typeof(logger.error) !== 'function' || typeof(logger.debug) !== 'function') {
    logger = {
      error: function (message) {
        if (typeof(console) !== 'undefined' && typeof(console.error) !== 'undefined') {
          console.warn(message);
        }
      },
      debug: function (message) {
        if (typeof(console) !== 'undefined' && typeof(console.debug) !== 'undefined') {
          console.debug(message);
        }
      }
    };
  }

  // initial http cilent adapter
  if (typeof(request) === 'function') {
    // nodejs request module
    httpClientAdapter = function nodejsRequestAdapter(configs, callback) {
      configs.strictSSL = false;
      request(
        configs,
        function (error, response, stdout) {
          // auto parse json
          if (typeof(response.headers['content-type']) !== 'undefined' && response.headers['content-type'].match(/application\/json/) !== null) {
            try {
              var result = JSON.parse(stdout);
              callback(null, result, response.statusCode, response);
            } catch (exception) {
              callback(exception, stdout, response.statusCode, response);
            }
            return;
          }
          callback(error, stdout, response.statusCode, response);
        }
      );
    };
  } else if (typeof(request) !== 'function') {
    // use jquery in browser environment
    httpClientAdapter = function jQueryAjaxAdapter(configs, callback) {
      var data;

      // check jQuery library
      if (typeof(jQuery) === 'undefined') {
        logger.error('jQuery library not found.');
        return;
      }

      if (configs.method !== 'GET' && typeof(configs.body) === 'object') {
        var formData = new FormData();
        for (var key in configs.body) {
          formData.append(key, configs.body[key]);
        }
        data = formData;
      } else if (typeof(configs.body) === 'string') {
        data = configs.body;
      }

      // fix url add query string
      if (configs.qs !== null && typeof(configs.qs) === 'object') {
        if (configs.uri.match(/.+\?.+/) !== null) {
          configs.uri = configs.uri + '&' + jQuery.param(configs.qs);
        } else {
          configs.uri = configs.uri + '?' + jQuery.param(configs.qs);
        }
      }

      logger.debug('Call SAS API: [' + configs.method + '] ' + configs.uri);

      // AJAX send
      jQuery.ajax({
        type: configs.method,
        url: configs.uri,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000,
        data: data,
        headers: configs.headers
      }).complete(function (jqXHR, textStatus) {

        if (textStatus === 'success') {

          // auto parser response body
          if (jqXHR.getResponseHeader('Content-Type') !== null && jqXHR.getResponseHeader('Content-Type').match(/application\/json/) !== null) {
            try {
              var result = JSON.parse(jqXHR.responseText);
              callback(null, result, jqXHR.status, jqXHR);
            } catch (exception) {
              callback(exception, jqXHR.responseText, jqXHR.status, jqXHR);
            }
            return;
          }

          callback(null, jqXHR.responseText, jqXHR.status, jqXHR);
        } else {
          callback(textStatus, jqXHR.responseText, jqXHR.status, jqXHR);
        }
      });
    };
  }

  if (typeof(initServerHostname) === 'string') {
    serverHostname = initServerHostname;
  }

  var makeRequestCallback = function (callback) {
    return function (error, result, statusCode, response) {
      // log
      if (statusCode < 200 || statusCode > 299) {
        logger.error(result);
      }
      callback(error, result, statusCode, response);
    };
  };

  return {
    /**
     * 設定 Docs Service Host
     *
     * @param {string} hostname
     */
    setServiceHost: function (hostname) {
      serverHostname = hostname;
    },

    /**
     * 取得 Docs Service Host
     *
     * @return {string}   Docs service hostname
     */
    getServiceHost: function () {
      return serverHostname;
    },

    /**
     * 設定認證預設夾帶的 Access Token
     *
     * @param {string} accessToken
     */
    setAccessToken: function (accessToken) {
      defaultAccessToken = accessToken;
    },

    /**
     * Get spreadsheet version
     *
     * @param {function} callback             Result callback
     */
    getVersion: function (callback) {
      if (typeof(callback) !== 'function') {
        callback('callback undefined.');
      }

      httpClientAdapter({
        method: 'GET',
        uri: serverHostname + '/static/version.json'
      }, makeRequestCallback(callback));
    },

    /**
     * 觸發協同編輯者登入
     *
     * @param {number} seqid        序列編號
     * @param {string} displayName  顯示名稱
     * @param {string} avatarUrl    頭像網址
     */
    firePeerLoginEvent: function (seqid, displayName, avatarUrl) {
      logger.debug('Fire event(' + peerLoginListener.length + '). Peer user login: ' + displayName + '(' + seqid + ')');
      for (var i in peerLoginListener) {
        if (typeof(peerLoginListener[i]) === 'function') {
          peerLoginListener[i](seqid, displayName, avatarUrl);
        }
      }
    },

    /**
     * 新增協同編輯者登入監聽器
     *
     * @param listener
     */
    addPeerLoginListener: function (listener) {
      if (typeof(listener) === 'function') {
        peerLoginListener.push(listener);
      }
    },

    /**
     * 取得試算表 Snapshot
     *
     * @param {string}   fileid                 試算表 fileid
     * @param {function} [callback]             Result callback
     * @param {string}   [accessToken]          雲盤 AccessToken
     */
    getSnapshot: function (fileid, callback, accessToken) {
      if (typeof(fileid) !== 'string') {
        callback('FileId undefined.');
      }
      if (typeof(callback) !== 'function') {
        callback = function () {};
      }
      if (typeof(accessToken) !== 'string') {
        accessToken = defaultAccessToken;
      }

      httpClientAdapter({
        method: 'GET',
        uri: serverHostname + '/' + fileid + '.fds',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      }, makeRequestCallback(callback));
    },

    /**
     * 取得試算表 Snapshot
     *
     * @param {string}   fileid                 試算表 fileid
     * @param {function} [callback]             Result callback
     * @param {string}   [password]             私密連結分享密碼
     * @param {string}   [accessToken]          雲盤 AccessToken
     */
    getExcelFormat: function (fileid, callback, password, accessToken) {
      if (typeof(fileid) !== 'string') {
        callback('FileId undefined.');
      }
      if (typeof(callback) !== 'function') {
        callback = function () {};
      }
      if (typeof(accessToken) !== 'string') {
        accessToken = defaultAccessToken;
      }

      httpClientAdapter({
        method: 'GET',
        uri: serverHostname + '/' + fileid + '.xlsx',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      }, makeRequestCallback(callback));
    },

    /**
     * 轉換 Multi Sheet 多個 Snapshot 合併成為單一文字檔，不需要給予 Multi Sheet Index，函式會自動產生
     * ex: input example
     *  {
     *    "Sheet Name 1": "Sheet Content 1...",
     *    "Sheet Name 2": "Sheet Content 2...",
     *    ...
     *  }
     *
     * ex: return
     *   ==Apollo-Boundary:snapshot-MultiSheetIndex==
     *   ...
     *   ==Apollo-Boundary:snapshot-SheetContent==
     *   ...
     *   ==Apollo-Boundary:snapshot-SheetContent==
     *   ...
     *
     * @param {object} multiSnapshots
     * @return {string}
     */
    covertMultiSheetSnapshotToFileContent: function (multiSnapshots) {
      var sheetName, content = '', indexCells = [], maxRow;

      if (typeof(multiSnapshots) !== 'object') {
        throw new Error('Parameter error.');
      }

      if (typeof(multiSnapshots) !== 'object') {
        logger.error('Multi snapshots not set.');
      }
      // make multi sheet index
      for (sheetName in multiSnapshots) {
        indexCells.push('cell:A' + (indexCells.length + 2) + ':t:/{FILE_ID}.' + (indexCells.length + 1) + '\ncell:B' + (indexCells.length + 2) + ':t:' + sheetName);
      }

      if (!isNaN(multiSnapshots.length)) {
        maxRow = (multiSnapshots.length + 1);
      } else {
        maxRow = 2;
      }

      content += '==Apollo-Boundary:snapshot-MultiSheetIndex==\n';
      content += multiSheetIndexTpl.replace(/\{MULTI_SHEET_MAX_ROW\}/, maxRow).replace(/\{MULTI_SHEET_INDEX\}/, indexCells.join('\n'));

      // make sheet content
      for (sheetName in multiSnapshots) {
        content += '==Apollo-Boundary:snapshot-SheetContent==\n';
        content += multiSnapshots[sheetName];
      }
      return content;
    },

    /**
     * 轉換單一文字檔轉換為 Multi Sheet Snapshot
     *
     * ex: input example
     *   ==Apollo-Boundary:snapshot-MultiSheetIndex==
     *   ...
     *   ==Apollo-Boundary:snapshot-SheetContent==
     *   ...
     *   ==Apollo-Boundary:snapshot-SheetContent==
     *   ...
     *
     * ex: return
     *  {
     *    "{FILE_ID}": "Multi Sheet Index...",
     *    "{FILE_ID}.1": "Sheet Content 1...",
     *    "{FILE_ID}.2": "Sheet Content 2...",
     *    ...
     *  }
     *
     * @param {string} apolloSnapshot      雲盤的 *.fds 檔案內容
     * @param {string} fileId              傳入 File ID 用來建立資料庫索引
     * @return {object} 轉換後的陣列
     */
    covertFileContentToMultiSheetSnapshot: function (apolloSnapshot, fileId) {
      var apolloSnapshotParts, result = {}, i;

      if (typeof(apolloSnapshot) !== 'string' ||
        typeof(fileId) !== 'string') {
        throw new Error('Parameter error.');
      }

      apolloSnapshotParts = apolloSnapshot.split(/==Apollo-Boundary:[^=]+==\n/g);
      if (apolloSnapshotParts !== null) {
        result[fileId] = apolloSnapshotParts[1].replace(/\{FILE_ID\}/gi, fileId);
        for (i = 2; i < apolloSnapshotParts.length; i++) {
          result[fileId + '.' + (i - 1)] = apolloSnapshotParts[i];
        }
      } else {
        logger.error('Multi sheet snapshot parse error:\n' + apolloSnapshot);
      }
      return result;
    },

    /**
     * 判斷 Snapshot 內容是否為 MultiSheet 索引本文
     *
     * @param {string}      snapshot
     * @returns {boolean}   是否為 Multi Sheet Snapshot
     */
    isMultiSheetSnapshot: function (snapshot) {
      // TODO: 判斷 MultiSheet 的方法應該可以更好！
      return (/.+\ncell:A1:t:#url\ncell:B1:t:#title\n.+/.exec(snapshot) !== null);
    },

    /**
     * 判斷 Snapshot 內容是否為 Apollo 專用的本文 (包含 MultiSheet 索引與內容)
     *
     * @param {string}      snapshot
     * @returns {boolean}   是否為 Apollo 專用的本文
     */
    isApolloSheetSnapshot: function (snapshot) {
      return (
        /.+\ncell:A1:t:#url\ncell:B1:t:#title\n.+/.exec(snapshot)) &&
        (/^==Apollo-Boundary:snapshot-MultiSheetIndex==/g.exec(snapshot)
      );
    },

    /**
     * 取得一個空白的 Snapshot
     *
     * @returns {*|string}
     */
    getEmptySheetSnapshot: function () {
      return emptySheetTpl;
    }

  };
}));
'use strict';

/**
 * 整合 FoxDrive 相關功能函式庫
 *
 * @param {string} config.SAS_HOSTNAME     Hades 伺服器 URL
 * @param {number} config.FILE_SYNC_TIME   資料同步間隔時間(ms)
 * @param {object} foxDriveAPI             FoxDrive API
 * @param {object} foxDocsAPI              FoxDocs API
 */
module.exports = function (config, foxDriveAPI, foxDocsAPI) {

  var logger = require('./logger');
  var step = require('step');
  var fs = require('fs');
  var path = require('path');
  var Q = require('q');
  var _SYNC_THREAD = {};
  var multiEnabled = false;

  // TODO: 應該實作一個保護機制，確保 process kill 可以回存資料

  /**
   * 回傳 Multi Sheet 啟動狀態
   * @returns {boolean}
   */
  var isMultiEnabled = function () {
    return multiEnabled;
  };

  /**
   * 從 Redis 分別取出每一張 Sheet 並且合併為 Apollo Format Snapshop 回傳
   *
   * ex: return example
   *  {
     *    "Sheet Name 1": "Sheet Content 1...",
     *    "Sheet Name 2": "Sheet Content 2...",
     *    ...
     *  }
   *
   * @param {string}   fileid
   * @param {object}   db
   * @param {function} callback
   */
  var getApolloSnapshot = function (fileid, db, callback) {
    var fn, promiseResult = {};

    if (typeof(fileid) !== 'string' || typeof(db) !== 'object' || typeof(callback) !== 'function') {
      throw new Error('Parameters error.');
    }

    // defined promise
    fn = function (room, sheetName) {
      var deferred = Q.defer();
      db.multi().get('snapshot-' + room).exec(function (_, arg$) {
        promiseResult[sheetName] = arg$[0];
        deferred.resolve(arg$[0]);
      });
      return deferred.promise;
    };

    // get index snapshot and get children sheet
    db.multi().get('snapshot-' + fileid).exec(function (_, arg$) {
      var sheetStr = [], snapshot = arg$[0], i, promiseArr = [], matchesUrl, matchesTitle;

      // parse index snapshot
      try {
        sheetStr = snapshot.split('--SocialCalcSpreadsheetControlSave')[2].match(/^[^]+\ncell:A1:t:#url\ncell:B1:t:#title\n([^]+)sheet:[^]+$/)[1].split('\n');
      } catch (e) {
        logger.error(e);
      }

      // create promise
      for (i = 0; i < sheetStr.length; i += 2) {
        if (sheetStr[i] !== '' && typeof(sheetStr[i + 1]) !== 'undefined') {
          matchesUrl = sheetStr[i].match(/^cell:[A-Z]+\d+:t:\/(.+)$/);
          matchesTitle = sheetStr[i + 1].match(/^cell:[A-Z]+\d+:t:(.+)$/);
          if (matchesUrl !== null && matchesTitle !== null) {
            promiseArr.push(fn(matchesUrl[1], matchesTitle[1]));
          } else {
            logger.error('Multi sheet index parse error.', sheetStr[i], sheetStr[i + 1]);
          }
        }
      }

      // do promise
      Q.allSettled(promiseArr).then(function () {
        var apolloSnapshot = '';
        if (promiseResult.length === 0) {
          logger.error('Multi sheet snapshot convert fail: ' + fileid);
        } else {
          apolloSnapshot = foxDocsAPI.covertMultiSheetSnapshotToFileContent(promiseResult);
          callback(apolloSnapshot);
        }
      }).done();
    });
  };

  return {

    getApolloSnapshot: getApolloSnapshot,

    /**
     * 設定 Multi Sheet 啟動狀態
     */
    setMultiEnabled: function (enabled) {
      multiEnabled = enabled;
    },

    /**
     * 由 Single Snapshot 自動在 Redis 建立 Multi Sheet Snapshot 結構
     * 自動在 Redis 建立 snapshot-{FILE_ID}.csv.json 與 snapshot-{FILE_ID}.1.csv.json
     *
     * @param {string}   snapshot     原本的 Snapshot
     * @param {string}   fileid       File ID
     * @return {object}
     */
    upgradeSnapshotToMultiSheet: function (snapshot, fileid) {
      if (typeof(snapshot) !== 'string' || typeof(fileid) !== 'string') {
        throw new Error('Parameters error.');
      }
      var apolloFormat = foxDocsAPI.covertMultiSheetSnapshotToFileContent({'Sheet': snapshot});
      return foxDocsAPI.covertFileContentToMultiSheetSnapshot(apolloFormat, fileid);
    },

    /**
     * 回存 Multi Snapshot 到 Redis 中
     *
     * @param {object} multiSnapshot
     *   {
     *     '{FILE_ID}': '{SNAPSHOT(INDEX)}',
     *     '{FILE_ID}.1': '{SNAPSHOT(SHEET_1)}',
     *     '{FILE_ID}.2': '{SNAPSHOT(SHEET_2)}',
     *     ...
     *   }
     * @param {object} db
     * @param {funciton} callback Done callback
     */
    saveMultiSheetSnapshot: function (multiSnapshot, db, callback) {
      var fn, promiseArr = [];

      if (typeof(multiSnapshot) !== 'object' || typeof(db) !== 'object' || typeof(callback) !== 'function') {
        throw new Error('Parameters error.');
      }

      // defined promise
      fn = function (room, snapshot) {
        var deferred = Q.defer();
        db.multi().set('snapshot-' + room, snapshot).exec(function () {
          logger.debug('Set snapshot to redis: ' + room + ' (size=' + snapshot.length + ')');
          deferred.resolve();
        });
        return deferred.promise;
      };

      // create promise
      for (var key in multiSnapshot) {
        promiseArr.push(fn(key, multiSnapshot[key]));
      }

      // do promise
      Q.allSettled(promiseArr).then(function () {
        callback();
      }).done();
    },

    /**
     * 建立一個可以定時同步 ethercale snapshot 到 hades 的 job
     *
     * @param {string} fileid       雲盤同步 ID
     * @param {string} accessToken  雲盤 AccessToken
     * @param {object} db           Data access object
     * @return {boolean}            建立結果
     */
    createAutoSyncJob: function (fileid, accessToken, db) {

      if (typeof(fileid) !== 'string' || typeof(accessToken) !== 'string' || typeof(db) !== 'object') {
        throw new Error('Parameters error.');
      }

      if (/(.+)\.\d+/.exec(fileid)) {
        throw new Error('Can\'t sync multi sheet fileid. ex: xxxx-xxxx-xxx.1');
      }

      if (typeof(_SYNC_THREAD[fileid]) === 'object') {
        logger.info('Sync job was existed. Upgrade access token only.', {fileid: fileid});
        _SYNC_THREAD[fileid].accessToken = accessToken;
        return false;
      }

      logger.info('Create sync thread.', {fileid: fileid});

      _SYNC_THREAD[fileid] = {};
      _SYNC_THREAD[fileid].accessToken = accessToken;
      _SYNC_THREAD[fileid].process = setInterval(function () {

        step(
          function getSnapshotFromRedis() {
            var stepThis = this;
            if (isMultiEnabled()) {
              // 如果是 MultiSheet 就要撈子資料表進行合併
              getApolloSnapshot(fileid, db, function (apolloSnapshot) {
                stepThis(null, apolloSnapshot);
              });
            } else {
              db.multi().get('snapshot-' + fileid).exec(function (_, arg$) {
                var snapshot = arg$[0];
                stepThis(null, snapshot);
              });
            }
          },
          function saveToHades(error, snapshot) {
            logger.debug('Restore snapshot to hades. (size=' + snapshot.length + ')');
            foxDriveAPI.saveFileContent(fileid, snapshot, this, _SYNC_THREAD[fileid].accessToken);
          },
          function done(error, hadesResponse) {
            if (error !== null) {
              logger.error('Restore snapshot to hades fail.', {fileid: fileid}, hadesResponse, error);
            } else {
              logger.debug('Auto sync snapshot to hades success.', {fileid: fileid});
            }
          }
        );

      }, config.FILE_SYNC_TIME);

      return true;
    },

    /**
     * 移除定時同步 ethercale snapshot 到 hades 的 job
     * 銷毀 Job 之前會先同步一次
     *
     * @param {string} fileid                 雲盤同步 ID
     * @param {object} io                     Socket.io object
     * @param {object} db                     Data access object
     * @param {string} backupDir              試算表備份資料夾位置
     */
    destoryAutoSyncJob: function (fileid, io, db, backupDir) {

      if (typeof(fileid) !== 'string' ||
        typeof(io) !== 'object' ||
        typeof(db) !== 'object') {
        throw new Error('Parameters error.');
      }

      // for auto function test will accept all
      if (/^.+_TEST$/.exec(fileid)) {
        return;
      }

      if (typeof(_SYNC_THREAD[fileid]) !== 'object') {
        logger.error('Sync job not found.', {fileid: fileid});
        return;
      }

      step(
        function getSnapshotFromRedis() {
          var stepThis = this;
          if (isMultiEnabled()) {
            // 如果是 MultiSheet 就要撈子資料表進行合併
            getApolloSnapshot(fileid, db, function (apolloSnapshot) {
              stepThis(null, apolloSnapshot);
            });
          } else {
            db.multi().get('snapshot-' + fileid).exec(function (_, arg$) {
              var snapshot = arg$[0];
              stepThis(null, snapshot);
            });
          }
        },
        function saveToHades(error, snapshot) {
          var self = this;
          logger.debug('Restore snapshot to hades. (size=' + snapshot.length + ')');
          foxDriveAPI.saveFileContent(fileid, snapshot, function (error, hadesResponse) {
            self(error, hadesResponse, snapshot);
          }, _SYNC_THREAD[fileid].accessToken);
        },
        function done(error, hadesResponse, snapshot) {
          if (error !== null) {
            logger.error(error);
          } else if (hadesResponse.data && hadesResponse.data.size) {
            logger.debug('Sync snapshot to hades.', {fileid: fileid, size: hadesResponse.data.size});
          }

          // kill restore process
          if (typeof(_SYNC_THREAD[fileid]) === 'object') {
            clearInterval(_SYNC_THREAD[fileid].process);
            logger.info('Destory sync thread.', {fileid: fileid, process: _SYNC_THREAD[fileid].process});
            delete _SYNC_THREAD[fileid];


            // backup to file and del from redis
            var dt = new Date();
            var tmpDir = backupDir + '/' + dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate();
            fs.exists(tmpDir, function (exists) {
              if (!exists) {
                fs.mkdir(tmpDir, function () {
                  logger.info('Make dir: ' + backupDir);
                });
              }
            });

            // 前期確保資料不會出錯，每次關閉都瘋狂地進備份
            var filename = path.normalize(tmpDir + '/' + fileid + '_' + dt.getHours() + dt.getMinutes() + dt.getSeconds());
            fs.writeFile(filename, snapshot, function (err) {
              if (err) {
                logger.error(err);
              } else {
                logger.info('Snapshot was saved : ' + filename);
              }
            });

//            // TODO: 改成更好的機制!?
//            var snapshots = foxDocsAPI.covertFileContentToMultiSheetSnapshot(snapshot, fileid);
//            var redis = db.multi();
//            for (var index in snapshots) {
//              logger.debug('[Redis] Del ' + index + ' (snapshot, audit, log)');
//              redis = redis.del('snapshot-' + index).del('audit-' + index).del('log-' + index);
//            }
//            redis.exec(function () {
//              console.log('[Redis] Del done. ' + fileid);
//            });
          }
        }
      );
    },

    /**
     * 讀取試算表 Snapshot 資料
     * 如果本地端資料庫有資料，就利用 API 取檔名後回傳
     * 否則就從雲盤 API 抓檔案重新更新到 Redis
     *
     * @param {string}   fileid                 雲盤 fileid
     * @param {string}   accessToken            雲盤 AccessToken
     * @param {object}   db                     Data access object
     * @param {function} callback               Result callback
     */
    getSnapshot: function (fileid, accessToken, db, callback) {

      if (typeof(fileid) !== 'string' ||
        typeof(accessToken) !== 'string' ||
        typeof(db) !== 'object' ||
        typeof(callback) !== 'function') {
        logger.error('Parameters error.');
        return false;
      }

      step(
        function getSnapshotFromRedis() {
          var next = this;
          db.multi().get('snapshot-' + fileid).lrange('log-' + fileid, 0, -1).lrange('chat-' + fileid, 0, -1).exec(function (_, arg$) {
            var snapshot, log, chat;
            snapshot = arg$[0], log = arg$[1], chat = arg$[2];
            if (snapshot !== null) {
              logger.debug('Get snapshot from redis: ' + fileid + ' (size=' + snapshot.length + ')');
              callback(snapshot, log, chat);
            } else {
              next(null, snapshot, log, chat);
            }
          });
        },
        function getSnapshotFromHades(error, log, chat) {
          // 透過雲盤 API 抓檔案
          foxDriveAPI.getFileContent(fileid, function (error, result) {
            if (error === null) {
              logger.debug('Get snapshot from hades: ' + fileid + ' (' + result.length + ')');
              if (result.length === 0) {
                logger.info('Auto create empty sheet.');
                result = foxDocsAPI.getEmptySheetSnapshot();
              }
              callback(result, log, chat);
            } else {
              logger.error('Get snapshot from hades fail.');
            }
          }, accessToken);
        }
      );

    }

  };
};

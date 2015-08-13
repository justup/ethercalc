'use strict';

define(
  [
    'Apollo/UIManager',
    'API/foxdrive-api',
    'API/foxdocs-api',
    'Apollo/Logger',
    'Static/xlsx',
    'Static/xls'
  ],
  function (uiManager, sasApi, docApi, logger) {

    var fileInput, fileName;
    var importDOM = document.getElementById('apollo-import-dialog'),
        drop = document.getElementById('apollo-import-dialog-drop'),
        dropTitle = document.getElementById('apollo-import-dialog-drop-title'),
        dropNote = document.getElementById('apollo-import-dialog-drop-note'),
        selectButton = document.getElementById('apollo-import-dialog-select');
    var rABS = typeof FileReader !== 'undefined' && typeof FileReader.prototype !== 'undefined' && typeof FileReader.prototype.readAsBinaryString !== 'undefined';

    function createApolloFile(output) {
      if (typeof fileName !== 'string' || fileName.length < 1) {
        fileName = '雲盤試算表';
      }
      fileName += '.fds';
      sasApi.createFileByString(output, fileName, 0, function (error, result, statusCode) {
        if (error !== null && statusCode !== 200) {
          uiManager.showAlertBox('警告', '建立發生錯誤！無法建立雲盤檔案。');
          logger.error('Create file fail.');
          return;
        }

        var targetWindow = window.open('./' + result.fileid, 'fd-spreadsheet-' + result.fileid);
        if (typeof(targetWindow) !== 'undefined') {
          targetWindow.focus();          
        }

        switchImpMsg(false);
      });
    }

    var process_wb = function (wb) {
      var output = '', multiSheetObjs = [], sheetName;

      if (wb.SheetNames.length > 1) {
        for (sheetName in wb.SheetNames) {
          multiSheetObjs[wb.SheetNames[sheetName]] = sheet_to_socialcalc(wb.Sheets[wb.SheetNames[sheetName]]);
        }
        output = docApi.covertMultiSheetSnapshotToFileContent(multiSheetObjs);
      } else {
        output = sheet_to_socialcalc(wb.Sheets[wb.SheetNames[0]]);
      }

      createApolloFile(output);

    };

    function fixdata(data) {
      var o = '', l = 0, w = 10240;
      for(; l<data.byteLength/w; ++l) {
        o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
      }
      o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(o.length)));
      return o;
    }

    function xlsxworker(data, cb) {
      var worker = new Worker('./static/xlsxworker.js');
      worker.onmessage = function(e) {
        switch(e.data.t) {
          case 'ready': break;
          case 'e': console.error(e.data.d); switchImpMsg(false); break; // TODO
          case 'xlsx': cb(JSON.parse(e.data.d)); break;
        }
      };
      var arr = rABS ? data : btoa(fixdata(data));
      worker.postMessage({d:arr,b:rABS});
    }

    function xlsworker(data, cb) {
      var worker = new Worker('./static/xlsworker.js');
      worker.onmessage = function(e) {
        switch(e.data.t) {
          case 'ready': break;
          case 'e': console.error(e.data.d); switchImpMsg(false); break; // TODO
          case 'xls': cb(JSON.parse(e.data.d)); break;
        }
      };
      var arr = rABS ? data : btoa(fixdata(data));
      worker.postMessage({d:arr,b:rABS});
    }


    var csv_to_socialcalc = (function() {
      var header = [
              'socialcalc:version:1.5',
              'MIME-Version: 1.0',
              'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave'
      ].join('\n');

      var sep = [
              '--SocialCalcSpreadsheetControlSave',
              'Content-type: text/plain; charset=UTF-8',
              ''
      ].join('\n');

      /* TODO: the other parts */
      var meta = [
              '# SocialCalc Spreadsheet Control Save',
              'part:sheet'
      ].join('\n');

      var end = '--SocialCalcSpreadsheetControlSave--';      

      return function socialcalcify(data) {
        data = SocialCalc.ConvertOtherFormatToSave(data, 'csv');
        return [header, sep, meta, sep, data, end].join('\n');
      };
    })();

    /* xlsx2socialcalc.js (C) 2014 SheetJS -- http://sheetjs.com */
    /* License: Apache 2.0 */
    /* vim: set ts=2: */
    var sheet_to_socialcalc = (function() {
      var header = [
              'socialcalc:version:1.5',
              'MIME-Version: 1.0',
              'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave'
      ].join('\n');

      var sep = [
              '--SocialCalcSpreadsheetControlSave',
              'Content-type: text/plain; charset=UTF-8',
              ''
      ].join('\n');

      /* TODO: the other parts */
      var meta = [
              '# SocialCalc Spreadsheet Control Save',
              'part:sheet'
      ].join('\n');

      var end = '--SocialCalcSpreadsheetControlSave--';

      var scencode = function(s) { return s.replace(/\\/g, '\\b').replace(/:/g, '\\c').replace(/\n/g,'\\n'); };

      var scsave = function scsave(ws) {
        if(!ws || !ws['!ref']) {
          return '';
        }
        var o = [], oo = [], cell, coord;
        var r = XLSX.utils.decode_range(ws['!ref']);
        for(var R = r.s.r; R <= r.e.r; ++R) {
          for(var C = r.s.c; C <= r.e.c; ++C) {
            coord = XLSX.utils.encode_cell({r:R,c:C});
            if(!(cell = ws[coord]) || cell.v == null) {
              continue;
            }
            oo = ['cell', coord, 't'];
            switch(cell.t) {
              case 's': case 'str': oo.push(scencode(cell.v)); break;
              case 'n':
                if(cell.f) {
                  oo[2] = 'vtf';
                  oo.push('n');
                  oo.push(cell.v);
                  oo.push(scencode(cell.f));
                }
                else {
                  oo[2] = 'v';
                  oo.push(cell.v);
                } break;
            }
            o.push(oo.join(':'));
          }
        }
        o.push('sheet:c:' + (r.e.c - r.s.c + 1) + ':r:' + (r.e.r - r.s.r + 1) + ':tvf:1');
        o.push('valueformat:1:text-wiki');
        o.push('copiedfrom:' + ws['!ref']);
        return o.join('\n');
      };

      return function socialcalcify(ws) {
        return [header, sep, meta, sep, scsave(ws), end].join('\n');
        //return ["version:1.5", scsave(ws)].join("\n");
      };
    })();

    function switchImpMsg (doing) {

      if (doing) {
        dropTitle.innerHTML = '匯入中...';
        dropTitle.style.color = '#000';
        dropNote.style.display = 'none';
      } else {
        dropTitle.innerHTML = '將檔案拖曳至這裡';
        dropTitle.style.color = '#ccc';
        dropNote.style.display = 'block';
        fileName = '';
      }
    }

    function readFiles (files) {
      var f, extension, reader, fileParts;

      switchImpMsg(true);

      // init FileReader
      reader = new FileReader();

      var xlsReaderOnloadCB = function(e) {
        var data = e.target.result;
        if(typeof Worker !== 'undefined') {
          xlsworker(data, process_wb);
        } else {
          var wb;
          if(rABS) {
            wb = XLS.read(data, {type: 'binary'});
          } else {
            var arr = fixdata(data);
            wb = XLS.read(btoa(arr), {type: 'base64'});
          }
          process_wb(wb);
        }
      };

      var xlsxReaderOnloadCB = function(e) {
        var data = e.target.result;
        if(typeof Worker !== 'undefined') {
          xlsxworker(data, process_wb);
        } else {
          var wb;
          if(rABS) {
            wb = XLSX.read(data, {type: 'binary'});
          } else {
            var arr = fixdata(data);
            wb = XLSX.read(btoa(arr), {type: 'base64'});
          }
          process_wb(wb);
        }
      };

      var csvReaderOnloadCB = function(e) {
        var data = e.target.result;
        if (!/^PK\u0003\u0004/.test(data) && /^[^\n]+,(?:[^\n]+)*\n/.test(data)) {
          // is csv
          data = csv_to_socialcalc(data);
          createApolloFile(data);
        }
        switchImpMsg(false);
        uiManager.hideDialog();
        uiManager.showAlertBox('警告', '不支援該類型檔案。請將檔案儲存為 .csv、.xlsx檔案，再嘗試重新匯入。');
        logger.error('Import file fail.');
      };

      // TODO: support multi files
      f = files[0];
      fileParts = f.name.split('.');
      fileName = fileParts[0];
      extension = fileParts.pop().toLowerCase();
      switch (extension) {
        case 'csv':
          reader.onload = csvReaderOnloadCB;
          reader.readAsText(f);
          break;
        case 'xls':
          reader.onload = xlsReaderOnloadCB;
          if (rABS) {
            reader.readAsBinaryString(f);
          } else {
            reader.readAsArrayBuffer(f);
          }
          break;
        case 'xlsx':
          reader.onload = xlsxReaderOnloadCB;
          if (rABS) {
            reader.readAsBinaryString(f);
          } else {
            reader.readAsArrayBuffer(f);
          }
          break;
        default:
          switchImpMsg(false);
          uiManager.hideDialog();
          uiManager.showAlertBox('警告', '不支援該類型檔案。請將檔案儲存為 .csv、.xlsx檔案，再嘗試重新匯入。');
          logger.error('Import file fail.');
          break;
      }
    }

    function handleDrop(e) {
      e.stopPropagation();
      e.preventDefault();
      var toggle = function() {
        $(drop).fadeOut('fast', function() {
          $(drop).fadeIn('fast', toggle);
        });
      };

      readFiles(e.dataTransfer.files);
    }

    function handleSelect(e) {
      var files = e.target.files;      
      readFiles(files);      
    }

    function handleDragover(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }

    var showImportDialog = function () {
      return function () {

        if(drop.addEventListener) {
          drop.addEventListener('dragenter', handleDragover, false);
          drop.addEventListener('dragover', handleDragover, false);
          drop.addEventListener('drop', handleDrop, false);
        }        

        selectButton.addEventListener('click', function () {
          fileInput = document.createElement('INPUT');
          fileInput.setAttribute('id', 'apollo-import-dialog-input');
          fileInput.setAttribute('type', 'file');
          fileInput.style.display = 'none';
          fileInput.addEventListener('change', handleSelect, false);
          dropNote.appendChild(fileInput);

          fileInput.click();

        });

        uiManager.showDialog(
          importDOM
        );
      };
    };

    return {
      showImportDialog: showImportDialog()
    };

  }
);
'use strict';

/**
 * 功能列表「格式」選單相關的控制邏輯
 */
define(
  [
    'Apollo/Global',
    'Apollo/Utility',
    'Apollo/Logger',
    'Apollo/UIManager',
    'Apollo/Handler/ValueFormat',
    'Apollo/KeyboardEvent',
    'Apollo/Topbar',
    'Apollo/EventListener'
  ],
  function (global, utility, logger, uiManager, valueFormat, keyEvt) {

    /**
     * 設定目前被選擇的儲存格垂直置中位置
     *
     * @param {string} align top|middle|bottom
     */
    var setSelectedCellVerticalAlign = function (align) {
      if (!['top', 'middle', 'bottom'].concat(align)) {
        logger.error('Parameter error.', align);
        return;
      }

      var sheetControl = SocialCalc.GetSpreadsheetControlObject();
      var editor = sheetControl.editor;
      var cellAttribs = [];
      var idx = 0;
      var cells;
      var commands;

      if (sheetControl.editor.range.hasrange) {
        cells = utility.getSelectedRangeIDs(sheetControl.editor.range);
        if (!cells) {
          return false;
        }
        for (idx = 0; idx < cells.length; ++idx) {
          cellAttribs[cells[idx]] = sheetControl.sheet.EncodeCellAttributes(cells[idx]);
        }
      } else {
        cellAttribs[sheetControl.editor.ecell.coord] = sheetControl.sheet.EncodeCellAttributes(sheetControl.editor.ecell.coord);
      }

      commands = '';
      for (idx in cellAttribs) {
        commands += 'set ' + idx + ' layout padding:';
        if (cellAttribs[idx].padtop.val !== '') {
          commands += cellAttribs[idx].padtop.val + ' ';
        } else {
          commands += '* ';
        }
        if (cellAttribs[idx].padright.val !== '') {
          commands += cellAttribs[idx].padright.val + ' ';
        } else {
          commands += '* ';
        }
        if (cellAttribs[idx].padbottom.val !== '') {
          commands += cellAttribs[idx].padbottom.val + ' ';
        } else {
          commands += '* ';
        }
        if (cellAttribs[idx].padleft.val !== '') {
          commands += cellAttribs[idx].padleft.val + ';';
        } else {
          commands += '*;';
        }

        // 處理垂直狀態
        commands += 'vertical-align:' + align + ';' + '\n';
      }
      editor.EditorScheduleSheetCommands(commands, true, false);
    };

    // 水平對齊
    Apollo.Topbar.onload(function () {
      // 水平靠左對齊
      $('#apollo-toolbar-align-left, #apollo-menubar-align-left').click(function () {
        SocialCalc.DoCmd(this, 'align-left');
        $('.apollo-menubar-align i').remove();
        $('#apollo-menubar-align-left').append('<i class="fa fa-check"></i>');
        $('#apollo-toolbar-align > i').removeAttr('class').addClass('glyphicon').addClass('glyphicon-align-left');
      });

      // 水平置中對齊
      $('#apollo-toolbar-align-center, #apollo-menubar-align-center').click(function () {
        SocialCalc.DoCmd(this, 'align-center');
        $('.apollo-menubar-align i').remove();
        $('#apollo-menubar-align-center').append('<i class="fa fa-check"></i>');
        $('#apollo-toolbar-align > i').removeAttr('class').addClass('glyphicon').addClass('glyphicon-align-center');
      });

      // 水平靠右對齊
      $('#apollo-toolbar-align-right, #apollo-menubar-align-right').click(function () {
        SocialCalc.DoCmd(this, 'align-right');
        $('.apollo-menubar-align i').remove();
        $('#apollo-menubar-align-right').append('<i class="fa fa-check"></i>');
        $('#apollo-toolbar-align > i').removeAttr('class').addClass('glyphicon').addClass('glyphicon-align-right');
      });

      // 垂直向上對齊
      $('#apollo-toolbar-vertical-top, #apollo-menubar-vertical-top').click(function () {
        setSelectedCellVerticalAlign('top');
        $('.apollo-menubar-vertical i').remove();
        $('#apollo-menubar-vertical-top').append('<i class="fa fa-check"></i>');
        $('#apollo-toolbar-vertical > i').removeAttr('class').addClass('glyphicon').addClass('glyphicon-object-align-top');
      });

      // 垂直置中對齊
      $('#apollo-toolbar-vertical-middle, #apollo-menubar-vertical-middle').click(function () {
        setSelectedCellVerticalAlign('middle');
        $('.apollo-menubar-vertical i').remove();
        $('#apollo-menubar-vertical-middle').append('<i class="fa fa-check"></i>');
        $('#apollo-toolbar-vertical > i').removeAttr('class').addClass('glyphicon').addClass('glyphicon-object-align-horizontal');
      });

      // 重值向下對齊
      $('#apollo-toolbar-vertical-bottom, #apollo-menubar-vertical-bottom').click(function () {
        setSelectedCellVerticalAlign('bottom');
        $('.apollo-menubar-vertical i').remove();
        $('#apollo-menubar-vertical-bottom').append('<i class="fa fa-check"></i>');
        $('#apollo-toolbar-vertical > i').removeAttr('class').addClass('glyphicon').addClass('glyphicon-object-align-bottom');
      });
    });


    // 設定粗體、斜體、字體大小、字體樣式、合併儲存格
    var italicClass;
    var boldClass;
    var toolbarFontSize;
    var menubarFontSize;
    var toolbarFontFamily;
    var menubarFontFamily;
    var toolbarFontSizeForFormat;
    var toolbarFontFamilyForFormat;
    var preventCellEvent = false;

    var setBold = function () {
      var cmdstr;
      // var targetCells = Apollo.FindTarget();
      var s = SocialCalc.GetSpreadsheetControlObject();
      var cellattribs = [];
      var idx = 0;
      var rangeLength = 0;
      if (s.editor.range.hasrange) {
        var cells = utility.getSelectedRangeIDs(s.editor.range);
        if (!cells) {
          return false;
        }
        rangeLength = cells.length;
        for (idx = 0; idx < cells.length; ++idx) {
          cellattribs[cells[idx]] = s.sheet.EncodeCellAttributes(cells[idx]);
        }
      } else {
        cellattribs[s.editor.ecell.coord] = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
      }

      var selectedAttribs = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
      var boldAttrib = 'bold';
      if (selectedAttribs.fontlook.val.indexOf('bold') !== -1) {
        boldAttrib = 'normal';
      }

      (boldAttrib === 'bold') ?
        // boldClass.parent().addClass('selected') : boldClass.parent().removeClass('selected');
        boldClass.addClass('selected') : boldClass.removeClass('selected');
      preventCellEvent = true;

      var counter = 0;
      var currentCellAttribs;
      var hasItalic = false;
      var hasBold = false;
      cmdstr = '';
      for (var obj in cellattribs) {
        cmdstr += 'set ' + obj + ' font ';
        currentCellAttribs = cellattribs[obj];
        hasItalic = (currentCellAttribs.fontlook.val.indexOf('italic') !== -1) ? true : false;
        hasBold = (currentCellAttribs.fontlook.val.indexOf('bold') !== -1) ? true : false;
        if (hasItalic) {
          cmdstr += 'italic ';
          cmdstr += boldAttrib;
        } else {
          cmdstr += 'normal ';
          cmdstr += boldAttrib;
        }

        // Set font family and font size to its original value.
        cmdstr += ' ';
        if (!currentCellAttribs.fontsize.def) {
          if (currentCellAttribs.fontsize.val) {
            cmdstr += currentCellAttribs.fontsize.val;
          } else {
            cmdstr += '*';
          }
        } else {
          cmdstr += '*';
        }

        cmdstr += ' ';
        if (!currentCellAttribs.fontfamily.def) {
          if (currentCellAttribs.fontfamily.val) {
            cmdstr += currentCellAttribs.fontfamily.val;
          } else {
            cmdstr += '*';
          }
        } else {
          cmdstr += '*';
        }

        if (counter < rangeLength - 1) {
          cmdstr += '\n';
        }
        ++counter;
      }

      if (cmdstr) {
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
      }
    };

    var setItalic = function () {
      var cmdstr;
      // var targetCells = Apollo.FindTarget();
      var s = SocialCalc.GetSpreadsheetControlObject();
      var cellattribs = [];
      var idx = 0;
      var rangeLength = 0;
      if (s.editor.range.hasrange) {
        var cells = utility.getSelectedRangeIDs(s.editor.range);
        if (!cells) {
          return false;
        }
        rangeLength = cells.length;
        for (idx = 0; idx < cells.length; ++idx) {
          cellattribs[cells[idx]] = s.sheet.EncodeCellAttributes(cells[idx]);
        }
      } else {
        cellattribs[s.editor.ecell.coord] = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
      }

      var selectedAttribs = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
      var italicAttrib = 'italic ';
      if (selectedAttribs.fontlook.val.indexOf('italic') !== -1) {
        italicAttrib = 'normal ';
      }

      (italicAttrib === 'italic ') ?
        // italicClass.parent().addClass('selected') : italicClass.parent().removeClass('selected');
        italicClass.addClass('selected') : italicClass.removeClass('selected');
      preventCellEvent = true;

      var counter = 0;
      var currentCellAttribs;
      var hasItalic = false;
      var hasBold = false;
      cmdstr = '';
      for (var obj in cellattribs) {
        cmdstr += 'set ' + obj + ' font ';
        currentCellAttribs = cellattribs[obj];
        hasItalic = (currentCellAttribs.fontlook.val.indexOf('italic') !== -1) ? true : false;
        hasBold = (currentCellAttribs.fontlook.val.indexOf('bold') !== -1) ? true : false;
        if (hasBold) {
          cmdstr += italicAttrib;
          cmdstr += 'bold';
        } else {
          cmdstr += italicAttrib;
          cmdstr += 'normal';
        }

        // Set font family and font size to its original value.
        cmdstr += ' ';
        if (!currentCellAttribs.fontsize.def) {
          if (currentCellAttribs.fontsize.val) {
            cmdstr += currentCellAttribs.fontsize.val;
          } else {
            cmdstr += '*';
          }
        } else {
          cmdstr += '*';
        }

        cmdstr += ' ';
        if (!currentCellAttribs.fontfamily.def) {
          if (currentCellAttribs.fontfamily.val) {
            cmdstr += currentCellAttribs.fontfamily.val;
          } else {
            cmdstr += '*';
          }
        } else {
          cmdstr += '*';
        }

        if (counter < rangeLength - 1) {
          cmdstr += '\n';
        }
        ++counter;
      }

      if (cmdstr) {
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
      }
    };

    keyEvt.addEvent('format', 'm-f-bold', keyEvt.MODKEY.CTRL, 'b', function() {
      setBold();
    });
    keyEvt.addEvent('format', 'm-f-italic', keyEvt.MODKEY.CTRL, 'i', function() {
      setItalic();
    });

    Apollo.Topbar.onload(function () {
      italicClass = $('.apollo-italic');
      boldClass = $('.apollo-bold');
      toolbarFontSize = document.getElementById('apollo-toolbar-font-size');
      toolbarFontSizeForFormat = document.getElementById('apollo-toolbar-font-size-format');
      menubarFontSize = document.getElementById('apollo-menubar-font-size');
      toolbarFontFamily = document.getElementById('apollo-toolbar-font-family');
      toolbarFontFamilyForFormat = document.getElementById('apollo-toolbar-font-family-format');
      menubarFontFamily = document.getElementById('apollo-menubar-font-family');

      $('.apollo-bold').click(function () {
        setBold();
      });

      $('.apollo-italic').click(function () {
        setItalic();
      });

      $('.apollo-font-size > li > a').click(function (evt) {
        var cmdstr;
        var size = evt.currentTarget.lastChild.nodeValue + 'pt';
        // Update Menubar and Toolbar Status.
        toolbarFontSize.innerHTML = evt.currentTarget.lastChild.nodeValue;
        toolbarFontSizeForFormat.innerHTML = evt.currentTarget.lastChild.nodeValue;
        var temp;
        temp = $('#apollo-menubar-font-size > li > a > i');
        temp.remove();
        var doms = $('#apollo-menubar-font-size > li > a:contains("' + evt.currentTarget.lastChild.nodeValue + '")');
        if (doms.length > 0) {
          $('#apollo-menubar-font-size > li > a:contains("' + evt.currentTarget.lastChild.nodeValue + '")').append('<i class="fa fa-check"></i>');
        }
        preventCellEvent = true;
        // var targetCells = Apollo.FindTarget();
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellattribs = [];
        var idx = 0;
        var rangeLength = 0;
        if (s.editor.range.hasrange) {
          var cells = utility.getSelectedRangeIDs(s.editor.range);
          if (!cells) {
            return false;
          }
          rangeLength = cells.length;
          for (idx = 0; idx < cells.length; ++idx) {
            cellattribs[cells[idx]] = s.sheet.EncodeCellAttributes(cells[idx]);
          }
        } else {
          cellattribs[s.editor.ecell.coord] = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
        }

        var counter = 0;
        var currentCellAttribs;
        var hasItalic = false;
        var hasBold = false;
        cmdstr = '';
        for (var obj in cellattribs) {
          cmdstr += 'set ' + obj + ' font ';
          currentCellAttribs = cellattribs[obj];
          // Set font italic and font bold to its original value.
          if (!currentCellAttribs.fontlook.def) {
            hasItalic = (currentCellAttribs.fontlook.val.indexOf('italic') !== -1) ? true : false;
            hasBold = (currentCellAttribs.fontlook.val.indexOf('bold') !== -1) ? true : false;
            cmdstr += (hasItalic) ? 'italic ' : 'normal ';
            cmdstr += (hasBold) ? 'bold' : 'normal';
          } else {
            cmdstr += '*';
          }

          // Set font size to input value.
          cmdstr += ' ';
          cmdstr += size;

          // Set font family to its original value.
          cmdstr += ' ';
          if (!currentCellAttribs.fontfamily.def) {
            if (currentCellAttribs.fontfamily.val) {
              cmdstr += currentCellAttribs.fontfamily.val;
            } else {
              cmdstr += '*';
            }
          } else {
            cmdstr += '*';
          }

          if (counter < rangeLength - 1) {
            cmdstr += '\n';
          }
          ++counter;
        }

        if (cmdstr) {
          s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      });

      $('.apollo-font-family > li > a').click(function (evt) {
        var cmdstr;
        var family = evt.currentTarget.lastChild.nodeValue;
        // Update Menubar and Toolbar Status.
        toolbarFontFamily.innerHTML = evt.currentTarget.lastChild.nodeValue;
        toolbarFontFamilyForFormat.innerHTML = evt.currentTarget.lastChild.nodeValue;
        var temp = $('.apollo-font-family > li > a > i');
        temp.remove();
        var doms = $('.apollo-font-family > li > a:contains("' + evt.currentTarget.lastChild.nodeValue + '")');
        if (doms.length > 0) {
          if (doms.length > 1) {
            for (var i = 0; i < doms.length; ++i) {
              if (doms[i].innerHTML === evt.currentTarget.lastChild.nodeValue) {
                var iNode = document.createElement('i');
                iNode.className = 'fa fa-check';
                doms[i].appendChild(iNode);
              }
            }
          } else {
            doms.append('<i class="fa fa-check"></i>');
          }
        }
        preventCellEvent = true;
        // var targetCells = Apollo.FindTarget();
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellattribs = [];
        var idx = 0;
        var rangeLength = 0;
        if (s.editor.range.hasrange) {
          var cells = utility.getSelectedRangeIDs(s.editor.range);
          if (!cells) {
            return false;
          }
          rangeLength = cells.length;
          for (idx = 0; idx < cells.length; ++idx) {
            cellattribs[cells[idx]] = s.sheet.EncodeCellAttributes(cells[idx]);
          }
        } else {
          cellattribs[s.editor.ecell.coord] = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
        }

        var counter = 0;
        var currentCellAttribs;
        var hasItalic = false;
        var hasBold = false;
        cmdstr = '';
        for (var obj in cellattribs) {
          cmdstr += 'set ' + obj + ' font ';
          currentCellAttribs = cellattribs[obj];
          // Set font italic and font bold to its original value.
          if (!currentCellAttribs.fontlook.def) {
            hasItalic = (currentCellAttribs.fontlook.val.indexOf('italic') !== -1) ? true : false;
            hasBold = (currentCellAttribs.fontlook.val.indexOf('bold') !== -1) ? true : false;
            cmdstr += (hasItalic) ? 'italic ' : 'normal ';
            cmdstr += (hasBold) ? 'bold' : 'normal';
          } else {
            cmdstr += '*';
          }

          // Set font size to its original value.
          cmdstr += ' ';
          if (!currentCellAttribs.fontsize.def) {
            if (currentCellAttribs.fontsize.val) {
              cmdstr += currentCellAttribs.fontsize.val;
            } else {
              cmdstr += '*';
            }
          } else {
            cmdstr += '*';
          }

          // Set font family to input value.
          cmdstr += ' ';
          cmdstr += family;

          if (counter < rangeLength - 1) {
            cmdstr += '\n';
          }
          ++counter;
        }

        if (cmdstr) {
          s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      });

      // 合併儲存格
      /**
       * Use to merge cells, behavior is mimicked Google Spreadsheet.
       * @param  {string}  type  Support only 'all', 'horizontal', and 'vertical'.
       */
      var googleStyleMerge = function (type) {
        if (!type) {
          return;
        }
        var cmdstr, mergeStr, copyPasteStr, clearStr;
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cells = s.sheet.cells;
        var cellID;
        var i, j;
        var firstAttr;
        var valCount = 0;
        var needAlert = false;
        var needCopy = true;
        var srcCellID, destCellID;
        switch (type) {
          case 'all':
            mergeStr = 'merge ';
            if (s.editor.range.hasrange) {
              cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ':' + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
            } else {
              return;
            }
            mergeStr += cellID;
            // Set value and style. (Mimic Google.)
            // Get interest cell and if we need alert.
            for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i) {
              for (j = s.editor.range.left; j <= s.editor.range.right; ++j) {
                cellID = SocialCalc.crToCoord(j, i);
                if (cells[cellID]) {
                  if (cells[cellID].datavalue !== '') {
                    if (valCount === 0) {
                      firstAttr = cells[cellID];
                      srcCellID = cellID;
                      destCellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top);
                      if (i === s.editor.range.top && j === s.editor.range.left) {
                        needCopy = false;
                      }
                    }
                    ++valCount;
                    if (valCount > 1) {
                      needAlert = true;
                    }
                  }
                }
              }
            }
            if (valCount === 0) {
              cmdstr = mergeStr;
              break;
            }
            // Generate erase command string.
            clearStr = '';
            for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i) {
              for (j = s.editor.range.left; j <= s.editor.range.right; ++j) {
                cellID = SocialCalc.crToCoord(j, i);
                if (cellID !== srcCellID) {
                  if (clearStr !== '') {
                    clearStr += '\n';
                  }
                  clearStr += 'erase ' + cellID + ' all';
                }
              }
            }
            // If first value is not left-top cell, copy it to left-top.
            if (needCopy) {
              copyPasteStr = 'copy ' + srcCellID + ' formulas';
              copyPasteStr += '\n' + 'paste ' + destCellID + ' all' + '\n' + 'paste ' + destCellID + ' formulas';
              copyPasteStr += '\n' + 'erase ' + srcCellID + ' all';
              cmdstr = clearStr + '\n' + copyPasteStr + '\n' + mergeStr;
            } else {
              cmdstr = clearStr + '\n' + mergeStr;
            }
            break;

          case 'horizontal':
            cmdstr = '';
            if (!s.editor.range.hasrange) {
              return;
            }
            for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i) {
              needCopy = true;
              valCount = 0;
              cellID = SocialCalc.crToCoord(s.editor.range.left, i) + ':' + SocialCalc.crToCoord(s.editor.range.right, i);
              mergeStr = 'merge ' + cellID;
              // One row, one set of commands.
              // Set value and style. (Mimic Google.)
              // Get interest cell and if we need alert.
              for (j = s.editor.range.left; j <= s.editor.range.right; ++j) {
                cellID = SocialCalc.crToCoord(j, i);
                if (cells[cellID]) {
                  if (cells[cellID].datavalue !== '') {
                    if (valCount === 0) {
                      firstAttr = cells[cellID];
                      srcCellID = cellID;
                      destCellID = SocialCalc.crToCoord(s.editor.range.left, i);
                      if (j === s.editor.range.left) {
                        needCopy = false;
                      }
                    }
                    ++valCount;
                    if (valCount > 1) {
                      needAlert = true;
                    }
                  }
                }
              }
              if (valCount === 0) {
                if (cmdstr === '') {
                  cmdstr += mergeStr;
                } else {
                  cmdstr += '\n' + mergeStr;
                }
                continue;
              }
              // Generate erase command string.
              clearStr = '';
              for (j = s.editor.range.left; j <= s.editor.range.right; ++j) {
                cellID = SocialCalc.crToCoord(j, i);
                if (cellID !== srcCellID) {
                  if (clearStr !== '') {
                    clearStr += '\n';
                  }
                  clearStr += 'erase ' + cellID + ' all';
                }
              }
              // If first value is not left-top cell, copy it to left-top.
              if (needCopy) {
                copyPasteStr = 'copy ' + srcCellID + ' formulas';
                copyPasteStr += '\n' + 'paste ' + destCellID + ' all' + '\n' + 'paste ' + destCellID + ' formulas';
                copyPasteStr += '\n' + 'erase ' + srcCellID + ' all';
                if (cmdstr === '') {
                  cmdstr += clearStr + '\n' + copyPasteStr + '\n' + mergeStr;
                } else {
                  cmdstr += '\n' + clearStr + '\n' + copyPasteStr + '\n' + mergeStr;
                }
              } else {
                if (cmdstr === '') {
                  cmdstr += clearStr + '\n' + mergeStr;
                } else {
                  cmdstr += '\n' + clearStr + '\n' + mergeStr;
                }
              }
            } // for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i)
            break;

          case 'vertical':
            cmdstr = '';
            if (!s.editor.range.hasrange) {
              return;
            }
            for (j = s.editor.range.left; j <= s.editor.range.right; ++j) {
              needCopy = true;
              valCount = 0;
              cellID = SocialCalc.crToCoord(j, s.editor.range.top) + ':' + SocialCalc.crToCoord(j, s.editor.range.bottom);
              mergeStr = 'merge ' + cellID;
              // One column, one set of commands.
              // Set value and style. (Mimic Google.)
              // Get interest cell and if we need alert.
              for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i) {
                cellID = SocialCalc.crToCoord(j, i);
                if (cells[cellID]) {
                  if (cells[cellID].datavalue !== '') {
                    if (valCount === 0) {
                      firstAttr = cells[cellID];
                      srcCellID = cellID;
                      destCellID = SocialCalc.crToCoord(j, s.editor.range.top);
                      if (i === s.editor.range.top) {
                        needCopy = false;
                      }
                    }
                    ++valCount;
                    if (valCount > 1) {
                      needAlert = true;
                    }
                  }
                }
              }
              if (valCount === 0) {
                if (cmdstr === '') {
                  cmdstr += mergeStr;
                } else {
                  cmdstr += '\n' + mergeStr;
                }
                continue;
              }
              // Generate erase command string.
              clearStr = '';
              for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i) {
                cellID = SocialCalc.crToCoord(j, i);
                if (cellID !== srcCellID) {
                  if (clearStr !== '') {
                    clearStr += '\n';
                  }
                  clearStr += 'erase ' + cellID + ' all';
                }
              }
              // If first value is not left-top cell, copy it to left-top.
              if (needCopy) {
                copyPasteStr = 'copy ' + srcCellID + ' formulas';
                copyPasteStr += '\n' + 'paste ' + destCellID + ' all' + '\n' + 'paste ' + destCellID + ' formulas';
                copyPasteStr += '\n' + 'erase ' + srcCellID + ' all';
                if (cmdstr === '') {
                  cmdstr += clearStr + '\n' + copyPasteStr + '\n' + mergeStr;
                } else {
                  cmdstr += '\n' + clearStr + '\n' + copyPasteStr + '\n' + mergeStr;
                }
              } else {
                if (cmdstr === '') {
                  cmdstr += clearStr + '\n' + mergeStr;
                } else {
                  cmdstr += '\n' + clearStr + '\n' + mergeStr;
                }
              }
            } // for (j = s.editor.range.left; j <= s.editor.range.right; ++j)
            break;

          default:
            return;

        }
        doMergeCommand(cmdstr, needAlert, s);
      };

      /**
       * Use to unmerge cells, behavior is mimicked Google Spreadsheet, and support range selected.
       */
      var googleStyleUnmerge = function () {
        var cmdstr;
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellID, cellIDs;
        var attr;
        var i, j, m, n;
        if (s.editor.range.hasrange) {
          cmdstr = '';
          // Search if there has merged cell.
          for (i = s.editor.range.top; i <= s.editor.range.bottom; ++i) {
            for (j = s.editor.range.left; j <= s.editor.range.right; ++j) {
              cellID = SocialCalc.crToCoord(j, i);
              attr = s.sheet.EncodeCellAttributes(cellID);
              if (attr.colspan.val === 1 && attr.rowspan.val === 1) {
                continue;
              }
              if (cmdstr !== '') {
                cmdstr += '\n';
              }
              cmdstr += 'unmerge ' + cellID;
              // Calculate range of cell IDs contained by this merged cell.
              cellIDs = [];
              var cr = SocialCalc.coordToCr(cellID);
              for (m = cr.row; m < cr.row + attr.rowspan.val; ++m) {
                for (n = cr.col; n < cr.col + attr.colspan.val; ++n) {
                  cellIDs.push(SocialCalc.crToCoord(n, m));
                }
              }
              // Copy cell format.
              cmdstr += '\n' + 'copy ' + cellID + ' all';
              // Paste cell format to other cells (ignore first cell, because it is source.).
              for (m = 1; m < cellIDs.length; ++m) {
                cmdstr += '\n' + 'paste ' + cellIDs[m] + ' formats';
              }
            }
          }
          if (cmdstr !== '') {
            s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
          }
        } else {
          attr = s.sheet.EncodeCellAttributes(s.editor.ecell.coord);
          if (attr.colspan.val === 1 && attr.rowspan.val === 1) {
            return;
          }
          cmdstr = 'unmerge ' + s.editor.ecell.coord;
          // Calculate range of cell IDs contained by this merged cell.
          cellIDs = [];
          for (i = s.editor.ecell.row; i < s.editor.ecell.row + attr.rowspan.val; ++i) {
            for (j = s.editor.ecell.col; j < s.editor.ecell.col + attr.colspan.val; ++j) {
              cellIDs.push(SocialCalc.crToCoord(j, i));
            }
          }
          // Copy cell format.
          cmdstr += '\n' + 'copy ' + s.editor.ecell.coord + ' all';
          // Paste cell format to other cells (ignore first cell, because it is source.).
          for (i = 1; i < cellIDs.length; ++i) {
            cmdstr += '\n' + 'paste ' + cellIDs[i] + ' formats';
          }
          s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        }
      };

      /**
       * Do merge command, and show alert dialog if need.
       * @param  {string}  cmd       Merge cell command.
       * @param  {boolean} needAlert TRUE represent need to alert user, or FALSE.
       * @param  {object}  ctrlObj   EtherCalc control object.
       */
      var doMergeCommand = function (cmd, needAlert, ctrlObj) {
        if (needAlert) {
          // show confirm dialog
          uiManager.showConfirmBox(
            '注意！',
            '合併後只會保留左上角儲存格的值。 確定要合併嗎？',
            function confirm() {
              ctrlObj.editor.EditorScheduleSheetCommands(cmd, true, false);
              uiManager.hideDialog();
            }
          );
        } else {
          ctrlObj.editor.EditorScheduleSheetCommands(cmd, true, false);
        }
      };

      $('.apollo-merge-all').click(function () {
        googleStyleMerge('all');
      });

      $('.apollo-merge-horizontal').click(function () {
        googleStyleMerge('horizontal');
      });

      $('.apollo-merge-vertical').click(function () {
        googleStyleMerge('vertical');
      });

      $('.apollo-unmerge').click(function () {
        googleStyleUnmerge();
      });
    });

    // 設定前景顏色
    $('#apollo-toolbar-text-color-ul').load('./static/templates/palette.html', null, function () {
      var replacedText = $('#apollo-toolbar-text-color-ul').html().replace(/\%id/g, 'apollo-toolbar-text-color');
      $('#apollo-toolbar-text-color-ul').html(replacedText);
      $('#apollo-toolbar-text-color-select-div tr > td').click(function (evt) {
        if (evt.currentTarget.className === 'palette-reset-td') {
          return;
        }
        $('#apollo-toolbar-text-color-select-div tr > td.selected > div').text('');
        $('#apollo-toolbar-text-color-select-div tr > td.selected').removeClass('selected');
        var cmdstr;
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellID;
        if (s.editor.range.hasrange) {
          cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ':' + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
        } else {
          cellID = s.editor.ecell.coord;
        }
        cmdstr = 'set ' + cellID + ' color ';
        if (evt.currentTarget.firstChild.style.backgroundColor) {
          cmdstr += evt.currentTarget.firstChild.style.backgroundColor;
          $('#apollo-toolbar-text-color-li').css('color', evt.currentTarget.firstChild.style.backgroundColor);
        }
        evt.currentTarget.firstChild.innerHTML = '&#10004;';
        evt.currentTarget.className = 'selected';
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
      });
      // 還原前景顏色至預設值
      $('#apollo-toolbar-text-color-reset-div').click(function () {
        var cmdstr;
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellID;
        if (s.editor.range.hasrange) {
          cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ':' + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
        } else {
          cellID = s.editor.ecell.coord;
        }
        cmdstr = 'set ' + cellID + ' color ';
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        // Set UI style.
        $('#apollo-toolbar-text-color-select-div tr > td.selected > div').text('');
        $('#apollo-toolbar-text-color-select-div tr > td.selected').removeClass('selected');
        var doms = $('#apollo-toolbar-text-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === 'rgb(0, 0, 0)';
        });
        if (doms.length > 0) {
          for (var i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-text-color-li').css('color', 'rgb(0, 0, 0)');
      });
    });

    // 設定背景顏色
    $('#apollo-toolbar-background-color-ul').load('./static/templates/palette.html', null, function () {
      var replacedText = $('#apollo-toolbar-background-color-ul').html().replace(/\%id/g, 'apollo-toolbar-background-color');
      $('#apollo-toolbar-background-color-ul').html(replacedText);
      $('#apollo-toolbar-background-color-select-div tr > td').click(function (evt) {
        if (evt.currentTarget.className === 'palette-reset-td') {
          return;
        }
        $('#apollo-toolbar-background-color-select-div tr > td.selected > div').text('');
        $('#apollo-toolbar-background-color-select-div tr > td.selected').removeClass('selected');
        var cmdstr;
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellID;
        if (s.editor.range.hasrange) {
          cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ':' + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
        } else {
          cellID = s.editor.ecell.coord;
        }
        cmdstr = 'set ' + cellID + ' bgcolor ';
        if (evt.currentTarget.firstChild.style.backgroundColor) {
          cmdstr += evt.currentTarget.firstChild.style.backgroundColor;
          $('#apollo-toolbar-background-color-li').css('color', evt.currentTarget.firstChild.style.backgroundColor);
        }
        evt.currentTarget.firstChild.innerHTML = '&#10004;';
        evt.currentTarget.className = 'selected';
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
      });
      // 還原背景顏色至預設值
      $('#apollo-toolbar-background-color-reset-div').click(function () {
        var cmdstr;
        var s = SocialCalc.GetSpreadsheetControlObject();
        var cellID;
        if (s.editor.range.hasrange) {
          cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ':' + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
        } else {
          cellID = s.editor.ecell.coord;
        }
        cmdstr = 'set ' + cellID + ' bgcolor ';
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
        // Set UI style.
        $('#apollo-toolbar-background-color-select-div tr > td.selected > div').text('');
        $('#apollo-toolbar-background-color-select-div tr > td.selected').removeClass('selected');
        var doms = $('#apollo-toolbar-background-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === 'rgb(255, 255, 255)';
        });
        if (doms.length > 0) {
          for (var i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-background-color-li').css('color', 'rgb(0, 0, 0)');
      });
    });

    // 設定邊框顏色顯示切換
    $('#apollo-toolbar-border-color-li').click(function () {
      $('#apollo-toolbar-border-color-li').toggleClass('active');
    });
    // 設定邊框顏色
    var borderColor = 'rgb(0, 0, 0)';
    var borderStyle = 'solid';
    $('#apollo-toolbar-border-color-ul').load('./static/templates/palette.html', null, function () {
      var replacedText = $('#apollo-toolbar-border-color-ul').html().replace(/\%id/g, 'apollo-toolbar-border-color');
      $('#apollo-toolbar-border-color-ul').html(replacedText);
      var doms = $('#apollo-toolbar-border-color-select-div tr > td > div').filter(function () {
        return $(this).css('backgroundColor') === 'rgb(0, 0, 0)';
      });
      if (doms.length > 0) {
        for (var i = 0; i < doms.length; ++i) {
          doms[i].innerHTML = '&#10004;';
        }
        doms.parent().addClass('selected');
      }
      $('#apollo-toolbar-border-color-a').css('color', borderColor);
      $('#apollo-toolbar-border-color-select-div tr > td').click(function (evt) {
        if (evt.currentTarget.className === 'palette-reset-td') {
          return;
        }
        $('#apollo-toolbar-border-color-select-div tr > td.selected > div').text('');
        $('#apollo-toolbar-border-color-select-div tr > td.selected').removeClass('selected');
        if (evt.currentTarget.firstChild.style.backgroundColor) {
          borderColor = evt.currentTarget.firstChild.style.backgroundColor;
          evt.currentTarget.firstChild.innerHTML = '&#10004;';
          evt.currentTarget.className = 'selected';
        } else {
          borderColor = 'rgb(0, 0, 0)';
          var doms = $('#apollo-toolbar-border-color-select-div tr > td > div').filter(function () {
            return $(this).css('backgroundColor') === 'rgb(0, 0, 0)';
          });
          if (doms.length > 0) {
            for (var i = 0; i < doms.length; ++i) {
              doms[i].innerHTML = '&#10004;';
            }
            doms.parent().addClass('selected');
          }
        }
        $('#apollo-toolbar-border-color-a').css('color', borderColor);
      });
      // 還原邊框顏色至預設值
      $('#apollo-toolbar-border-color-reset-div').click(function () {
        // Set UI style.
        $('#apollo-toolbar-border-color-select-div tr > td.selected > div').text('');
        $('#apollo-toolbar-border-color-select-div tr > td.selected').removeClass('selected');
        borderColor = 'rgb(0, 0, 0)';
        var doms = $('#apollo-toolbar-border-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === 'rgb(0, 0, 0)';
        });
        if (doms.length > 0) {
          for (var i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-border-color-a').css('color', borderColor);
      });
    });

    // 設定邊框
    $('#apollo-toolbar-border-left, #apollo-toolbar-border-top, #apollo-toolbar-border-right, #apollo-toolbar-border-bottom, #apollo-toolbar-border-all, #apollo-toolbar-border-none').click(function (evt) {
      var cmdstr;
      var s = SocialCalc.GetSpreadsheetControlObject();
      var cellID;
      if (s.editor.range.hasrange) {
        cellID = SocialCalc.crToCoord(s.editor.range.left, s.editor.range.top) + ':' + SocialCalc.crToCoord(s.editor.range.right, s.editor.range.bottom);
      } else {
        cellID = s.editor.ecell.coord;
      }
      // set B1 bt 1px solid rgb(0, 255, 0)
      // set B1 bl 1px solid rgb(136,136,187)
      var targetID = evt.currentTarget.id;
      if (!targetID) {
        return;
      }
      switch (targetID) {
        case 'apollo-toolbar-border-left':
          cmdstr = 'set ' + cellID + ' bl 1px ' + borderStyle + ' ' + borderColor;
          break;
        case 'apollo-toolbar-border-top':
          cmdstr = 'set ' + cellID + ' bt 1px ' + borderStyle + ' ' + borderColor;
          break;
        case 'apollo-toolbar-border-right':
          cmdstr = 'set ' + cellID + ' br 1px ' + borderStyle + ' ' + borderColor;
          break;
        case 'apollo-toolbar-border-bottom':
          cmdstr = 'set ' + cellID + ' bb 1px ' + borderStyle + ' ' + borderColor;
          break;
        case 'apollo-toolbar-border-all':
          cmdstr = 'set ' + cellID + ' bl 1px ' + borderStyle + ' ' + borderColor;
          cmdstr += '\nset ' + cellID + ' bt 1px ' + borderStyle + ' ' + borderColor;
          cmdstr += '\nset ' + cellID + ' br 1px ' + borderStyle + ' ' + borderColor;
          cmdstr += '\nset ' + cellID + ' bb 1px ' + borderStyle + ' ' + borderColor;
          break;
        case 'apollo-toolbar-border-none':
          cmdstr = 'set ' + cellID + ' bl ';
          cmdstr += '\nset ' + cellID + ' bt ';
          cmdstr += '\nset ' + cellID + ' br ';
          cmdstr += '\nset ' + cellID + ' bb ';
          break;
        default:
          break;
      }
      if (cmdstr) {
        s.editor.EditorScheduleSheetCommands(cmdstr, true, false);
      }
    });

    Apollo.EventListener.addCellFocusListener(function (cellID, attributes) {
      if (preventCellEvent) {
        preventCellEvent = false;
        return;
      }
      var i;

      // Set font related UI attributes.
      // Italic
      (attributes.fontlook.val.indexOf('italic') !== -1) ?
        italicClass.addClass('selected') : italicClass.removeClass('selected');
        // italicClass.parent().addClass('selected') : italicClass.parent().removeClass('selected');
      // Bold
      (attributes.fontlook.val.indexOf('bold') !== -1) ?
        boldClass.addClass('selected') : boldClass.removeClass('selected');
        // boldClass.parent().addClass('selected') : boldClass.parent().removeClass('selected');
      // Font Size
      var temp;
      var doms;
      temp = $('#apollo-menubar-font-size > li > a > i');
      temp.remove();
      if (attributes.fontsize.def !== true) {
        if (attributes.fontsize.val) {
          var fontsize = parseInt(attributes.fontsize.val);
          toolbarFontSize.innerHTML = fontsize.toString();
          toolbarFontSizeForFormat.innerHTML = fontsize.toString();
          doms = $('#apollo-menubar-font-size > li > a:contains("' + fontsize.toString() + '")');
          if (doms.length > 0) {
            $('#apollo-menubar-font-size > li > a:contains("' + fontsize.toString() + '")').append('<i class="fa fa-check"></i>');
          }
        }
      } else {
        // Currently, default font size is 10.
        toolbarFontSize.innerHTML = '10';
        toolbarFontSizeForFormat.innerHTML = '10';
        $('#apollo-menubar-font-size > li > a:contains("10")').append('<i class="fa fa-check"></i>');
      }
      // Font Family
      temp = $('.apollo-font-family > li > a > i');
      temp.remove();
      if (attributes.fontfamily.def !== true) {
        toolbarFontFamily.innerHTML = attributes.fontfamily.val;
        toolbarFontFamilyForFormat.innerHTML = attributes.fontfamily.val;
        doms = $('.apollo-font-family > li > a:contains("' + attributes.fontfamily.val + '")');
        if (doms.length > 0) {
          if (doms.length > 1) {
            for (i = 0; i < doms.length; ++i) {
              if (doms[i].innerHTML === attributes.fontfamily.val) {
                var iNode = document.createElement('i');
                iNode.className = 'fa fa-check';
                doms[i].appendChild(iNode);
              }
            }
          } else {
            doms.append('<i class="fa fa-check"></i>');
          }
        }
      } else {
        // Currently, default font family is Arial.
        toolbarFontFamily.innerHTML = 'Arial';
        toolbarFontFamilyForFormat.innerHTML = 'Arial';
        $('.apollo-font-family > li > a:contains("Arial")').append('<i class="fa fa-check"></i>');
      }

      // Font(foreground) color.
      $('#apollo-toolbar-text-color-select-div tr > td.selected > div').text('');
      $('#apollo-toolbar-text-color-select-div tr > td.selected').removeClass('selected');
      if (attributes.textcolor.val !== '') {
        doms = $('#apollo-toolbar-text-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === attributes.textcolor.val;
        });
        if (doms.length > 0) {
          for (i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-text-color-li').css('color', attributes.textcolor.val);
      } else {
        doms = $('#apollo-toolbar-text-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === 'rgb(0, 0, 0)';
        });
        if (doms.length > 0) {
          for (i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-text-color-li').css('color', 'rgb(0, 0, 0)');
      }

      // Cell background color.
      $('#apollo-toolbar-background-color-select-div tr > td.selected > div').text('');
      $('#apollo-toolbar-background-color-select-div tr > td.selected').removeClass('selected');
      if (attributes.bgcolor.val !== '') {
        doms = $('#apollo-toolbar-background-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === attributes.bgcolor.val;
        });
        if (doms.length > 0) {
          for (i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-background-color-li').css('color', attributes.bgcolor.val);
      } else {
        doms = $('#apollo-toolbar-background-color-select-div tr > td > div').filter(function () {
          return $(this).css('backgroundColor') === 'rgb(255, 255, 255)';
        });
        if (doms.length > 0) {
          for (i = 0; i < doms.length; ++i) {
            doms[i].innerHTML = '&#10004;';
          }
          doms.parent().addClass('selected');
        }
        $('#apollo-toolbar-background-color-li').css('color', 'rgb(255, 255, 255)');
      }

    });

    // 儲存格水平對齊狀態切換
    Apollo.EventListener.addCellFocusListener(function (cellId, attributes, cell) {
      var toolbarElements = $('#apollo-toolbar-align > i');

      // toolbar button
      toolbarElements.removeAttr('class').addClass('glyphicon');
      if (attributes.alignhoriz.val !== '') {
        toolbarElements.addClass('glyphicon-align-' + attributes.alignhoriz.val);
      } else {
        if (cell.valuetype === 'n') {
          // 數字預設靠右
          toolbarElements.addClass('glyphicon-align-right');
        } else {
          toolbarElements.addClass('glyphicon-align-left');
        }
      }

      // menubar item
      $('.apollo-menubar-align i').remove();
      if (attributes.alignhoriz.val !== '') {
        $('#apollo-menubar-align-' + attributes.alignhoriz.val).append('<i class="fa fa-check"></i>');
      } else {
        if (cell.valuetype === 'n') {
          // 數字預設靠右
          $('#apollo-menubar-align-right').append('<i class="fa fa-check"></i>');
        } else {
          $('#apollo-menubar-align-left').append('<i class="fa fa-check"></i>');
        }
      }
    });

    // 儲存格垂直對齊狀態切換
    Apollo.EventListener.addCellFocusListener(function (cellId, attributes) {
      var toolbarElements = $('#apollo-toolbar-vertical > i'),
        styleClassMaps = {
          top: 'top',
          middle: 'horizontal',
          bottom: 'bottom'
        };

      // toolbar button
      toolbarElements.removeAttr('class').addClass('glyphicon');
      if (!attributes.alignvert.def) {
        toolbarElements.addClass('glyphicon-object-align-' + styleClassMaps[attributes.alignvert.val]);
      } else {
        // 預設向下對齊
        toolbarElements.addClass('glyphicon-object-align-bottom');
      }

      // menubar item
      $('.apollo-menubar-vertical i').remove();
      if (!attributes.alignvert.def) {
        $('#apollo-menubar-vertical-' + attributes.alignvert.val).append('<i class="fa fa-check"></i>');
      } else {
        // 預設向下對齊
        $('#apollo-menubar-vertical-bottom').append('<i class="fa fa-check"></i>');
      }
    });



    var strikeShortcut = $('.apollo-strike');  // toolbar item
    var underLineShortcut = $('.apollo-underline');  // toolbar item

    // bind fntd (text-decoration) actions
    function bindfntdActions() {
      var s = SocialCalc.GetSpreadsheetControlObject();
      var attrib = 'fntdecorate';
      var none = 'none';

      var _updatefntdBtns = function(editor, cellId, attr) {
        var cellattr = attr;
        if(!cellattr) {
          var s = global.getSpreadsheetObject();
          cellattr = s.sheet.EncodeCellAttributes(cellId);
        }

        if(cellattr.fntdecorate && cellattr.fntdecorate.val.indexOf('line-through')>-1) {
          strikeShortcut.addClass('selected');
        }
        else {
          strikeShortcut.removeClass('selected');
        }

        if(cellattr.fntdecorate && cellattr.fntdecorate.val.indexOf('underline')>-1) {
          underLineShortcut.addClass('selected');
        }
        else {
          underLineShortcut.removeClass('selected');
        }

      };

      // apply fntd cmd
      // @param {string} style fntd style: none, underline or line-through
      var _applyfntdCmd = function(style) {
        var editor = s.editor,
            sheet = s.sheet;

        if(s.editor.noEdit || s.editor.ECellReadonly()) {
          return;
        }

        var cell, cmd;

        cell = sheet.GetAssuredCell(editor.ecell.coord);
        if(!cell) {
          return false;
        }

        if(cell[attrib]) {
          var i, orig=[];

          orig = SocialCalc.GetStyleString(sheet, attrib, cell[attrib]).split(' ');

          if(orig.length>0 && orig[0]!== none) {
            i = orig.indexOf(style);

            if(i<0) { // add style
              orig.push(style);
            }
            else {
              orig.splice(i, 1); // remove style
            }

            style = (orig.length>0)? orig.join(' '):none;
          }
        }

        cmd = 'fntdecorate ' + style;
        editor.EditorApplySetCommandsToRange(cmd, '');

        // update shortcut state
        _updatefntdBtns(s.editor, cell.coord, {fntdecorate:{val:style, def:false}});

        logger.debug('Format: ' + cmd);
      };

      $('.apollo-underline').click(function() {
         _applyfntdCmd('underline'); 
      });

      $(strikeShortcut).click(function() {
        _applyfntdCmd('line-through');
      });

      keyEvt.addEvent('format', 'm-f-underline', keyEvt.MODKEY.CTRL, 'u', function() {
        _applyfntdCmd('underline');

        var underlineStatus = $('.apollo-underline');

        if($(underlineStatus).hasClass('selected')){
          $(underlineStatus).removeClass('selected');
        }else{
          $(underlineStatus).addClass('selected');
        }

      });

      // subscribe moveecell listener
      Apollo.EventListener.addCellFocusListener(function (cellID, attr) { _updatefntdBtns(s.editor, cellID, attr); });

      // subscribe rangechange listener
      s.editor.RangeChangeCallback.fntdecorate = function(e) { _updatefntdBtns(e, e.ecell.coord); };
    }

    Apollo.Topbar.onload(bindfntdActions);



    /**
     * 清除格式
     * erase/copy/cut/paste/fillright/filldown A1:B5 all/formulas/format
     * Note from ethercalc.js - 2602
     *
     */
    var clearFormats = function () {
      var spreadsheet = SocialCalc.GetSpreadsheetControlObject(),
        editor = spreadsheet.editor;
      var cmd = 'erase %C formats';
      if (!editor.noEdit && !editor.ECellReadonly()) {
          spreadsheet.ExecuteCommand(cmd, '');
      }
    };
    Apollo.Topbar.onload(function () {

      $('#apollo-menubar-clear-format').click(clearFormats);

    });


    var textWrapActs = function () {
      var s = SocialCalc.GetSpreadsheetControlObject();
      var attrib = 'textwrap';

      var textwrapIcon = $('#apollo-toolbar-textwrap-autowrap').closest('li');  // toolbar item

      var _updatetwBtns = function(editor, cellId, attr) {
        var cellattr = attr;
        if(!cellattr) {
          var s = SocialCalc.GetSpreadsheetControlObject();
          cellattr = s.sheet.EncodeCellAttributes(cellId);
        }

        if(cellattr.textwrap.val==='autowrap') {
          textwrapIcon.addClass('selected');
          $('#apollo-menubar-textwrap i').remove();
          $('#apollo-menubar-textwrap-wrap').append('<i class="fa fa-check"></i>');
        } else {
          textwrapIcon.removeClass('selected');
          $('#apollo-menubar-textwrap i').remove();
          $('#apollo-menubar-textwrap-clip').append('<i class="fa fa-check"></i>');
        }
      };

      var _applytwCmd = function(style) {
        var editor = s.editor,
            sheet = s.sheet;

        if(s.editor.noEdit || s.editor.ECellReadonly()) {
          return;
        }

        var cell, orig, cmd;

        cell = sheet.GetAssuredCell(editor.ecell.coord);
        if(cell && cell[attrib]) {
          orig = SocialCalc.GetStyleString(sheet, attrib, cell[attrib]);
        }

        // toggle style
        if(style === 'auto') {
          if( orig && orig === 'autowrap') {
            style='autoclip';
          } else {
            style='autowrap';
          }
        }

        cmd = 'textwrap ' + style;
        editor.EditorApplySetCommandsToRange(cmd, '');

        // update shortcut state
        _updatetwBtns(s.editor, cell.coord, {textwrap:{val:style, def:false}});

        logger.debug('Format: ' + cmd);
      };

      $('#apollo-toolbar-textwrap-autowrap').click(function () {
        _applytwCmd('auto');
      });
      $('#apollo-menubar-textwrap-wrap').click(function () {
        _applytwCmd('autowrap');
      });
      $('#apollo-menubar-textwrap-clip').click(function () {
        _applytwCmd('autoclip');
      });

      // subscribe moveecell listener
      Apollo.EventListener.addCellFocusListener(function (cellID, attr) { _updatetwBtns(s.editor, cellID, attr); });
      // subscribe rangechange listener
      s.editor.RangeChangeCallback.textwrap = function(e) { _updatetwBtns(e, e.ecell.coord); };

    };

    Apollo.Topbar.onload(textWrapActs);

    Apollo.Topbar.onload(function () {
      $('.apollo-toolbar-dollar-value-format').click(function () {
        valueFormat.setDollarFormat();
      });
      $('.apollo-toolbar-percentage-value-format').click(function () {
        valueFormat.setPercentageFormat();
      });
      $('.apollo-toolbar-decrese-decimal-value-format').click(function () {
        valueFormat.decreseDecimal();
      });
      $('.apollo-toolbar-increse-decimal-value-format').click(function () {
        valueFormat.increseDecimal();
      });
      $('.apollo-toolbar-set-value-format').click(function () {
        valueFormat.generateNonTextValueFormatList();
        uiManager.showDialog($('#apollo-non-text-value-format-dialog'));
      });
    });

  }
);

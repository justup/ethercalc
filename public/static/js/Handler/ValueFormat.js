'use strict';

/**
 * 插入連結相關處理程式。
 */
define(
  [
    'Apollo/Global',
    'Apollo/UIManager',
    'Apollo/Logger',
    'Apollo/KeyboardEvent',
  ],
  // function (logger, keyEvt) {
  function (global, uiManager) {
    var ntvfPosSample = document.getElementById('ntvf-positive-sample');
    var ntvfNegSample = document.getElementById('ntvf-negative-sample');
    var ctrl = global.getSpreadsheetObject();
    var editor = ctrl.editor;
    var DOLLAR_FORMAT = 'NT$#,##0.00';
    var PERCENTAGE_FORMAT = '###0.00%';
    var ntvfList = [
      {format: '00', sample: '10'}, {format: '000', sample: '010'}, {format: '0000', sample: '0010'}, {format: '00000', sample: '00010'},
      {format: '#,##0', sample: '1,234'}, {format: '#,##0.0', sample: '1,234.5'}, {format: '#,##0.00', sample: '1,234.56'}, {format: '#,##0.000', sample: '1,234.567'}, {format: '#,##0.0000', sample: '1,234.5678'},
      {format: '#,##0%', sample: '1,234%'}, {format: '#,##0.0%', sample: '1,234.5%'}, {format: '#,##0.00%', sample: '1,234.56%'},
      {format: '$#,##0', sample: '$1,234'}, {format: '$#,##0.0', sample: '$1,234.5'}, {format: '$#,##0.00', sample: '$1,234.56'},
      {format: '#,##0_);(#,##0)', sample: '(1,234)'}, {format: '#,##0_);[red](#,##0)', sample: '(1,234)'}, {format: '#,##0.0_);(#,##0.0)', sample: '(1,234.5)'}, {format: '#,##0.0_);[red](#,##0.0)', sample: '(1,234.5)'}, {format: '#,##0.00_);(#,##0.00)', sample: '(1,234.56)'}, {format: '#,##0.00_);[red](#,##0.00)', sample: '(1,234.56)'},
      {format: '$#,##0_);($#,##0)', sample: '($1,234)'}, {format: '$#,##0_);[red]($#,##0)', sample: '($1,234)'}, {format: '$#,##0.0_);($#,##0.0)', sample: '($1,234.5)'}, {format: '$#,##0.0_);[red]($#,##0.0)', sample: '($1,234.5)'}, {format: '$#,##0.00_);($#,##0.00)', sample: '($1,234.56)'}, {format: '$#,##0.00_);[red]($#,##0.00)', sample: '($1,234.56)'}
    ];

    var setDollarFormat = function () {
      return function () {
        setNonTextValueFormat(DOLLAR_FORMAT);
      };
    };

    var setPercentageFormat = function () {
      return function () {
        setNonTextValueFormat(PERCENTAGE_FORMAT);
      };
    };

    var increseDecimal = function () {
      return function () {
        var format = getCurrentValueFormatString();
        var newFormat, tempFormat;
        // Split format string by ; .
        format = getCurrentValueFormatString();
        var formatStrings = format.split(';');
        newFormat = '';
        for (var i = 0; i < formatStrings.length; ++i) {
          tempFormat = '';
          if (formatStrings[i] === '' || formatStrings[i] === 'general' || formatStrings[i] === '[,]General') {
            tempFormat = getIncreasedFormatString('###0');
          } else if (formatStrings[i] === '# ??/??' || formatStrings[i] === '# ??/??') {
            tempFormat = formatStrings[i];
          } else {
            tempFormat = getIncreasedFormatString(formatStrings[i]);
          }
          if (i === 0) {
            newFormat += tempFormat;
          } else {
            newFormat = newFormat + ';' + tempFormat;
          }
        }
        console.log(newFormat);
        setNonTextValueFormat(newFormat);
      };
    };

    var decreseDecimal = function () {
      return function () {
        var format, newFormat, tempFormat;
        // Split format string by ; .
        format = getCurrentValueFormatString();
        var formatStrings = format.split(';');
        newFormat = '';
        for (var i = 0; i < formatStrings.length; ++i) {
          tempFormat = '';
          if (formatStrings[i] === '' || formatStrings[i] === 'general' || formatStrings[i] === '[,]General') {
            tempFormat = formatStrings[i];
          } else if (formatStrings[i] === '# ??/??' || formatStrings[i] === '# ??/??') {
            tempFormat = formatStrings[i];
          } else {
            tempFormat = getDecreasedFormatString(formatStrings[i]);
          }
          if (i === 0) {
            newFormat += tempFormat;
          } else {
            newFormat = newFormat + ';' + tempFormat;
          }
        }
        console.log(newFormat);
        setNonTextValueFormat(newFormat);
      };
    };

    var setNonTextValueFormat = function (formatStr) {
      var cmdstr = '';
      var cellID = '';
      if (editor.range.hasrange) {
        cellID = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ':' + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
      } else {
        cellID = editor.ecell.coord;
      }

      cmdstr = 'set ' + cellID + ' nontextvalueformat ' + formatStr;

      if (cmdstr) {
        editor.EditorScheduleSheetCommands(cmdstr, true, false);
      }
    };

    var getCurrentValueFormatString = function () {
      var attribs = ctrl.sheet.EncodeCellAttributes(editor.ecell.coord);
      return attribs.numberformat.val;
    };

    var getIncreasedFormatString = function (str) {
      // Find position to add '0'.
      var dotCount = (str.match(/\./g) || []).length;
      var lastSharpIdx;
      var lastZeroIdx;
      var lastInterestIdx;
      var dotIdx;
      var E_Idx;
      var tempSubStr;
      var rangeString;
      var i;
      var firstPart, secondPart, newSecondPart;
      if (dotCount === 0) {
        // Find E+ index.
        E_Idx = str.toLowerCase().indexOf('e+');
        if (E_Idx > -1) {
          // Check last appearance of 0 or # before E.
          tempSubStr = str.substring(0, E_Idx);
          lastSharpIdx = tempSubStr.lastIndexOf('#');
          lastZeroIdx = tempSubStr.lastIndexOf('0');
          if (lastSharpIdx === -1 && lastZeroIdx === -1) {
            return str;
          }
          lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
          return str.substr(0, lastInterestIdx + 1) + '.0' + str.substr(lastInterestIdx + 1);
        } else {
          // Find # and 0 indices.
          lastSharpIdx = str.lastIndexOf('#');
          lastZeroIdx = str.lastIndexOf('0');
          if (lastSharpIdx === -1 && lastZeroIdx === -1) {
            return str;
          }
          lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
          return str.substr(0, lastInterestIdx + 1) + '.0' + str.substr(lastInterestIdx + 1);
        }
        // Find # and 0 indices.
        // lastSharpIdx = str.lastIndexOf('#');
        // lastZeroIdx = str.lastIndexOf('0');
        // if (lastSharpIdx === -1 && lastZeroIdx === -1) {
        //   return str;
        // }
        // lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
        // return str.substr(0, lastInterestIdx + 1) + '.0' + str.substr(lastInterestIdx);
      } else if (dotCount === 1) {
        // Find . index.
        dotIdx = str.indexOf('.');
        // Find E+ index.
        E_Idx = str.toLowerCase().indexOf('e+');
        if (E_Idx > -1) {
          if (E_Idx < dotIdx) {
            firstPart = str.substr(0, E_Idx + 2);
            secondPart = str.substr(E_Idx + 2);
            newSecondPart = removeRedundantFormatStringAfterE(secondPart);
            return firstPart + newSecondPart;
          } else {
            // Check last appearance of 0 or # between . and E.
            tempSubStr = str.substring(dotIdx + 1, E_Idx + 1);
            lastSharpIdx = tempSubStr.lastIndexOf('#');
            lastZeroIdx = tempSubStr.lastIndexOf('0');
            if (lastSharpIdx === -1 && lastZeroIdx === -1) {
              return str;
            }
            lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
            return str.substr(0, (dotIdx + 1) + (lastInterestIdx + 1)) + '0' + str.substr((dotIdx + 1) + (lastInterestIdx + 1));
          }
        } else {
          // Find last appearnace of 0 or # after . .
          tempSubStr = str.substring(dotIdx + 1);
          lastSharpIdx = tempSubStr.lastIndexOf('#');
          lastZeroIdx = tempSubStr.lastIndexOf('0');
          if (lastSharpIdx === -1 && lastZeroIdx === -1) {
            return str;
          }
          lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
          return str.substr(0, (dotIdx + 1) + (lastInterestIdx + 1)) + '0' + str.substr((dotIdx + 1) + (lastInterestIdx + 1));
        } // else  --> E_Idx <= -1
      } else {
        var dotIndices;
        // Find E+ index.
        E_Idx = str.toLowerCase().indexOf('e+');
        if (E_Idx > -1) {
          tempSubStr = str.substring(0, E_Idx);
          // Find all . index.
          dotIndices = [];
          for (i = 0; i < tempSubStr.length; ++i) {
            if (tempSubStr[i] === '.') {
              dotIndices.push(i);
            }
          }
          if (dotIndices.length === 0) {
            firstPart = str.substr(0, E_Idx + 2);
            secondPart = str.substr(E_Idx + 2);
            newSecondPart = removeRedundantFormatStringAfterE(secondPart);
            return firstPart + newSecondPart;
          }
          // From end to begin, check if specific range has # or 0.
          for (i = dotIndices.length - 1; i >= 0; --i) {
            if (i === dotIndices.length - 1) {
              rangeString = str.substring(dotIndices[i], E_Idx);
            } else {
              rangeString = str.substring(dotIndices[i], dotIndices[i + 1] + 1);
            }
            lastSharpIdx = rangeString.lastIndexOf('#');
            lastZeroIdx = rangeString.lastIndexOf('0');
            if (lastSharpIdx === -1 && lastZeroIdx === -1) {
              continue;
            }
            lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
            return str.substr(0, dotIndices[i] + lastInterestIdx + 1) + '0' + str.substr(dotIndices[i] + lastInterestIdx + 1);
          }
        } else {
          // Find all . index.
          dotIndices = [];
          for (i = 0; i < str.length; ++i) {
            if (str[i] === '.') {
              dotIndices.push(i);
            }
          }
          // From end to begin, check if specific range has # or 0.
          for (i = dotIndices.length - 1; i >= 0; --i) {
            if (i === dotIndices.length - 1) {
              rangeString = str.substring(dotIndices[i], str.length + 1);
            } else {
              rangeString = str.substring(dotIndices[i], dotIndices[i + 1] + 1);
            }
            lastSharpIdx = rangeString.lastIndexOf('#');
            lastZeroIdx = rangeString.lastIndexOf('0');
            if (lastSharpIdx === -1 && lastZeroIdx === -1) {
              continue;
            }
            lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
            return str.substr(0, dotIndices[i] + lastInterestIdx + 1) + '0' + str.substr(dotIndices[i] + lastInterestIdx + 1);
          }
        }
      }
    };

    var removeRedundantFormatStringAfterE = function (str) {
      // Preserve all content before first dot(.) and first 0 or # after first dot(.), then remove rest of 0 and #.
      var firstDotIdx = str.indexOf('.');
      var firstZeroOrSharpIdx;
      var i = 0;
      var filtedStr = '';
      for (i = firstDotIdx + 1; i < str.length; ++i) {
        if (str[i] === '0' || str[i] === '#') {
          firstZeroOrSharpIdx = i;
          break;
        }
      }
      filtedStr = str.substr(0, firstZeroOrSharpIdx + 1);
      for (i = firstZeroOrSharpIdx + 1; i < str.length; ++i) {
        if (str[i] !== '0' && str[i] !== '#') {
          filtedStr = filtedStr + str[i];
        }
      }
      return filtedStr;
    };

    var getDecreasedFormatString = function (str) {
      var dotCount = (str.match(/\./g) || []).length;
      var dotIdx;
      var E_Idx;
      var firstPart, secondPart, firstDotIdx, newFirstPart, newSecondPart;
      if (dotCount === 0) {
        return str;
      } else if (dotCount === 1) {
        // Find . index.
        dotIdx = str.indexOf('.');
        // Find E+ index.
        E_Idx = str.toLowerCase().indexOf('e+');
        if (E_Idx > -1) {
          if (E_Idx < dotIdx) {
            firstPart = str.substr(0, E_Idx + 2);
            secondPart = str.substr(E_Idx + 2);
            newSecondPart = getDecreasedFormatStringAfterE(secondPart);
            return firstPart + newSecondPart;
          } else {
            // Check right-side of dot.
            firstPart = str.substr(0, E_Idx);
            secondPart = str.substr(E_Idx);
            newFirstPart = getDecreasedFormatStringBeforeE(firstPart);
            return newFirstPart + secondPart;
          }
        } else {
          return getDecreasedFormatStringBeforeE(str);
        } // else  --> E_Idx <= -1
      } else {
        E_Idx = str.toLowerCase().indexOf('e+');
        if (E_Idx > -1) {
          firstDotIdx = str.indexOf('.');
          if (firstDotIdx < E_Idx) {
            firstPart = str.substr(0, E_Idx);
            secondPart = str.substr(E_Idx);
            newFirstPart = getDecreasedFormatStringBeforeE(firstPart);
            return newFirstPart + secondPart;
          } else { // else if (firstDotIdx > E_Idx) {
            firstPart = str.substr(0, E_Idx + 2);
            secondPart = str.substr(E_Idx + 2);
            newSecondPart = getDecreasedFormatStringAfterE(secondPart);
            return firstPart + newSecondPart;
          }
        } else { // else if (E_Idx <= -1)
          return getDecreasedFormatStringBeforeE(str);
        } // else  --> E_Idx <= -1
      }
    };

    var getDecreasedFormatStringBeforeE = function (str) {
      var dotCount = (str.match(/\./g) || []).length;
      var lastSharpIdx;
      var lastZeroIdx;
      var lastInterestIdx;
      var dotIdx;
      var tempSubStr;
      var rangeString;
      var i;
      var zeroSharpCount = 0;
      var dotIndices;
      var remainZeroAndSharpCount = 0;
      if (dotCount === 0) {
        return str;
      } else if (dotCount === 1) {
        dotIdx = str.indexOf('.');
        // Find if there are # or 0 after dot(.) .
        tempSubStr = str.substring(dotIdx + 1);
        if (tempSubStr === '') {
          return str.substr(0, dotIdx);
        }
        lastSharpIdx = tempSubStr.lastIndexOf('#');
        lastZeroIdx = tempSubStr.lastIndexOf('0');
        if (lastSharpIdx === -1 && lastZeroIdx === -1) {
          return str.substr(0, dotIdx) + str.substr(dotIdx + 1);
        } else {
          // Count total number of # and 0.
          zeroSharpCount = (tempSubStr.match(/[0#]/g) || []).length;
          if (zeroSharpCount === 1) {
            // Remove . and 0 or # simultaneously.
            lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
            return str.substr(0, dotIdx) + str.substr(dotIdx + 1, lastInterestIdx) + str.substr((dotIdx + 1) + (lastInterestIdx + 1));
          } else { // zeroSharpCount > 1
            // Remove last # or 0.
            lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
            return str.substr(0, dotIdx) + str.substr(dotIdx, lastInterestIdx + 1) + str.substr((dotIdx + 1) + (lastInterestIdx + 1));
          }
        }
      } else {
        // From end to begin, check if specific range has # or 0.
        // abcdefghi.kl.op.2t
        // 012345678901234567  last => 2  dotIdx[i] => 14
        // abcdefghikl.op.2t
        // 01234567890123456789   last => 4  dotIdx[i] => 9
        // Find all . index.
        dotIndices = [];
        for (i = 0; i < str.length; ++i) {
          if (str[i] === '.') {
            dotIndices.push(i);
          }
        }
        for (i = dotIndices.length - 1; i >= 0; --i) {
          if (i === dotIndices.length - 1) {
            rangeString = str.substring(dotIndices[i], str.length + 1);
          } else {
            rangeString = str.substring(dotIndices[i], dotIndices[i + 1] + 1);
          }
          lastSharpIdx = rangeString.lastIndexOf('#');
          lastZeroIdx = rangeString.lastIndexOf('0');
          if (lastSharpIdx === -1 && lastZeroIdx === -1) {
            continue;
          }
          // If current dot(.) is first dot(.)
          if (i === 0) {
            zeroSharpCount = (rangeString.match(/[0#]/g) || []).length;
            if (zeroSharpCount === 1) {
              // Remove . and 0 or # simultaneously.
              lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
              return str.substr(0, dotIndices[i]) + str.substr(dotIndices[i] + 1, lastInterestIdx - 1) + str.substr((dotIndices[i] + 1) + (lastInterestIdx + 1 - 1));   // '-1' is for dot(.)
            } else { // zeroSharpCount > 1
              // Remove last # or 0.
              lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
              return str.substr(0, dotIndices[i]) + str.substr(dotIndices[i], lastInterestIdx) + str.substr((dotIndices[i]) + (lastInterestIdx + 1));
            }
          } else {
            // // Remove last # or 0.
            // lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
            // return str.substr(0, dotIndices[i]) + str.substr(dotIndices[i], lastInterestIdx) + str.substr((dotIndices[i]) + (lastInterestIdx + 1));
            // Check if total 0 and # remain after first dot(.) .
            tempSubStr = str.substr(dotIndices[0]);
            remainZeroAndSharpCount = (tempSubStr.match(/[0#]/g) || []).length;
            if (remainZeroAndSharpCount > 1) {
              // Remove last # or 0.
              lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
              return str.substr(0, dotIndices[i]) + str.substr(dotIndices[i], lastInterestIdx) + str.substr((dotIndices[i]) + (lastInterestIdx + 1));
            } else if (remainZeroAndSharpCount === 1) {
              // Remove last # or 0, and first dot(.).
              lastInterestIdx = (lastSharpIdx > lastZeroIdx) ? lastSharpIdx : lastZeroIdx;
              return str.substr(0, dotIndices[0]) + str.substring(dotIndices[0] + 1, dotIndices[i]) + str.substr(dotIndices[i], lastInterestIdx) + str.substr((dotIndices[i]) + (lastInterestIdx + 1));
            }
          }
        }
        // Remove first dot(.) .
        if (lastSharpIdx === -1 && lastZeroIdx === -1) {
          dotIdx = str.indexOf('.');
          return str.substr(0, dotIdx) + str.substr(dotIdx + 1);
        } else {
          return str;
        }
      }
    };

    var getDecreasedFormatStringAfterE = function (str) {
      var dotCount = (str.match(/\./g) || []).length;
      var newStr = '';
      if (dotCount === 0) {
        return str;
      } else {
        // Remove all 0, #, and first dot(.) .
        var hadRemoveDot = false;
        for (var i = 0; i < str.length; ++i) {
          if (!hadRemoveDot) {
            if (str[i] === '.') {
              hadRemoveDot = true;
            } else {
              newStr = newStr + str[i];
            }
          } else {
            if (str[i] !== '0' && str[i] !== '#') {
              newStr = newStr + str[i];
            }
          }
        }
        return newStr;
      }
    };

    var nonTextFormatStringClickCallback = function (evt) {
      $('#apollo-non-text-value-format').val($(evt.currentTarget).find('.ntvf-format').text());
      var v = $(evt.currentTarget).find('.ntvf-format').text();
      if (v === '') {
        v = 'General';
      }
      var str1 = SocialCalc.FormatNumber.formatNumberWithFormat(9.8765, v, '');
      var str2 = SocialCalc.FormatNumber.formatNumberWithFormat(-1234.5, v, '');
      ntvfPosSample.innerHTML = str1;
      if (str2 !== '??-???-??&nbsp;??:??:??') { // not bad date from negative number
        ntvfNegSample.innerHTML = str2;
      }
    };

    var generateNonTextValueFormatList = function () {
      return function () {
        var i;
        var elementUl, elementLi;
        var div1, div2;
        $('#apollo-non-text-value-format-list').html('');
        elementUl = $('<ul>');
        for (i = 0; i < ntvfList.length; ++i) {
          elementLi = $('<li>');
          div1 = $('<div class="ntvf-format">');
          div2 = $('<div class="ntvf-sample">');
          div1.text(ntvfList[i].format);
          div2.text(ntvfList[i].sample);
          elementLi.append(div1);
          elementLi.append(div2);
          elementUl.append(elementLi);
        }
        $('#apollo-non-text-value-format-list').append(elementUl);
        elementUl.find('li').click(function (evt) {
          nonTextFormatStringClickCallback(evt);
        });
      };
    };

    Apollo.Topbar.onload(function () {
      $('#apollo-non-text-value-format-confirm').click(function () {
        var formatString = $('#apollo-non-text-value-format').val();
        setNonTextValueFormat(formatString);
        uiManager.hideDialog($('#apollo-non-text-value-format-dialog'));
      });
    });

    return {
      setDollarFormat: setDollarFormat(),
      setPercentageFormat: setPercentageFormat(),
      increseDecimal: increseDecimal(),
      decreseDecimal: decreseDecimal(),
      generateNonTextValueFormatList: generateNonTextValueFormatList()
    };
  }
);

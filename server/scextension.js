SocialCalc.ExtendCmdExtension = (function() {

  // each extensionCmdObject is a CmdExtensionCallbacks object in the form
  //    {
  //      cmdname: {func:extension function, data: whatever}
  //    }
  //    cmdname is the key for 'startcmdextension' command
  //    extension function is invoked with parameters
  //      cmdname, data, sheet, SocialCalc.Parse object, saveundo
  //
  var extensionCmdObjects = {
    extpaste: {
      func: extPasteCmdFunc,
      data: null
    }
  };

  // extension function for paste special
  function extPasteCmdFunc(cmdname, data, sheet, cmd, saveundo) {
    var parts = cmd.str.split(' ');
    if (parts.length < 1 || parts[0] !== 'startcmdextension') {
      return;
    }

    var s = SocialCalc.GetSpreadsheetControlObject();
    if (!s || !SocialCalc.Clipboard.clipboard) { return; }

    var supportTypes = ['values', 'allxborders'];

    var tp = parts[parts.length - 1];  // type of special paste
    var sel = parts[parts.length - 2]; // selected range literal

    // if tp is supportive
    var test = function(t) {
      if (t === tp) {
        return true;
      }

      return false;
    };
    if (!supportTypes.some(test)) {
      return false;
    }

    var editor = s.editor,
        attribs = sheet.attribs,
        changes = sheet.changes;

    sheet.renderneeded = true;
    sheet.changedrendervalues = true;
    if (saveundo) {
      changes.AddUndo('changedrendervalues');
    } // to take care of undone pasted spans

    var clipsheet, cliprange, cr1, cr2, coloffset, rowoffset, numcols, numrows;

    var ParseRange = function() {
      var prange = SocialCalc.ParseRange(sel);
      cr1 = prange.cr1;
      cr2 = prange.cr2;
      if (cr2.col > attribs.lastcol) {
        attribs.lastcol = cr2.col;
      }
      if (cr2.row > attribs.lastrow) {
        attribs.lastrow = cr2.row;
      }
    };

    ParseRange();

    clipsheet = new SocialCalc.Sheet(); // load clipboard contents as another sheet
    clipsheet.ParseSheetSave(SocialCalc.Clipboard.clipboard);
    cliprange = SocialCalc.ParseRange(clipsheet.copiedfrom);
    coloffset = cr1.col - cliprange.cr1.col; // get sizes, etc.
    rowoffset = cr1.row - cliprange.cr1.row;
    numcols = Math.max(cr2.col - cr1.col + 1, cliprange.cr2.col - cliprange.cr1.col + 1);
    numrows = Math.max(cr2.row - cr1.row + 1, cliprange.cr2.row - cliprange.cr1.row + 1);

    if (cr1.col + numcols - 1 > attribs.lastcol) {
      attribs.lastcol = cr1.col + numcols - 1;
    }
    if (cr1.row + numrows - 1 > attribs.lastrow) {
      attribs.lastrow = cr1.row + numrows - 1;
    }

    var row, col, cr, cell, crbase, basecell;
    var cellProperties = SocialCalc.CellProperties, attr, attrtable;

    for (row = cr1.row; row < cr1.row + numrows; row++) {
      for (col = cr1.col; col < cr1.col + numcols; col++) {
        cr = SocialCalc.crToCoord(col, row);
        cell = sheet.GetAssuredCell(cr);

        if (cell.readonly) { continue; }
        if (saveundo) {
          changes.AddUndo('set ' + cr + ' all', sheet.CellToString(cell));
        }

        crbase = SocialCalc.crToCoord(cliprange.cr1.col + ((col - cr1.col) % (cliprange.cr2.col - cliprange.cr1.col + 1)), cliprange.cr1.row + ((row - cr1.row) % (cliprange.cr2.row - cliprange.cr1.row + 1)));
        basecell = clipsheet.GetAssuredCell(crbase);

        if (tp === 'values') {
          cell.datavalue = basecell.datavalue;
          cell.valuetype = basecell.valuetype;

          if (basecell.datatype !== 'f') {
            cell.datatype = basecell.datatype;
          }
          else {

            if (basecell.valuetype === 'n') {
              cell.datatype = 'v'; // numeric
            }
            if (basecell.valuetype === 't') {
              cell.datatype = 't'; // text
            }
          }
        }
        else if (tp === 'allxborders') {

          // copy format attributes
          for (attr in cellProperties) {

            if (cellProperties[attr] === 1) { continue; }
            if(/^b[trbl]$/.test(attr)) { continue; }      // borderstyle excluded

            if (typeof basecell[attr] === undefined || cellProperties[attr] === 3) {
              delete cell[attr];
            }
            else {
              attrtable = SocialCalc.CellPropertiesTable[attr];
              if (attrtable && basecell[attr]) { // table indexes to expand to strings since other sheet may have diff indexes
                cell[attr] = sheet.GetStyleNum(attrtable, clipsheet.GetStyleString(attrtable, basecell[attr]));
              }
              else {
                cell[attr] = basecell[attr];
              }
            }
          }

          cell.datavalue = basecell.datavalue;
          cell.datatype = basecell.datatype;
          cell.valuetype = basecell.valuetype;

          if (cell.datatype === 'f') { // offset relative coords
            cell.formula = SocialCalc.OffsetFormulaCoords(basecell.formula, coloffset, rowoffset);
          }
          else {
            cell.formula = basecell.formula;
          }

          delete cell.parseinfo;
          cell.errors = basecell.errors;

          if (basecell.comment) { // comments are pasted as part of content, though not filled, etc.
            cell.comment = basecell.comment;
          }
          else if (cell.comment) {
            delete cell.comment;
          }

          delete cell.displaystring;
        }

        delete cell.displaystring;
      }
    }

    attribs.needsrecalc = 'yes';
  } // end of extPasteCmdFunc


  return {
    // add extensions to sheetobj  (invoked in SocialCalc.ResetSheet)
    Add:function(sheetobj) {
      var sci = sheetobj.sci;

      Object.keys(extensionCmdObjects).forEach(function(k) {
        sci.CmdExtensionCallbacks[k] = extensionCmdObjects[k];
      });
    }
  };

})();

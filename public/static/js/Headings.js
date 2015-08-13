'use strict';

// controller of the heading column(row)
define(['Apollo/Logger', 'Apollo/Global'], function(logger, global) {

  // selected column
  var selCol = {
    selected: false,
    r: null
  };

  // selected row
  var selRow = {
    selected: false,
    r: null
  };

  /**
   *  get sheet's boundary
   *
   *  @returns {Object.{ from:string, to:string, lastrow:int, lastcol:int, lastcolname: string}}
   *
   *   from: coord of left-top cell
   *   to:   coord of right-bottom cell
   *   lastrow:  last row#
   *   lastcol:  last column#
   *   lastcolname: literal expression of the last column
   */
  function getSheetBoundary() {
    var context, lastRow, lastCol, lastColname;

    // renderContext
    context = global.getSpreadsheetObject().context;

    lastRow = context.rowheight.length - 1;
    lastCol = context.colwidth.length - 1;
    lastColname = SocialCalc.rcColname(lastCol);

    return {
      from: SocialCalc.rcColname(1) + 1, // first column of the first row
      to: lastColname + lastRow,         // last column of the last row
      lastrow:lastRow,
      lastcol:lastCol,
      lastcolname:lastColname
    };
  }

  /**
   *  get column's range object
   *
   *  @param {int} column's number
   *  @returns {Object.{ from:string, to:string, colname:string,
   *     first:int, last:int, col:int }}
   *
   *   from(to): coord of start and end position
   *   first:    started row#
   *   last:     ended row#
   *   colname:  column's heading letter
   *   col:      column's number
   */
  function rangeColumn(colnum) {
    var boundary = getSheetBoundary();

    // heading letter of the selected column
    var colname = SocialCalc.rcColname(colnum);

    var firstRow = 1;

    return {
      from: colname + firstRow,
      to: colname + boundary.lastrow,
      first: firstRow,
      last: boundary.lastrow,
      col: colnum,
      colname: colname
    };
  }


  /**
   *  get row's range object
   *
   *  @param {int} row's number
   *  @returns {Object.{ from:string, to:string,
   *     first:int, last:int, row:int }}
   *
   *   from(to): coord of start and end position
   *   first:    started col#
   *   last:     ended col#
   *   row:      row's number
   */
  function rangeRow(rownum) {
    var boundary = getSheetBoundary();

    // first column of the range
    var firstCol = 1;

    return {
      from: SocialCalc.rcColname(firstCol) + rownum,
      to:   boundary.lastcolname + rownum,
      first: firstCol,
      last: boundary.lastcol,
      row: rownum
    };
  }

  // @param {TableEditor} editor
  function extendSelectedColumn(editor) {
    if (!selCol.selected || !selCol.r) {
      return;
    }

    // just in case
    if (!editor || !editor.rowheight) {
      return;
    }

    var r, currBottom;

    r = selCol.r;
    currBottom = editor.rowheight.length - 1; // since the started idx is 1

    if (currBottom > r.last) {
      r.to = r.colname + currBottom;
      r.last = currBottom;

      // update editor's range
      editor.range.anchorcoord = r.to;
      editor.range.anchorrow = r.last;
      editor.RangeExtend();
      loginfo();
    }
  }
  // @param {TableEditor} editor
  function extendSelectedRow(editor) {
    if (!selRow.selected || !selRow.r) {
      return;
    }

    // just in case
    if (!editor || !editor.colwidth) {
      return;
    }

    var r, currRight;

    r = selRow.r;
    currRight = editor.colwidth.length - 1;

    if (currRight > r.last) {
      r.to = SocialCalc.rcColname(currRight) + r.row;
      r.last = currRight;

      // update editor's range
      editor.range.anchorcoord = r.to;
      editor.range.anchorcol = r.last;
      editor.RangeExtend();
      loginfo();
    }
  }

  // log currently selected row/col range
  function loginfo() {

    if(selRow.selected) {
      logger.debug('Heading: row#'+ selRow.r.row     +'  [' + selRow.r.from + ':' + selRow.r.to + ']');
    }
    else if(selCol.selected) {
      logger.debug('Heading: col#'+ selCol.r.colname +'  [' + selCol.r.from + ':' + selCol.r.to + ']');
    }
    else {
      logger.debug('Heading: no selected row/col');
    }
  }

  // select entire column
  function selectColumn(colnum) {
    var ssEditor = global.getSpreadsheetObject().editor;
    var range, r;

    ssEditor.headerselected = true;

    range = ssEditor.range;
    r = rangeColumn(colnum);

    // clear previos range
    if (range.hasrange) {
      ssEditor.RangeRemove();
    }

    // set up new range
    range.anchorcoord = r.to;
    range.anchorrow = r.last;
    range.anchorcol = r.col;
    range.top = r.first;
    range.left = r.col;
    range.bottom = r.last;
    range.right = r.col;
    range.hasrange = true;

    selCol.selected = true;
    selCol.r = r;

    // move to first cell of the column
    ssEditor.MoveECell(r.from);

    // hightlight range
    ssEditor.RangeExtend();
  }
  // select entire row
  function selectRow(rownum) {
    var ssEditor = global.getSpreadsheetObject().editor;
    var range, r;

    ssEditor.headerselected = true;

    range = ssEditor.range;
    r = rangeRow(rownum);

    // clear previos range
    if (range.hasrange) {
      ssEditor.RangeRemove();
    }

    // set up new range
    range.anchorcoord = r.to;
    range.anchorrow = r.row;
    range.anchorcol = r.last;
    range.top = r.row;
    range.left = r.first;
    range.bottom = r.row;
    range.right = r.last;
    range.hasrange = true;

    selRow.selected = true;
    selRow.r = r;

    // move to first cell of the column
    ssEditor.MoveECell(r.from);

    // hightlight range
    ssEditor.RangeExtend();
  }

  function clearSelection() {
    selCol.r = null;
    selCol.selected = false;

    selRow.r = null;
    selRow.selected = false;
  }

 /**
  * @param {HTMLElement} ele
  * @param {int}  clientX  horizontal coordinate of mouse pointer
  * @param {int}  clientY  vertical coordinate of mouse pointer
  * @param {char} cr  intended lookup heading, 'c'(column) or 'r'(row)
  * @returns {Object}  {row, col, colheader: bool, distance:int, coltoresize:int}
  */
  function getGridPosition(ele, clientX, clientY, cr) {
    if (!ele) { return false; }

    var mouseinfo, mobj;

    mouseinfo = SocialCalc.EditorMouseInfo;
    for (mobj = null; !mobj && ele; ele = ele.parentNode) { // go up tree looking for one of our elements
      mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements); // registeredElement is an obj of {editor, element}
    }

    // {editor: SocialCalc.TableEditor, element: table#te_fullgrid}
    if (!mobj) {
      mouseinfo.editor = null;
      return false;
    }

    mouseinfo.element = ele;
    var ssEditor = global.getSpreadsheetObject().editor;
    var pos, cx, cy, result;

    pos = SocialCalc.GetElementPositionWithScroll(ssEditor.toplevel);

    cx = clientX - pos.left;
    cy = clientY - pos.top;

    // {row: 1, col: 5, colheader: true, distance: 8, coltoresize: 4}
    result = SocialCalc.GridMousePosition(ssEditor, cx, cy);

    switch(cr) {
      case 'c':
        if (!result.colheader) { return false;}
        break;

      case 'r':
        if (!result.rowheader) { return false;}
        break;
    }

    return result;
  }

  /**
   * @param {string} order 'up' or 'down'
   */
  function doColSort(order) {
    var editor, boundary;

    if (!selCol.r) { // currently selected cloumn range must be set
      return;
    }

    editor = global.getSpreadsheetObject().editor;
    boundary = getSheetBoundary();

    // sort A1:B14 A down B down
    var str = 'sort ' + boundary.from + ':' + boundary.to + ' ' + selCol.r.colname + ' ' + order;
    logger.debug('Headings: ' + str);
    editor.EditorScheduleSheetCommands(str, true, false);
  }

  // hack SocialCalc's EditorRow(Col)sizeMouseDown to prevent right-click from working
  (function interceptRCszMouseDown() {

    var isRightClick = function(e) {
      var evt = e || window.event;
      if (evt.which === 3) {
        return true;
      }

      return false;
    };

    SocialCalc.OrigProcessEditorRowsizeMouseDown = SocialCalc.ProcessEditorRowsizeMouseDown;
    SocialCalc.OrigProcessEditorColsizeMouseDown = SocialCalc.ProcessEditorColsizeMouseDown;

    SocialCalc.ProcessEditorColsizeMouseDown = function(e, ele, result) {
      clearSelection();
      if (isRightClick(e)) {
        return true;
      }

      return SocialCalc.OrigProcessEditorColsizeMouseDown(e, ele, result);
    };
    SocialCalc.ProcessEditorRowsizeMouseDown = function(e, ele, result) {
      if (isRightClick(e)) {
        return true;
      }

      return SocialCalc.OrigProcessEditorRowsizeMouseDown(e, ele, result);
    };

  })(); // END OF interceptRCszMouseDown

  return {
    columns: {
      select: selectColumn,
      updateRange: extendSelectedColumn,
      sort: doColSort
    },

    rows: {
      select: selectRow,
      updateRange: extendSelectedRow,
    },

    getColPosition: function(ele, clientX, clientY) {
      return getGridPosition(ele, clientX, clientY, 'c');
    },

    getRowPosition: function(ele, clientX, clientY) {
      return getGridPosition(ele, clientX, clientY, 'r');
    }
  };
});

'use strict';

/**
 * 用來處理 UI 相關的函式庫，包括整份試算表共用的 UI 元件控制，像是 Dialog, MessageBox 等等
 */
define(
  [],
  function () {

    var showDialog, hideDialog, inited = false;

    /**
     * 預設的按鈕文字
     */
    var defaultButtonText = {
      alert: {
        ok: 'OK'
      },
      confirm: {
        ok: 'OK',
        cancel: 'CANCEL'
      }
    };

    /**
     * Show dialog by element
     *
     * @param {object}   dialogElement    Element object
     * @param {function} [confirmCallback]  The callback will be invoke when OK(.dialog-confirm) button press
     * @param {function} [cancelCallback]   The callback will be invoke when Cancel(.dialog-cancel) button press
     */
    showDialog = function (dialogElement, confirmCallback, cancelCallback) {
      // Calculate center of screen.
      var element = $(dialogElement);
      var confirmButton;
      var cancelButton;
      var closeButton;

      // 攔截 SocialCalc Keyboard Event
      if (typeof(SocialCalc) !== 'undefined' && typeof(SocialCalc.CmdGotFocus) === 'function') {
        SocialCalc.CmdGotFocus(dialogElement);
      }

      $('#screen-overlay').show();

      element.show();
      var h = $(element[0]).height();
      var w = $(element[0]).width();
      var dh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      var dw = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      element.css('top', ((dh - h) / 2) + 'px');
      element.css('left', ((dw - w) / 2) + 'px');

      confirmButton = element.find('.apollo-dialog-footer button.dialog-confirm');
      confirmButton.unbind();
      if (typeof(confirmCallback) === 'function') {
        confirmButton.click(confirmCallback);
      } else {
        // default close overlay
        confirmButton.click(hideDialog);
      }

      cancelButton = element.find('.apollo-dialog-footer button.dialog-cancel');
      cancelButton.unbind();
      if (typeof(cancelCallback) === 'function') {
        cancelButton.click(cancelCallback);
      } else {
        // default close overlay
        cancelButton.click(hideDialog);
      }

      closeButton = element.find('button.apollo-dialog-close');
      closeButton.unbind().click(hideDialog);

      // Esc to close
      if (inited === false) {
        $(document).on('keydown', function (evt) {
          // mask 沒有出現就不執行關閉
          if (closeButton.size() > 0 && evt.keyCode === 27 && $('#screen-overlay').css('display') !== 'none') {
            hideDialog();
          }
        });
        inited = true;
      }
    };

    /**
     * Hide all dialog
     */
    hideDialog = function () {
      $('.apollo-dialog').hide();
      $('#screen-overlay').hide();

      // 還原 SocialCalc Keyboard Event
      if (typeof(SocialCalc) !== 'undefined' && typeof(SocialCalc.KeyboardFocus) === 'function') {
        SocialCalc.KeyboardFocus();
      }
    };

    return {

      /**
       * 設定瀏覽器 Title，會自動依據 Multi Sheet 環境設定到 parent window
       * @param title
       */
      setTitle: function (title) {
        $('title').text(title);
        if (typeof(window.parent.$) !== 'undefined') {
          window.parent.$('title').text(title);
        }
      },

      /**
       * 遮蔽整個畫面顯示 Loading
       */
      showLoading: function () {
        if ($('#init-ldg div').size() === 0) {
          $('#init-ldg').load('./static/templates/loading.html', null, function () {
            $('#init-ldg').show();
          });
        } else {
          $('#init-ldg').show();
        }
      },

      /**
       * 關閉 Loading 畫面
       */
      hideLoading: function () {
        $('#init-ldg').hide();
      },

      showDialog: showDialog,

      hideDialog: hideDialog,

      /**
       * 顯示含有「確定」與「取消」兩個按鈕的 Dialog
       *
       * @param {string}   title                Dialog title
       * @param {string}   message              Dialog text
       * @param {function} [confirmCallback]    按下「確定」所執行的 Callback，預設會關閉 Dialog
       * @param {function} [cancelCallback]     按下「取消」所執行的 Callback，預設會關閉 Dialog
       * @param {string}   [okButtonText]      「確定」按鈕文字
       * @param {string}   [cancelButtonText]  「取消」按鈕文字
       */
      showConfirmBox: function (title, message, confirmCallback, cancelCallback, okButtonText, cancelButtonText) {

        $('#apollo-confirm-dialog-message').text(message);
        $('#apollo-confirm-dialog-title').text(title);

        if (typeof(okButtonText) === 'string') {
          $('#apollo-confirm-dialog button.dialog-confirm').text(okButtonText);
        } else {
          $('#apollo-confirm-dialog button.dialog-confirm').text(defaultButtonText.confirm.ok);
        }

        if (typeof(cancelButtonText) === 'string') {
          $('#apollo-confirm-dialog button.dialog-cancel').text(cancelButtonText);
        } else {
          $('#apollo-confirm-dialog button.dialog-cancel').text(defaultButtonText.confirm.cancel);
        }

        showDialog($('#apollo-confirm-dialog'), confirmCallback, cancelCallback);
      },

      /**
       * 顯示「確定」按鈕的 Dialog，用來顯示一般的訊息，沒有回呼可以使用
       *
       * @param {string}   title              Dialog title
       * @param {string}   message            Dialog text
       * @param {function} [closeCallback]    按下「確定」所執行的 Callback
       * @param {string}   [buttonText]       按鈕文字
       */
      showAlertBox: function (title, message, closeCallback, buttonText) {

        $('#apollo-alert-dialog-message').text(message);
        $('#apollo-alert-dialog-title').text(title);

        if (typeof(buttonText) === 'string') {
          $('#apollo-alert-dialog button.dialog-confirm').text(buttonText);
        } else {
          $('#apollo-alert-dialog button.dialog-confirm').text(defaultButtonText.alert.ok);
        }

        showDialog($('#apollo-alert-dialog'), closeCallback);
      },

      /**
       * 建立 apollo-dialog 可以被拖曳的 event
       */
      init: function () {
        /**
         * Set Merge Confirm Dialog to draggable.
         */
        var setDialogDraggable = function () {
          var h;
          var w;
          var isDragging = false;
          var lastX;
          var lastY;
          var tempTop;
          var tempLeft;
          var targetDom;

          var draggingFunc = function (evt) {
            if (evt.currentTarget.className.indexOf('apollo-link-dialog') !== -1 || evt.currentTarget.className.indexOf('apollo-link-info') !== -1) {
              return;
            }
            targetDom = this;
            if (evt.target !== targetDom) {
              return;
            }
            h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            $(document).mousemove(function (evt) {
              if (isDragging) {
                tempTop = (parseInt(targetDom.style.top) + (evt.clientY - lastY));
                tempLeft = (parseInt(targetDom.style.left) + (evt.clientX - lastX));
                if (tempTop > h - targetDom.offsetHeight) {
                  tempTop = h - targetDom.offsetHeight;
                } else if (tempTop < 0) {
                  tempTop = 0;
                }
                if (tempLeft > w - targetDom.offsetWidth) {
                  tempLeft = w - targetDom.offsetWidth;
                } else if (tempLeft < 0) {
                  tempLeft = 0;
                }
                targetDom.style.top = tempTop + 'px';
                targetDom.style.left = tempLeft + 'px';
                lastX = evt.clientX;
                lastY = evt.clientY;
              }
            });
            lastX = evt.clientX;
            lastY = evt.clientY;
            isDragging = true;
          };

          $('.apollo-dialog').mousedown(draggingFunc);
          $(document).mouseup(function () {
            isDragging = false;
            $(document).unbind('mousemove', draggingFunc);
            targetDom = undefined;
          });
        };

        setDialogDraggable();

        defaultButtonText = {
          alert: {
            ok: $('#apollo-alert-dialog button.dialog-confirm').text()
          },
          confirm: {
            ok: $('#apollo-confirm-dialog button.dialog-confirm').text(),
            cancel: $('#apollo-confirm-dialog button.dialog-cancel').text()
          }
        };
      }
    };
  }
);


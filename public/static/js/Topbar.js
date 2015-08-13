'use strict';

/**
 * Apollo Topbar (Singleton)
 */
define(
  [
    'Apollo/Logger',
    'Apollo/Navigator'
  ],
  function (logger, navigator) {

    var onloadCallbacks = [];

    window.Apollo = window.Apollo || {};

    /**
     * 對 Toolbar 建立需要的 Script Action
     */
    var initToolbar = function () {

      logger.debug('init toolbar');

      // bind disable process first
      $('#apollo-topbar *').on('click mousedown keydown touchstart', function (event) {
        if ($('#apollo-topbar').hasClass('disabled')) {
          logger.debug('Topbar deny.');
          event.stopPropagation;
          return false;
        }
      });

      // bind click event
      $('.apollo-toolbar > li').each(function (index, element) {
        $(element).find('a:first').click(function (event) {

          // 展開子選單
          if ($(element).find('ul').size() > 0) {
            if (!$(this).parent('li').hasClass('active')) {
              $('.apollo-toolbar li.active').removeClass('active');
              $(this).parent('li').addClass('active');
            } else {
              $(this).parent('li').removeClass('active');
            }
            event.stopPropagation();
          } else if ($(element).hasClass('toggle')) {
            if (!$(this).parent('li').hasClass('selected')) {
              $(this).parent('li').addClass('selected');
            } else {
              $(this).parent('li').removeClass('selected');
            }
          }
        });
      });

      // 點下子選單要自動消失
      $('.apollo-toolbar > li ul').click(function (event) {
        // 處理例外情形，設定邊框顏色按鈕，這裡點了不可消失
        if (event.target.id === 'apollo-toolbar-border-color-a' ||
            event.target.parentNode.id === 'apollo-toolbar-border-color-a' ||
            event.target.id === 'apollo-toolbar-border-color-li') {
          // 只要讓原本的事情不要做就好。

          // 若點擊的是設定邊框顏色的調色盤，則要將之隱藏
          if (event.currentTarget.id === 'apollo-toolbar-border-color-ul') {
            $(this).parent('li').removeClass('active');
          }
        } else {
          $(this).parent('li').removeClass('active');
          event.stopPropagation();
        }
      });

      // 子選單自動加入「下箭頭」圖示
      $('.apollo-toolbar > li').each(function (index, element) {
        if ($(element).find('ul').size() > 0) {
          $(element).find('a:first').append('<span class="fa fa-caret-down"></span>');
        }
      });

      //取消 toolbar 所有 a tag 行為
      $('.apollo-toolbar a').attr('href', 'javascript: void(0);');

      // 取消 popup box
      $('body').click(function () {
        $('.apollo-toolbar li.active').removeClass('active');
      });

      // 抑制 event 繼續傳遞，避免 CellFocus 被呼叫
      $('.apollo-toolbar').click(function (event) {
        event.stopPropagation();
      });

      // 抑制 disabled button click
      $('.apollo-toolbar li.disabled a').click(function (event) {
        logger.debug('Disabled button click.', this);
        event.stopPropagation();
      });

      // show topbar
      $('#apollo-topbar').css('opacity', '1');
      // Set Z-index to large number in order to conver on custom dialog.
      $('#apollo-topbar').css('z-index', '1000');

    };

    /**
     * Topbar set to enabled
     */
    var enabled = function () {
      // toobar mask
      $('#apollo-topbar').css('opacity', '1');
      $('#apollo-topbar').removeClass('disabled');

      // show tab button
      navigator.getMainWindow().$('.nav > .buttons > button').show();
    };

    /**
     * Fire topbar onload
     *
     * @param {string} cell
     */
    var fireOnload = function () {
      if ($('#apollo-topbar').hasClass('disabled')) {
        logger.debug('Topbar disabled deny fire onload!');
        return;
      }
      var index;
      for (index in onloadCallbacks) {
        if (onloadCallbacks.hasOwnProperty(index)) {
          onloadCallbacks[index]();
        }
      }
    };

    /**
     * Add Apollo topbar onload callback
     *
     * @param   {function}  callback
     * @returns {boolean}   sucess or fail
     */
    var onload = function (callback) {
      if (typeof(callback) !== 'function') {
        console.log('Parameter callback not a function.');
        return false;
      }
      onloadCallbacks.push(callback);
      return true;
    };

    onload(function () {
      initToolbar();
    });

    window.Apollo.Topbar = {
      initToolbar: initToolbar,
      fireOnload: fireOnload,
      onload: onload,
      enabled: enabled
    };

    // @param {Element} node: #tableeditor
    window.Apollo.Topbar.createTopbar = function (node, idPrefix) {
      var templ = node.querySelector('[data-header-templ]');
      if (!templ) {
        console.error('Apollo.Topbar not found header templ node');
        return;
      }

      // 動態載入topbar選單後，需要手動翻譯.....TODO...
      L10n.translate(templ);

      var headerTempl = templ.cloneNode(true);
      headerTempl.removeAttribute('data-header-templ');

      var parent = this.parentNode = node.parentNode;
      parent.insertBefore(headerTempl, node);
      node.removeChild(templ);


      /** @type {Element} */
      this.topbarWrapper = headerTempl;

      this.idPrefix = idPrefix || 'apollo-';
    };

    // load Menubar Ctrl
    window.Apollo.Topbar.initMenubar = function () {
      var _self = this;

      var menubarWrapper = _self.topbarWrapper,
        menubar = menubarWrapper.querySelector('ul.apollo-menubar');
        // toolbar = menubarWrapper.querySelector('ul.apollo-toolbar');


      var onSubMenuLiMouseEnter, onSubMenuLiMouseLeave, subMenuLi;

      _self.disactiveMenubar = function () {
        // var curr = menubar.querySelector('li.active');
        // if (curr) {
          // curr.classList.remove('active');
          // menubar.classList.remove('active');
        // }
      };
      var onClickBarMenu = function (evt) {

        if ($('#apollo-topbar').hasClass('disabled')) {
          logger.debug('Topbar disabled and deny event');
          return;
        }

        var thisItem = evt.target.parentNode;
        var curr = menubar.querySelector('li.active');
        var toorBarToChange = thisItem.getAttribute('data-toolbar-change');

        if (curr && curr !== thisItem) {
          curr.classList.remove('active');
        }

        $('.apollo-toolbar').removeClass('toolbar-active');
        $('#apollo-toolbar-'+toorBarToChange).addClass('toolbar-active');
        thisItem.classList.add('active');

        // if (thisItem.getElementsByTagName('UL').length < 1) {
        //   return;
        // }

        // if (thisItem.classList.contains('active')) {
        //   thisItem.classList.remove('active');
        //   menubar.classList.remove('active');

        //    $('.apollo-toolbar').removeClass('toolbar-active');
        //   toolbar.classList.add('toolbar-active');
        // } else {
        //   thisItem.classList.add('active');
        //   menubar.classList.add('active');

        // }
        evt.stopPropagation();
      };

      var onMouseEnterBarMenu = function (evt) {
        if (!menubar.classList.contains('active')) {
          return;
        }
        var target = evt.target;
        var curr = menubar.querySelector('li.active');
        if (curr && curr === target) {
          return;
        }
        curr.classList.remove('active');
        target.classList.add('active');
        evt.stopPropagation();
      };

      var onMouseLeaveBarMenu = function (evt) {
        if (!menubar.classList.contains('active')) {
          return;
        }

        var target = evt.target;
        var curr = menubar.querySelector('li.active');
        if (curr && curr === target) {
          return;
        }

        curr.classList.remove('active');

        evt.stopPropagation();
      };

      var suppressClickOrNot = function (item) {
        var thisItem = item;

        var returnFalse = function (evt) {
          evt.stopPropagation();
          return false;
        };

        if (thisItem.getElementsByTagName('ul').length) {
          thisItem.addEventListener('click', returnFalse, false);
        } else {
          thisItem.addEventListener('click', _self.disactiveMenubar, false);
        }
      };

      // 讓 submenu 中的 li mouse enter 自動加上 active class, mouse leave 500ms 後才移除, 提昇 UX
      onSubMenuLiMouseEnter = function (event) {
        event.target.classList.add('hover');
        // 等待一段時間才決定要不要 active
        setTimeout(function () {
          if (event.target.classList.contains('hover')) {
            event.target.classList.add('active');
          }
        }, Apollo.Config.MenuBar.DelayTime);
      };
      onSubMenuLiMouseLeave = function (event) {
        event.target.classList.remove('hover');
        // 等待一段時間才決定要不要 unactive
        setTimeout(function () {
          if (event.target.querySelectorAll('ul li.hover').length === 0) {
            event.target.classList.remove('active');
          }
        }, Apollo.Config.MenuBar.DelayTime);
      };

      subMenuLi = menubar.querySelectorAll('ul.submenu li');
      for (var i = 0; i < subMenuLi.length; i++) {
        subMenuLi[i].addEventListener('mouseenter', onSubMenuLiMouseEnter, false);
        subMenuLi[i].addEventListener('mouseleave', onSubMenuLiMouseLeave, false);
      }

      // for the items on menuabr
      var menus = menubar.querySelectorAll('li.item-main');
      var subItems;
      for (i = 0; i < menus.length; i++) {
        menus[i].addEventListener('click', onClickBarMenu);
        menus[i].addEventListener('mouseenter', onMouseEnterBarMenu, false);
        menus[i].addEventListener('mouseleave', onMouseLeaveBarMenu, false);

        // for each sub-menuitem
        if ((subItems = menus[i].querySelectorAll('ul > li')).length) {
          for (var ii = 0; ii < subItems.length; ii++) {
            suppressClickOrNot(subItems[ii]);
          }
        }
      }

      // disactive menu while click elsewhere
      _self.parentNode.addEventListener('click', _self.disactiveMenubar, false);
      _self.parentNode.addEventListener('contextmenu', _self.disactiveMenubar);

      // add event listeners for menubars
      require(['Apollo/Handler/RightClick', 'Apollo/Handler/LeftClick'], function (rightclick) {
        _self.fireOnload();

        // init right-click handler and translate each pane
        rightclick.init();

      });

      // 子選單自動加入「右箭頭」圖示
      $('.apollo-menubar ul.submenu li').each(function (index, element) {
        if ($(element).find('ul').size() > 0) {
          $(element).find('a:first').append('<span class="fa fa-caret-right"></span>');
        }
      });

      // 取消 menu 所有 a tag 行為
      $('.apollo-menubar a').attr('href', 'javascript: void(0);');

      // 抑制 disabled button click
      $('.apollo-menubar li.disabled a').click(function (event) {
        logger.debug('Disabled button click.', this);
        event.stopPropagation();
      });
    };

    return window.Apollo.Topbar;
  }
);

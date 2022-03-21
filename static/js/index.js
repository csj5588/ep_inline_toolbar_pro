'use strict';

const iT = {
  hide: () => {
    const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
    const inlineToolbar = padOuter.find('#inline_toolbar');
    $(inlineToolbar).fadeOut('fast');
  },
  show: () => {
    const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
    const inlineToolbar = padOuter.find('#inline_toolbar');
    $(inlineToolbar).fadeIn('fast')
  },
};

exports.documentReady = () => {
  $('#editbar .menu_left').css('opacity', '0')
}

exports.aceSelectionChanged = (hook, context) => {
  const selStart = context.rep.selStart;
  const selEnd = context.rep.selEnd;
  if ((selStart[0] !== selEnd[0]) || (selStart[1] !== selEnd[1])) {
    /**
     * 与下方官方bug处理相呼应
     */
    setTimeout(() => {
      iT.show();
    }, 200)
  } else {
    iT.hide(); // hide if nothing is selected
  }
};

exports.postAceInit = (hookName, context) => {
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  const padInner = padOuter.contents('iframe').contents().find('body');
  const padOuterHTML = $('iframe[name="ace_outer"]').contents().find('html');

  const padOuterOffsetTop = $('iframe[name="ace_outer"]').offset().top;
  const innerOffsetLeft = padOuter.find('iframe').offset().left;
  const innerOffsetTop = padOuter.find('iframe').offset().top;

  padOuter.on('mouseup', (e) => {
    iT.hide();
  });
  padInner.on('mouseup', (event) => {
    context.ace.callWithAce((ace) => {
      const selection = event.view.getSelection();

      /**
       * 官方bug，必须延迟200毫秒才能获得准确的rep
       */
      setTimeout(() => {
        /**
         * 这里做一层拦截，解决弹窗闪烁问题
         */
        const { selStart, selEnd } = ace.ace_getRep();
        console.log('rep', selStart, selEnd)
        if ((selStart[0] === selEnd[1]) && (selStart[1] === selEnd[0])) return;
        /**
         * 创建边界矩形，添加当前seleciton，计算当前光标位置
         */
        const range = event.view.document.createRange();
        const rangeStart = selection.anchorOffset;
        const rangeEnd = selection.focusOffset;

        range.setStart(selection.anchorNode, rangeStart)
        range.setEnd(selection.focusNode, rangeEnd)

        const clientRect = range.getBoundingClientRect();

        const toolbar = padOuter.find('#inline_toolbar');
        toolbar.css({
          position: 'absolute',
          left: innerOffsetLeft + clientRect.x,
          top: padOuterOffsetTop + innerOffsetTop + clientRect.y - padOuterHTML[0].scrollTop - 58,
        });
      }, 200)
    })
  });
};

/**
 * 根据配置生成inlineToolbar的按钮
 * 其中一些按钮是系统自带的，有些是插件中的
 * 根据配置的数组深度进行分隔符的插入
 */
exports.postToolbarInit = (hook, context) => {
  const toolbarConfigs = clientVars.ep_inline_toolbar_pro || [];
  const dividerTemplate = '<div style="width: 1px; height: 17px; margin: 0 4px; background: #f5f5f5" />';

  toolbarConfigs.forEach((children, idx) => {
    const isArray = Array.isArray(children);
    const isLast = idx + 1 === toolbarConfigs.length;

    if (isArray) {
      children.forEach(key => {
        const menuLeftDom = $(`#editbar .menu_left [data-key='${key}']`);
        $('#inline_toolbar_menu_items').append(menuLeftDom);
      })

      if (isLast) return;
      
      $('#inline_toolbar_menu_items').append(dividerTemplate)
    }
  })


  /**
   * @description inline_toolbar style
   */
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  $('#inline_toolbar').css({
    'background-color': 'white',
    'border-radius': '6px',
    'border': '1px solid #f5f5f5',
    'padding': '3px 5px',
    'position': 'absolute',
    'top': '-9999px'
  });
  $('#inline_toolbar li').css({
    'margin': '0 3px',
  });
  $('#inline_toolbar').detach().appendTo(padOuter[0]);

  $('#editbar .menu_left').css('opacity', '1')
};

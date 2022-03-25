'use strict';

const { isEqual } = require('ep_etherpad-lite/static/js/common_utils');

const inlineRef = {
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
  prevRep: {
    selStart: [0, 0],
    selEnd: [0, 0]
  }
};

exports.documentReady = () => {
  $('#editbar .menu_left').css('opacity', '0')
}

exports.aceSelectionChanged = (hook, context) => {
  const hasMobileLayout = $('body').hasClass('mobile-layout');
  if (hasMobileLayout) return;

  const selStart = context.rep.selStart;
  const selEnd = context.rep.selEnd;
  if ((selStart[0] !== selEnd[0]) || (selStart[1] !== selEnd[1])) {
    /**
     * 与下方官方bug处理相呼应
     */
    setTimeout(() => inlineRef.show(), 300)
  } else {
    inlineRef.hide(); // hide if nothing is selected
  }
};

/**
 * 插件事件绑定
 * @remark 移动端兼容
 */
exports.postAceInit = (hookName, context) => {
  const hasMobileLayout = $('body').hasClass('mobile-layout');
  if (hasMobileLayout) return;

  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  const padInner = padOuter.contents('iframe').contents().find('body');

  const padOuterOffsetTop = $('iframe[name="ace_outer"]').offset().top;
  const innerOffsetLeft = padOuter.find('iframe').offset().left;
  const innerOffsetTop = padOuter.find('iframe').offset().top;

  padOuter.on('mouseup', (e) => inlineRef.hide());
  padInner.on('mouseup', (event) => {
    context.ace.callWithAce((ace) => {
      const selection = event.view.getSelection();

      /**
       * 官方bug，必须延迟200毫秒才能获得准确的rep
       */
      setTimeout(() => {
        /**
         * 这里做一层拦截，解决弹窗闪烁问题
         * 存储上一次的rep，下次如果相同，则拦截
         */
        const { selStart, selEnd } = ace.ace_getRep();

        if ((selStart[0] === selEnd[1]) && (selStart[1] === selEnd[0])) return;
        if (isEqual(inlineRef.prevRep.selStart, selStart) && isEqual(inlineRef.prevRep.selEnd, selEnd)) return;

        inlineRef.prevRep.selStart = selStart;
        inlineRef.prevRep.selEnd = selEnd;

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
          top: padOuterOffsetTop + innerOffsetTop + clientRect.y - 58,
        });
      }, 200)
    })
  });
};

/**
 * 根据配置生成inlineToolbar的按钮
 * 其中一些按钮是系统自带的，有些是插件中的
 * 根据配置的数组深度进行分隔符的插入
 * @remark 移动端场景兼容-移动端禁止inlineToolbar
 */
exports.postToolbarInit = (hook, context) => {
  const hasMobileLayout = $('body').hasClass('mobile-layout');
  if (hasMobileLayout) {
    $('#editbar .menu_left').css('opacity', '1');
    return;
  }

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
   * 插入到padOuter中
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

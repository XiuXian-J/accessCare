/**
 * pages/settings/settings.js —— 无障碍设置（本项目的核心创新点）
 *
 * 这是全项目最能体现「科技助残」主题的一页：
 * 三个 switch 开关分别控制大字体、高对比、简化模式，
 * 一组 radio 控制正文字号档位，改动后当前页面与其它所有已打开的页面都会立刻变化。
 *
 * 实现要点（也是本页的技术亮点）：
 *   1. 设置项统一存放在 app.js 的 globalData 中，并同步写入本地存储，
 *      下次启动时自动恢复，做到「一次设置，长期生效」；
 *   2. 开关变化时不逐个修改元素样式，而是由 app.a11yClass() 生成一个 class 字符串，
 *      写到页面根节点上，再由 app.wxss 里的后代选择器统一覆盖——
 *      这样新增页面只要套用同一根节点写法就能自动支持无障碍模式；
 *   3. app.broadcastA11y() 会遍历页面栈逐个通知，实现不刷新页面即时生效。
 */

var a11y = require('../../utils/a11y.js');
var options = require('../../data/options.js');

Page({

  data: {
    a11yClass: '',
    // 三个开关的当前状态
    bigFont: false,
    highContrast: false,
    simpleMode: false,
    fontLevel: 2,
    fontLevels: options.fontLevels,
    // 预览区模拟数据
    previewAid: {
      name: '轻量化手动轮椅',
      desc: '铝合金车架，整车 9.8kg，可折叠，适合日常代步与就医出行。',
      emoji: '♿'
    }
  },

  onLoad: function () {
    this.syncFromGlobal();
  },

  onShow: function () {
    a11y.apply(this);
    this.syncFromGlobal();
  },

  refreshA11y: a11y.refreshA11y,

  /** 把全局设置同步到本页 data（开关的选中状态需要它） */
  syncFromGlobal: function () {
    var s = getApp().globalData.a11y;
    this.setData({
      bigFont: s.bigFont,
      highContrast: s.highContrast,
      simpleMode: s.simpleMode,
      fontLevel: s.fontLevel
    });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /**
   * switch 开关变化
   * 开关的 data-key 标明改的是哪一项，值从 e.detail.value 取（布尔值）。
   */
  onSwitchChange: function (e) {
    var key = e.currentTarget.dataset.key;
    var value = e.detail.value;

    getApp().setA11y(key, value);   // 写全局 + 本地存储 + 广播给所有页面

    var patch = { a11yClass: getApp().a11yClass() };
    patch[key] = value;
    this.setData(patch);            // 本页也需要同步刷新

    wx.showToast({
      title: (value ? '已开启' : '已关闭') + this.labelOf(key),
      icon: 'none'
    });
  },

  /** radio 字号档位变化 */
  onFontLevelChange: function (e) {
    var level = Number(e.detail.value);
    getApp().setA11y('fontLevel', level);
    this.setData({ fontLevel: level, a11yClass: getApp().a11yClass() });
    wx.showToast({ title: '字号已调整', icon: 'none' });
  },

  /** 恢复默认设置 */
  onReset: function () {
    var that = this;
    wx.showModal({
      title: '恢复默认设置',
      content: '将关闭全部无障碍开关并恢复标准字号，确定继续吗？',
      confirmColor: '#1B7F6B',
      success: function (res) {
        if (res.confirm) {
          getApp().resetA11y();
          that.setData({ a11yClass: getApp().a11yClass() });
          that.syncFromGlobal();
          wx.showToast({ title: '已恢复默认', icon: 'success' });
        }
      }
    });
  },

  /** 预览区的测试按钮，用来直观感受不同模式下的按钮尺寸与配色 */
  onPreviewTap: function () {
    wx.showToast({ title: '当前设置已生效', icon: 'success' });
  },

  /** 开关名转中文，用于提示文案 */
  labelOf: function (key) {
    var map = { bigFont: '大字体', highContrast: '高对比', simpleMode: '简化模式' };
    return map[key] || '';
  }
});

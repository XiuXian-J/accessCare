/**
 * app.js —— 小程序全局逻辑
 *
 * 本文件承担两件全局事务：
 *   1. 无障碍设置中心：统一保存「大字体 / 高对比 / 简化模式 / 字号档位」，
 *      并把设置广播到当前所有已打开页面，实现全应用即时换肤。
 *   2. 启动初始化：首次运行时写入本地模拟数据（种子数据），
 *      使小程序在完全离线的状态下也能演示完整业务流程。
 */

var store = require('./utils/store.js');

// 无障碍设置的出厂默认值
var DEFAULT_A11Y = {
  bigFont: false,       // 大字体模式
  highContrast: false,  // 高对比模式（黑底黄字）
  simpleMode: false,    // 简化模式（隐藏次要信息，降低认知负荷）
  fontLevel: 2          // 字号档位：1 标准 / 2 较大 / 3 特大
};

App({

  /** 全局数据：任何页面都可以通过 getApp().globalData 读取 */
  globalData: {
    a11y: DEFAULT_A11Y,   // 当前无障碍设置
    user: null,           // 当前用户信息
    themeColor: '#1B7F6B' // 主题色，供页面统一取用
  },

  /**
   * 生命周期：小程序启动时执行一次
   * 1) 读取无障碍设置；2) 读取用户信息；3) 首次运行写入种子数据
   */
  onLaunch: function () {
    // --- 无障碍设置：本地没有就写入默认值 ---
    var settings = wx.getStorageSync('ac_settings');
    if (!settings || !settings.fontLevel) {
      settings = JSON.parse(JSON.stringify(DEFAULT_A11Y));
      wx.setStorageSync('ac_settings', settings);
    }
    this.globalData.a11y = settings;

    // --- 用户信息：本地没有就给一个默认昵称，保证「我的」页面不为空 ---
    this.globalData.user = wx.getStorageSync('ac_user') || {
      nickName: '同行者',
      phone: '',
      avatarText: '同'
    };

    // --- 种子数据：只在第一次运行时写入，避免覆盖用户已产生的业务数据 ---
    store.initSeed();
  },

  /* ================================================================
   *  无障碍设置中心
   * ================================================================ */

  /**
   * 修改某一项无障碍设置
   * @param {String} key   设置项名称，如 'bigFont'
   * @param {*}      value 新的值
   * 写入顺序：globalData -> 本地存储 -> 广播给所有已打开页面
   */
  setA11y: function (key, value) {
    this.globalData.a11y[key] = value;
    wx.setStorageSync('ac_settings', this.globalData.a11y);
    this.broadcastA11y();
  },

  /**
   * 生成根节点 class 字符串
   * 页面根节点写成 <view class="page {{a11yClass}}">，
   * 样式表里用 .a11y-big .t-title 这类后代选择器统一覆盖，避免逐处写内联样式。
   * @return {String} 形如 ' a11y-big a11y-contrast a11y-f3'
   */
  a11yClass: function () {
    var a = this.globalData.a11y;
    var cls = '';
    if (a.bigFont) { cls += ' a11y-big'; }
    if (a.highContrast) { cls += ' a11y-contrast'; }
    if (a.simpleMode) { cls += ' a11y-simple'; }
    cls += ' a11y-f' + (a.fontLevel || 2);
    return cls;
  },

  /**
   * 把最新设置广播给页面栈中的每一个页面
   * 页面只要定义了 refreshA11y 方法即可被自动调用，无需各自监听。
   */
  broadcastA11y: function () {
    var pages = getCurrentPages();
    for (var i = 0; i < pages.length; i++) {
      if (typeof pages[i].refreshA11y === 'function') {
        pages[i].refreshA11y();
      }
    }
  },

  /** 重置为出厂默认设置 */
  resetA11y: function () {
    this.globalData.a11y = JSON.parse(JSON.stringify(DEFAULT_A11Y));
    wx.setStorageSync('ac_settings', this.globalData.a11y);
    this.broadcastA11y();
  },

  /* ================================================================
   *  用户信息
   * ================================================================ */

  /** 保存用户信息（「我的」页面编辑后调用） */
  setUser: function (user) {
    this.globalData.user = user;
    wx.setStorageSync('ac_user', user);
  }
});

/**
 * pages/mine/mine.js —— 我的
 *
 * 本页是各类子功能的入口聚合页，同时演示两种典型交互：
 *   1. 点击弹窗提示：清除缓存、重置演示数据都会先用 wx.showModal 二次确认；
 *   2. 表单录入：点击「编辑资料」弹出自定义编辑面板，
 *      用 input 录入昵称与手机号，校验通过后保存到本地存储。
 * 保存后的用户信息会被借用 / 预约表单自动读取并填好，减少重复录入。
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');
var util = require('../../utils/util.js');

Page({

  data: {
    a11yClass: '',
    user: { nickName: '同行者', phone: '', avatarText: '同' },
    count: { all: 0, pending: 0, ongoing: 0, done: 0 },
    favoriteCount: 0,
    showEdit: false,        // 编辑资料面板是否展开
    editName: '',
    editPhone: '',
    menus: []               // 功能入口列表
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    a11y.apply(this);
    store.checkOverdue();
    this.loadData();
  },

  refreshA11y: a11y.refreshA11y,

  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  /** 读取用户信息与各状态记录数量 */
  loadData: function () {
    var app = getApp();
    var count = store.countByStatus();
    this.setData({
      user: app.globalData.user,
      count: count,
      favoriteCount: store.getFavorites().length,
      // path 单独写出来，避免用 key 拼路径时出现 myRecords 这类不一致的命名
      menus: [
        { key: 'records', path: 'myRecords', emoji: '📋', name: '我的记录', desc: '借用与预约的全部申请' },
        { key: 'favorites', path: 'favorites', emoji: '⭐', name: '我的收藏', desc: '收藏的辅具' },
        { key: 'settings', path: 'settings', emoji: '⚙️', name: '无障碍设置', desc: '大字体 / 高对比 / 简化模式' },
        { key: 'knowledge', path: 'knowledge', emoji: '📖', name: '无障碍科普', desc: '手语常识与辅具保养' },
        { key: 'feedback', path: 'feedback', emoji: '✍️', name: '意见反馈', desc: '告诉我们你的建议' }
      ]
    });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /** 点击菜单项跳转对应页面 */
  onMenuTap: function (e) {
    var path = e.currentTarget.dataset.path;
    wx.navigateTo({ url: '/pages/' + path + '/' + path });
  },

  /** 打开编辑资料面板 */
  onEditTap: function () {
    this.setData({
      showEdit: true,
      editName: this.data.user.nickName,
      editPhone: this.data.user.phone
    });
  },

  /** 关闭编辑面板 */
  onEditCancel: function () {
    this.setData({ showEdit: false });
  },

  onNameInput: function (e) {
    this.setData({ editName: e.detail.value });
  },

  onPhoneInput: function (e) {
    this.setData({ editPhone: e.detail.value });
  },

  /** 保存资料：先校验，再写入全局与本地存储 */
  onEditSave: function () {
    var name = this.data.editName.trim();
    var phone = this.data.editPhone.trim();
    if (!util.notEmpty(name)) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    if (phone && !util.isPhone(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    var user = { nickName: name, phone: phone, avatarText: name.charAt(0) };
    getApp().setUser(user);
    this.setData({ user: user, showEdit: false });
    wx.showToast({ title: '资料已保存', icon: 'success' });
  },

  /** 点击统计区：跳转记录页 */
  onStatTap: function () {
    wx.navigateTo({ url: '/pages/myRecords/myRecords' });
  },

  /** 清除缓存：showModal 二次确认后清理业务数据 */
  onClearCache: function () {
    var that = this;
    wx.showModal({
      title: '清除缓存',
      content: '将清空本地保存的借用记录、收藏与反馈数据。无障碍设置会被保留，确定继续吗？',
      confirmColor: '#D9534F',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync('ac_orders');
          wx.removeStorageSync('ac_favorites');
          wx.removeStorageSync('ac_stock');
          wx.removeStorageSync('ac_feedback');
          wx.removeStorageSync('ac_seeded');
          store.initSeed();          // 重新写入初始库存
          that.loadData();
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      }
    });
  },

  /** 关于本项目 */
  onAboutTap: function () {
    wx.showModal({
      title: '关于无碍同行',
      content: '「无碍同行」是一款面向听障、视障及行动不便人群的公益小程序，' +
        '提供辅具免费共享与手语服务预约两条业务线。\n\n' +
        '开发商：嗅嗅鸭集团\n' +
        '版本：v1.0.0',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

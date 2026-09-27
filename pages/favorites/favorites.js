/**
 * pages/favorites/favorites.js —— 我的收藏
 *
 * 演示「动态数据展示」中最常见的增删即时刷新：
 * 在列表页直接取消收藏后，不需要手动刷新，
 * 只要重新读一次本地存储并 setData，界面就与数据保持一致。
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');

Page({

  data: {
    a11yClass: '',
    list: []
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    a11y.apply(this);
    this.loadData();
  },

  refreshA11y: a11y.refreshA11y,

  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  /** 从本地存储读取收藏的辅具 */
  loadData: function () {
    this.setData({ list: store.getFavoriteAids() });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /** 取消收藏：写存储后立即重读列表，实现即时刷新 */
  onRemoveTap: function (e) {
    var id = e.currentTarget.dataset.id;
    store.toggleFavorite(id);
    this.loadData();
    wx.showToast({ title: '已取消收藏', icon: 'none' });
  },

  /** 点击卡片进入辅具详情 */
  onAidTap: function (e) {
    wx.navigateTo({ url: '/pages/aidsDetail/aidsDetail?id=' + e.currentTarget.dataset.id });
  },

  /** 空状态下引导去辅具库 */
  onGoAids: function () {
    wx.switchTab({ url: '/pages/aids/aids' });
  }
});

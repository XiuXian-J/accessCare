/**
 * pages/aidsDetail/aidsDetail.js —— 辅具详情
 *
 * 本页集中演示「基础点击交互」的多种形态：
 *   · 按钮点击：申请借用、收藏
 *   · 图片点击预览：点击轮播图调用 wx.previewImage 全屏查看
 *   · 点击弹窗提示：收藏成功、库存不足都会给出 wx.showToast / wx.showModal
 *   · 点击页面跳转：携带辅具编号进入借用申请页
 * 页面通过 url 参数 id 接收上一页传来的辅具编号。
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');

Page({

  data: {
    a11yClass: '',
    aid: null,
    fav: false,
    // 分类编码转中文名，避免在 WXML 里写复杂的条件判断
    categoryName: {
      mobility: '出行辅具', hearing: '听力辅具', vision: '视力辅具',
      limb: '肢体辅具', daily: '生活辅具'
    }
  },

  /** 通过 url 参数拿到辅具编号 */
  onLoad: function (options) {
    this.aidId = options.id;
    this.loadData();
  },

  onShow: function () {
    a11y.apply(this);
    this.loadData();
  },

  refreshA11y: a11y.refreshA11y,

  /** 读取辅具数据（含实时库存与收藏状态） */
  loadData: function () {
    var aid = store.getAidById(this.aidId);
    if (!aid) {
      wx.showToast({ title: '辅具不存在', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1200);
      return;
    }
    aid.categoryText = this.data.categoryName[aid.category] || '辅具';
    this.setData({ aid: aid, fav: aid.fav });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /**
   * 点击图片全屏预览
   * urls 必须传本地文件路径；current 指定从当前这一张开始看。
   */
  onPreview: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    var aid = this.data.aid;
    if (!aid || !aid.images || aid.images.length === 0) {
      return;
    }
    wx.previewImage({
      current: aid.images[index],
      urls: aid.images
    });
  },

  /** 收藏 / 取消收藏 */
  onFavoriteTap: function () {
    var fav = store.toggleFavorite(this.aidId);
    this.setData({ fav: fav });
    wx.showToast({
      title: fav ? '已加入收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  /** 申请借用：先判断库存，再跳转表单页 */
  onBorrowTap: function () {
    var aid = this.data.aid;
    if (!aid.available) {
      wx.showModal({
        title: '暂无库存',
        content: '该辅具当前已全部借出，你可以先收藏它，待库存恢复后再来申请。',
        confirmText: '去收藏',
        success: function (res) {
          if (res.confirm) {
            store.toggleFavorite(aid.id);
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/borrowApply/borrowApply?id=' + aid.id });
  },

  /** 查看手语服务 */
  onGoService: function () {
    wx.switchTab({ url: '/pages/service/service' });
  }
});

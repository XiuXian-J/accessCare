/**
 * pages/home/home.js —— 首页
 *
 * 首页承担「导流 + 概览」两件事：
 *   1. 顶部搜索框可把关键词带到辅具库（tabBar 页面无法通过 url 传参，
 *      所以借助 globalData 中转）；
 *   2. 数据卡从本地存储实时统计可借数量与进行中的业务，
 *      每次 onShow 重新计算，保证子页面办理完业务返回后数字立刻更新。
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');

Page({

  data: {
    a11yClass: '',        // 无障碍主题 class，由 a11y.apply 写入
    keyword: '',          // 搜索关键词
    // 轮播图：图片由 tools/make_icons.py 生成，文字用 text 组件叠加，
    // 这样文字能跟随「大字体模式」一起放大
    // path 指向该轮播图要跳转的页面，tab 标明目标是否为 tabBar 页面
    //（tabBar 页面只能用 switchTab，普通页面只能用 navigateTo，两者不能混用）
    banners: [
      { id: 1, img: '/images/banner/banner-1.png', title: '辅具共享', sub: '轮椅 · 助行器 · 助听器 免费借用', path: '/pages/aids/aids', tab: true },
      { id: 2, img: '/images/banner/banner-2.png', title: '手语服务', sub: '现场翻译 · 远程视频 一键预约', path: '/pages/service/service', tab: true },
      { id: 3, img: '/images/banner/banner-3.png', title: '无障碍模式', sub: '大字体 · 高对比 · 简化界面', path: '/pages/settings/settings', tab: false }
    ],
    // 四宫格快捷入口
    entries: [
      { key: 'aids', emoji: '♿', name: '辅具借用' },
      { key: 'service', emoji: '🤟', name: '手语预约' },
      { key: 'records', emoji: '📋', name: '我的记录' },
      { key: 'settings', emoji: '⚙️', name: '无障碍设置' }
    ],
    stat: { kinds: 0, available: 0, running: 0, records: 0 },
    hotAids: []
  },

  onLoad: function () {
    this.loadData();
  },

  /** 每次显示都重新读一遍本地数据，保证从子页面返回时数据是最新的 */
  onShow: function () {
    a11y.apply(this);
    store.checkOverdue();   // 顺带做一次逾期判定
    this.loadData();
  },

  /** 供全局无障碍设置广播时回调 */
  refreshA11y: a11y.refreshA11y,

  /** 下拉刷新：重新统计数据后必须关闭刷新动画 */
  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
    wx.showToast({ title: '已刷新', icon: 'none' });
  },

  /** 汇总首页需要用到的全部数据 */
  loadData: function () {
    var aids = store.getAids();
    var hot = [];
    var available = 0;
    for (var i = 0; i < aids.length; i++) {
      available += aids[i].stock;
      if (aids[i].hot) {
        hot.push(aids[i]);
      }
    }
    var count = store.countByStatus();
    this.setData({
      hotAids: hot,
      stat: {
        kinds: aids.length,
        available: available,
        running: count.pending + count.ongoing,
        records: count.all
      }
    });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /** 输入框内容变化 */
  onKeywordInput: function (e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 执行搜索：tabBar 页面之间不能用 navigateTo 传参，
   * 因此把关键词暂存到 globalData，由辅具库页面读取后清空。
   */
  onSearch: function () {
    var kw = this.data.keyword.trim();
    if (!kw) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }
    getApp().globalData.searchKeyword = kw;
    wx.switchTab({ url: '/pages/aids/aids' });
  },

  /** 宫格入口跳转 */
  onEntryTap: function (e) {
    var key = e.currentTarget.dataset.key;
    if (key === 'aids') {
      wx.switchTab({ url: '/pages/aids/aids' });
    } else if (key === 'service') {
      wx.switchTab({ url: '/pages/service/service' });
    } else if (key === 'records') {
      wx.navigateTo({ url: '/pages/myRecords/myRecords' });
    } else {
      wx.navigateTo({ url: '/pages/settings/settings' });
    }
  },

  /**
   * 点击轮播图跳转
   * 跳转目标直接写在 banners 数据项的 path 字段里，不再用 id 分支硬编码，
   * 这样以后增删轮播图只改数据即可，不会再出现「点 A 跳到 B」的错位。
   */
  onBannerTap: function (e) {
    var ds = e.currentTarget.dataset;
    var url = ds.path;
    if (!url) { return; }
    if (ds.tab === true || ds.tab === 'true') {
      wx.switchTab({ url: url });
    } else {
      wx.navigateTo({ url: url });
    }
  },

  /** 点击热门辅具卡片，带编号跳转详情 */
  onAidTap: function (e) {
    wx.navigateTo({ url: '/pages/aidsDetail/aidsDetail?id=' + e.currentTarget.dataset.id });
  },

  /** 查看全部辅具：切到辅具库 tab */
  onMoreTap: function () {
    wx.switchTab({ url: '/pages/aids/aids' });
  }
});

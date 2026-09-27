/**
 * pages/service/service.js —— 手语服务
 *
 * 采用「swiper 页签」这种在小程序里很常见的交互：
 * 顶部一排可点击的标题，下方用 swiper 承载内容，
 * 点击标题时通过 swiper 的 current 属性切换，滑动页面时标题也跟着高亮，
 * 两个方向的联动都靠同一个 currentTab 变量驱动。
 *
 * 需要注意 swiper 必须有确定高度，本项目按内容条数动态计算，
 * 避免像固定高度那样在数据少时留下大片空白。
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');

Page({

  data: {
    a11yClass: '',
    tabs: ['服务项目', '我的预约'],
    currentTab: 0,
    services: [],
    myBookings: [],
    swiperHeight: 1200      // 单位 rpx，由 calculateHeight() 动态算出
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
    wx.showToast({ title: '已刷新', icon: 'none' });
  },

  /** 读取服务列表，并从全部记录中挑出服务类预约 */
  loadData: function () {
    var services = store.getServices();
    var orders = store.getOrders();
    var bookings = [];
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].bizType === 'service') {
        var item = orders[i];
        item.isDone = (item.status === 'done' || item.status === 'canceled');
        bookings.push(item);
      }
    }
    this.setData({ services: services, myBookings: bookings });
    this.calculateHeight(services.length, bookings.length);
  },

  /**
   * 动态计算 swiper 高度
   * 每张服务卡片约 250rpx、每条预约记录约 230rpx，
   * 取两屏中较高的一屏作为 swiper 高度，保证两个页签都能完整展示。
   */
  calculateHeight: function (serviceCount, bookingCount) {
    var h1 = serviceCount * 250 + 40;
    var h2 = bookingCount * 230 + 200;   // 200 是空状态的占位高度
    var h = h1 > h2 ? h1 : h2;
    if (h < 700) { h = 700; }            // 设一个下限，避免内容过少时过矮
    this.setData({ swiperHeight: h });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /** 点击标题切换 */
  onTabTap: function (e) {
    this.setData({ currentTab: Number(e.currentTarget.dataset.index) });
  },

  /** 滑动内容时同步标题高亮 */
  onSwiperChange: function (e) {
    this.setData({ currentTab: e.detail.current });
  },

  /** 立即预约：携带服务编号进入预约表单 */
  onBookTap: function (e) {
    wx.navigateTo({ url: '/pages/serviceBooking/serviceBooking?id=' + e.currentTarget.dataset.id });
  },

  /** 从「我的预约」进入记录页查看状态流转 */
  onRecordTap: function () {
    wx.navigateTo({ url: '/pages/myRecords/myRecords' });
  },

  /** 空状态下引导用户去预约 */
  onGoBook: function () {
    this.setData({ currentTab: 0 });
  }
});

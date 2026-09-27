/**
 * pages/myRecords/myRecords.js —— 我的记录（状态机操作页）
 *
 * 本页是项目里交互最丰富的一页，包含：
 *   · swiper 页签：全部 / 待审核 / 进行中 / 已完成 / 已取消 五屏内容
 *   · 状态机操作：按当前状态显示不同的操作按钮（审核通过、归还、取消、删除）
 *   · 点击弹窗提示：所有状态变更前都用 wx.showModal 二次确认，避免误操作
 *   · 动态数据展示：数据来自本地存储，任何一次状态变更都会立刻写回并重绘
 *   · 下拉刷新：重新读取存储，同时自动判定借用是否逾期
 *
 * 状态流转规则（与 utils/store.js 中的 updateOrderStatus 配合）：
 *   pending 待审核 --审核通过--> ongoing 进行中 --归还/完成--> done 已完成
 *   pending / ongoing --取消--> canceled 已取消
 *   ongoing 且超过归还日期 --自动--> overdue 已逾期（归还后转为已完成）
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');
var options = require('../../data/options.js');

Page({

  data: {
    a11yClass: '',
    tabs: options.recordTabs,
    currentTab: 0,
    // 五个页签各自的数据，交给 swiper 渲染；每项形如 { key, list }
    tabLists: [],
    counts: [0, 0, 0, 0, 0],          // 每个页签的记录条数
    swiperHeight: 900,
    expandedId: ''                    // 当前展开时间轴的记录编号
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    a11y.apply(this);
    this.loadData();
  },

  refreshA11y: a11y.refreshA11y,

  /** 下拉刷新：重新判定逾期并重读数据 */
  onPullDownRefresh: function () {
    var changed = store.checkOverdue();
    this.loadData();
    wx.stopPullDownRefresh();
    wx.showToast({
      title: changed > 0 ? '有 ' + changed + ' 条记录已逾期' : '已刷新',
      icon: 'none'
    });
  },

  /* ------------------------- 数据处理 ------------------------- */

  /**
   * 一次性算出五个页签各自的数据
   * 之所以不做成「切换时才过滤」，是因为 swiper 要求五个屏同时存在，
   * 若每屏单独取数据，滑动到未加载的屏就会看到空白。
   */
  loadData: function () {
    store.checkOverdue();
    var all = store.getOrders();
    var tabs = this.data.tabs;
    var lists = [];
    var counts = [];
    var maxCount = 0;

    for (var t = 0; t < tabs.length; t++) {
      var sub = [];
      for (var i = 0; i < all.length; i++) {
        if (this.matchTab(all[i], tabs[t].key)) {
          sub.push(this.decorate(all[i]));
        }
      }
      lists.push({ key: tabs[t].key, name: tabs[t].name, list: sub });
      counts.push(sub.length);
      if (sub.length > maxCount) { maxCount = sub.length; }
    }

    this.setData({ tabLists: lists, counts: counts });
    this.calculateHeight(maxCount);
  },

  /**
   * 判断一条记录是否属于某个页签
   * 「进行中」把「已逾期」一起纳入，因为逾期本质上仍未归还，需要用户处理。
   */
  matchTab: function (order, key) {
    if (key === 'all') { return true; }
    if (key === 'ongoing') {
      return order.status === 'ongoing' || order.status === 'overdue';
    }
    return order.status === key;
  },

  /**
   * 为一条记录补充展示字段
   * 把「该显示什么、该给哪些按钮」这类判断集中在这里，
   * WXML 只负责渲染，不写复杂逻辑。
   */
  decorate: function (o) {
    var item = JSON.parse(JSON.stringify(o));
    item.isAid = o.bizType === 'aid';

    // 时间描述：借用单显示借用区间，预约单显示预约时间
    if (item.isAid) {
      item.timeText = o.startDate + ' 至 ' + o.endDate + '（' + o.days + ' 天）';
    } else {
      item.timeText = o.bookingDate + ' ' + o.timeSlot;
    }
    item.typeText = item.isAid ? '辅具借用' : '手语服务';

    // 状态相关按钮的可用性
    item.canAudit = o.status === 'pending';                                   // 待审核 -> 通过
    item.canReturn = o.status === 'ongoing' || o.status === 'overdue';         // 进行中/逾期 -> 归还
    item.canCancel = o.status === 'pending' || o.status === 'ongoing';         // 未结束 -> 取消
    item.canDelete = o.status === 'done' || o.status === 'canceled';           // 已结束 -> 删除

    // 归还 / 完成的按钮文案
    item.finishText = item.isAid ? '确认归还' : '确认完成';

    // 时间轴最近一条说明
    if (item.timeline && item.timeline.length > 0) {
      item.lastNote = item.timeline[item.timeline.length - 1].text;
    } else {
      item.lastNote = '';
    }
    return item;
  },

  /** 按记录条数动态计算 swiper 高度，避免固定高度造成大片空白 */
  calculateHeight: function (count) {
    var h = count * 320 + 240;
    if (h < 800) { h = 800; }
    this.setData({ swiperHeight: h });
  },

  /* ------------------------- 页签切换 ------------------------- */

  onTabTap: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    this.switchTab(index);
  },

  onSwiperChange: function (e) {
    this.switchTab(e.detail.current);
  },

  /** 统一切换页签：只更新高亮位置 */
  switchTab: function (index) {
    this.setData({
      currentTab: index,
      expandedId: ''
    });
  },

  /* ------------------------- 状态机操作 ------------------------- */

  /** 展开 / 收起时间轴 */
  onToggleTimeline: function (e) {
    var id = e.currentTarget.dataset.id;
    this.setData({ expandedId: this.data.expandedId === id ? '' : id });
  },

  /** 审核通过（预约单为「确认安排」） */
  onAudit: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认通过申请',
      content: '通过后该记录将进入「进行中」状态。',
      confirmColor: '#1B7F6B',
      success: function (res) {
        if (res.confirm) {
          store.updateOrderStatus(id, 'ongoing', '服务点审核通过，申请生效');
          that.loadData();
          wx.showToast({ title: '已通过', icon: 'success' });
        }
      }
    });
  },

  /** 归还 / 完成 */
  onFinish: function (e) {
    var id = e.currentTarget.dataset.id;
    var order = store.getOrderById(id);
    if (!order) { return; }
    var isAid = order.bizType === 'aid';
    var that = this;
    wx.showModal({
      title: isAid ? '确认归还' : '确认完成',
      content: isAid
        ? '确认已归还「' + order.refName + '」吗？归还后可借数量会自动恢复。'
        : '确认「' + order.refName + '」服务已完成吗？',
      confirmColor: '#1B7F6B',
      success: function (res) {
        if (res.confirm) {
          store.updateOrderStatus(id, 'done', isAid ? '辅具已归还，库存已恢复' : '服务已完成，感谢使用');
          that.loadData();
          wx.showToast({ title: isAid ? '已完成归还' : '已完成', icon: 'success' });
        }
      }
    });
  },

  /** 取消申请 */
  onCancel: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '取消申请',
      content: '取消后该申请不可恢复，如为借用单会释放占用的库存。',
      confirmText: '确认取消',
      confirmColor: '#D9534F',
      success: function (res) {
        if (res.confirm) {
          store.updateOrderStatus(id, 'canceled', '用户主动取消申请');
          that.loadData();
          wx.showToast({ title: '已取消', icon: 'none' });
        }
      }
    });
  },

  /** 删除已结束的记录 */
  onDelete: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '删除记录',
      content: '删除后这条记录将从列表中移除，确定删除吗？',
      confirmText: '删除',
      confirmColor: '#D9534F',
      success: function (res) {
        if (res.confirm) {
          store.removeOrder(id);
          that.loadData();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  /** 借用单可跳回辅具详情继续浏览 */
  onGoDetail: function (e) {
    wx.navigateTo({ url: '/pages/aidsDetail/aidsDetail?id=' + e.currentTarget.dataset.refid });
  },

  /** 空状态下去逛逛 */
  onGoBorrow: function () {
    wx.switchTab({ url: '/pages/aids/aids' });
  }
});

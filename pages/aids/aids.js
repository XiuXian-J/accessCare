/**
 * pages/aids/aids.js —— 辅具库
 *
 * 本页是筛选与检索的集中体现，用到了三类值得说明的技术点：
 *   1. 横向滚动分类：scroll-view 的 scroll-x 属性；
 *   2. 关键词检索：输入框内容变化时即时过滤（不需要点按钮）；
 *   3. 条件筛选与排序：switch 控制「只看可借」，radio 控制排序方式。
 * 所有筛选条件都保存在 data 里，过滤逻辑统一收敛到 applyFilter()，
 * 任何条件变化只需重新调用一次即可，避免多处重复写过滤代码。
 */

var store = require('../../utils/store.js');
var a11y = require('../../utils/a11y.js');
var options = require('../../data/options.js');

Page({

  data: {
    a11yClass: '',
    categories: options.categories,   // 分类字典
    catKey: 'all',                    // 当前选中分类
    keyword: '',                      // 搜索关键词
    onlyAvailable: false,             // 是否只看有库存的
    sortValue: 'default',             // 排序方式
    sorts: [
      { value: 'default', name: '默认排序' },
      { value: 'stock', name: '可借优先' }
    ],
    list: []                          // 过滤后的结果
  },

  onLoad: function () {
    this.applyFilter();
  },

  /**
   * 每次显示时同步无障碍主题并重算列表
   * 另外要检查首页是否通过 globalData 传来了搜索关键词
   * （tabBar 页面之间不能用 url 传参，只能这样中转）
   */
  onShow: function () {
    a11y.apply(this);
    store.checkOverdue();
    var app = getApp();
    if (app.globalData.searchKeyword) {
      this.setData({ keyword: app.globalData.searchKeyword, catKey: 'all' });
      app.globalData.searchKeyword = '';
    }
    this.applyFilter();
  },

  refreshA11y: a11y.refreshA11y,

  onPullDownRefresh: function () {
    this.applyFilter();
    wx.stopPullDownRefresh();
    wx.showToast({ title: '已刷新', icon: 'none' });
  },

  /* ------------------------- 过滤核心 ------------------------- */

  /**
   * 按当前全部分类、关键词、筛选与排序条件生成列表
   * 页面里所有条件变化最终都汇聚到这里，逻辑只有一份。
   */
  applyFilter: function () {
    var list = store.filterAids(this.data.catKey, this.data.keyword);

    // 条件筛选：只看有库存的
    if (this.data.onlyAvailable) {
      var temp = [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].stock > 0) {
          temp.push(list[i]);
        }
      }
      list = temp;
    }

    // 排序：可借数量多的排在前面
    if (this.data.sortValue === 'stock') {
      list.sort(function (a, b) {
        return b.stock - a.stock;
      });
    }

    this.setData({ list: list });
  },

  /* ------------------------- 交互事件 ------------------------- */

  /** 切换分类 */
  onCategoryTap: function (e) {
    this.setData({ catKey: e.currentTarget.dataset.key });
    this.applyFilter();
  },

  /** 输入关键词即时过滤 */
  onKeywordInput: function (e) {
    this.setData({ keyword: e.detail.value });
    this.applyFilter();
  },

  /** 回车或点按钮确认搜索（此时仅用于收起键盘与给出反馈） */
  onSearch: function () {
    this.applyFilter();
    wx.showToast({
      title: '找到 ' + this.data.list.length + ' 件辅具',
      icon: 'none'
    });
  },

  /** switch 开关：只看可借 */
  onSwitchChange: function (e) {
    this.setData({ onlyAvailable: e.detail.value });
    this.applyFilter();
  },

  /** radio 单选：排序方式 */
  onSortChange: function (e) {
    this.setData({ sortValue: e.detail.value });
    this.applyFilter();
  },

  /** 一键清空全部筛选条件 */
  onResetFilter: function () {
    this.setData({ catKey: 'all', keyword: '', onlyAvailable: false, sortValue: 'default' });
    this.applyFilter();
    wx.showToast({ title: '已重置筛选', icon: 'none' });
  },

  /** 跳转辅具详情并携带编号 */
  onAidTap: function (e) {
    wx.navigateTo({ url: '/pages/aidsDetail/aidsDetail?id=' + e.currentTarget.dataset.id });
  }
});

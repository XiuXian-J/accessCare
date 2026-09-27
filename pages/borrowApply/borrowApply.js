/**
 * pages/borrowApply/borrowApply.js —— 辅具借用申请（核心表单页之一）
 *
 * 本页是考核要求「表单录入与提交」的集中体现，覆盖了小程序表单的全部常用控件：
 *   input（姓名 / 手机号）  radio（借用时长 / 取件方式）
 *   checkbox（随借配件）    picker（起始日期）
 *   textarea（备注）        switch（同意借用协议）
 *
 * 提交流程：收集字段 -> 逐项校验 -> showModal 二次确认 -> 写入本地存储
 *           -> showToast 反馈 -> 跳转「我的记录」查看，形成业务闭环。
 */

var store = require('../../utils/store.js');
var util = require('../../utils/util.js');
var a11y = require('../../utils/a11y.js');
var options = require('../../data/options.js');

Page({

  data: {
    a11yClass: '',
    aid: null,

    // ---- 表单字段 ----
    contactName: '',
    phone: '',
    days: 7,
    startDate: '',
    endDate: '',
    pickupIndex: 0,
    pickupName: '',
    accessories: [],       // 已勾选的随借配件（checkbox 的值是数组）
    address: '',
    remark: '',
    agree: false,          // switch 在 form 里取不到值，因此单独存一份

    // ---- 选项字典 ----
    dayOptions: options.dayOptions,
    pickupMethods: options.pickupMethods,
    accessoryOptions: options.accessories,   // 可选的配件清单

    // ---- 边界与提示 ----
    minDate: '',
    maxDate: '',
    tip: ''                // 校验失败时的提示文字
  },

  onLoad: function (query) {
    var aid = store.getAidById(query.id);
    if (!aid) {
      wx.showToast({ title: '辅具不存在', icon: 'none' });
      return;
    }
    // 自动填充上次保存在本地的用户信息，减少重复录入
    var user = getApp().globalData.user || {};
    var today = util.today();

    this.setData({
      aid: aid,
      contactName: (user.nickName && user.nickName !== '同行者') ? user.nickName : '',
      phone: user.phone || '',
      pickupIndex: 0,
      pickupName: options.pickupMethods[0].name,
      startDate: today,
      minDate: today,
      maxDate: util.addDays(today, 90)
    });
    this.updateEndDate(today, this.data.days);
  },

  onShow: function () {
    a11y.apply(this);
  },

  refreshA11y: a11y.refreshA11y,

  /* ------------------------- 表单字段事件 ------------------------- */

  onNameInput: function (e) {
    this.setData({ contactName: e.detail.value, tip: '' });
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value, tip: '' });
  },

  onAddressInput: function (e) {
    this.setData({ address: e.detail.value });
  },

  onRemarkInput: function (e) {
    this.setData({ remark: e.detail.value });
  },

  /** radio：借用时长（值为字符串，需要转成数字） */
  onDaysChange: function (e) {
    var days = Number(e.detail.value);
    this.setData({ days: days });
    this.updateEndDate(this.data.startDate, days);
  },

  /** picker：起始日期 */
  onDateChange: function (e) {
    var start = e.detail.value;
    this.setData({ startDate: start });
    this.updateEndDate(start, this.data.days);
  },

  /** radio：取件方式 */
  onPickupChange: function (e) {
    var index = Number(e.detail.value);
    this.setData({
      pickupIndex: index,
      pickupName: options.pickupMethods[index].name
    });
  },

  /** checkbox：随借配件（值为数组） */
  onAccessoryChange: function (e) {
    this.setData({ accessories: e.detail.value });
  },

  /** switch：是否同意协议 */
  onAgreeChange: function (e) {
    this.setData({ agree: e.detail.value, tip: '' });
  },

  /** 根据起始日期与天数算出归还日期并展示 */
  updateEndDate: function (startDate, days) {
    var end = util.addDays(startDate, days - 1);
    this.setData({ endDate: end });
  },

  /** 一键定位选择地址（模拟器无权限时提示手动填写，不影响流程） */
  onChooseLocation: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        var addr = res.address + (res.name ? ' ' + res.name : '');
        that.setData({ address: addr });
      },
      fail: function () {
        wx.showToast({ title: '可直接手动填写地址', icon: 'none' });
      }
    });
  },

  /* ------------------------- 校验与提交 ------------------------- */

  /**
   * 表单校验，按从上到下的顺序返回第一条错误提示
   * @return {String} 空字符串表示校验通过
   */
  validate: function () {
    var d = this.data;
    if (!util.notEmpty(d.contactName)) {
      return '请填写联系人姓名';
    }
    if (!util.notEmpty(d.phone)) {
      return '请填写手机号';
    }
    if (!util.isPhone(d.phone)) {
      return '手机号格式不正确，应为 11 位数字';
    }
    if (!d.startDate) {
      return '请选择借用的起始日期';
    }
    if (d.startDate < util.today()) {
      return '起始日期不能早于今天';
    }
    if (d.days > d.aid.maxDays) {
      return '该辅具最长可借 ' + d.aid.maxDays + ' 天';
    }
    // 取件方式为「配送上门」或「他人代领」时必须填地址
    if (d.pickupIndex !== 0 && !util.notEmpty(d.address)) {
      return '请填写接收地址';
    }
    if (d.aid.stock <= 0) {
      return '该辅具当前暂无库存';
    }
    if (!d.agree) {
      return '请先阅读并同意《辅具借用协议》';
    }
    return '';
  },

  /** 提交申请 */
  onSubmit: function () {
    var msg = this.validate();
    if (msg) {
      this.setData({ tip: msg });
      wx.showToast({ title: msg, icon: 'none' });
      return;
    }

    var that = this;
    var d = this.data;
    wx.showModal({
      title: '确认提交申请',
      content: '辅具：' + d.aid.name + '\n联系人：' + d.contactName +
        '\n借用时间：' + d.startDate + ' 至 ' + d.endDate,
      confirmText: '确认提交',
      confirmColor: '#1B7F6B',
      success: function (res) {
        if (!res.confirm) {
          return;
        }
        that.doSubmit();
      }
    });
  },

  /** 真正写入数据的动作 */
  doSubmit: function () {
    var d = this.data;
    // 构造记录对象：把本地数据与表单数据合并
    var order = store.buildBorrowOrder(d.aid, {
      contactName: d.contactName,
      phone: d.phone,
      days: d.days,
      startDate: d.startDate,
      pickup: options.pickupMethods[d.pickupIndex].value,
      pickupName: d.pickupName,
      accessories: d.accessories,
      address: d.address,
      remark: d.remark,
      agree: d.agree
    });
    store.addOrder(order);        // 写入记录并扣减库存

    wx.showToast({ title: '申请已提交', icon: 'success' });
    setTimeout(function () {
      // 用 redirectTo 而不是 navigateTo，避免表单页残留在页面栈里
      wx.redirectTo({ url: '/pages/myRecords/myRecords' });
    }, 1000);
  }
});

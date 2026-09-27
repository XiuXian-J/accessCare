/**
 * pages/serviceBooking/serviceBooking.js —— 手语服务预约（核心表单页之二）
 *
 * 与辅具借用表单相比，本页的重点在于「选项随数据变化」：
 *   无障碍配套需求（checkbox）不是固定列表，而是取自当前服务自身的 needOptions，
 *   因此不同服务的可选项会自动不同，体现了数据驱动的表单设计。
 * 另外服务类型用 radio 呈现，进入页面时会按所选服务自动选中对应类型。
 */

var store = require('../../utils/store.js');
var util = require('../../utils/util.js');
var a11y = require('../../utils/a11y.js');
var options = require('../../data/options.js');

Page({

  data: {
    a11yClass: '',
    service: null,

    // ---- 表单字段 ----
    contactName: '',
    phone: '',
    serviceType: '',
    bookingDate: '',
    slotIndex: 0,
    timeSlot: '',
    needs: [],
    scene: '',
    remark: '',
    needSms: true,

    // ---- 选项字典 ----
    serviceTypes: options.serviceTypes,
    timeSlots: options.timeSlots,
    needOptions: [],       // 随服务变化的无障碍需求选项

    // ---- 边界与提示 ----
    minDate: '',
    maxDate: '',
    tip: ''
  },

  onLoad: function (query) {
    var service = store.getServiceById(query.id);
    if (!service) {
      wx.showToast({ title: '服务不存在', icon: 'none' });
      return;
    }
    var user = getApp().globalData.user || {};
    var today = util.today();

    this.setData({
      service: service,
      contactName: (user.nickName && user.nickName !== '同行者') ? user.nickName : '',
      phone: user.phone || '',
      serviceType: service.type,          // 默认选中该服务自身的类型
      bookingDate: today,
      slotIndex: 0,
      timeSlot: options.timeSlots[0],
      needOptions: service.needOptions,   // 需求选项由服务数据决定
      minDate: today,
      maxDate: util.addDays(today, 60)
    });
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

  onSceneInput: function (e) {
    this.setData({ scene: e.detail.value });
  },

  onRemarkInput: function (e) {
    this.setData({ remark: e.detail.value });
  },

  /** radio：服务类型 */
  onTypeChange: function (e) {
    this.setData({ serviceType: e.detail.value });
  },

  /** picker：预约日期 */
  onDateChange: function (e) {
    this.setData({ bookingDate: e.detail.value });
  },

  /** picker：可预约时段（选择器返回的是下标） */
  onSlotChange: function (e) {
    var index = Number(e.detail.value);
    this.setData({ slotIndex: index, timeSlot: options.timeSlots[index] });
  },

  /** checkbox：无障碍配套需求 */
  onNeedChange: function (e) {
    this.setData({ needs: e.detail.value });
  },

  /** switch：是否需要短信提醒 */
  onSmsChange: function (e) {
    this.setData({ needSms: e.detail.value });
  },

  /* ------------------------- 校验与提交 ------------------------- */

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
    if (!d.bookingDate) {
      return '请选择预约日期';
    }
    if (d.bookingDate < util.today()) {
      return '预约日期不能早于今天';
    }
    if (!d.timeSlot) {
      return '请选择预约时段';
    }
    if (!util.notEmpty(d.scene)) {
      return '请简要说明服务场景，便于安排合适的译员';
    }
    return '';
  },

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
      title: '确认预约',
      content: '服务：' + d.service.name + '\n时间：' + d.bookingDate + ' ' + d.timeSlot +
        '\n联系人：' + d.contactName,
      confirmText: '确认预约',
      confirmColor: '#1B7F6B',
      success: function (res) {
        if (res.confirm) {
          that.doSubmit();
        }
      }
    });
  },

  doSubmit: function () {
    var d = this.data;
    // 把服务类型的编码翻译成中文名一并存下来，列表页可直接展示
    var typeName = '';
    for (var i = 0; i < options.serviceTypes.length; i++) {
      if (options.serviceTypes[i].value === d.serviceType) {
        typeName = options.serviceTypes[i].name;
      }
    }

    var order = store.buildBookingOrder(d.service, {
      contactName: d.contactName,
      phone: d.phone,
      serviceType: d.serviceType,
      serviceTypeName: typeName,
      bookingDate: d.bookingDate,
      timeSlot: d.timeSlot,
      needs: d.needs,
      scene: d.scene,
      remark: d.remark
    });
    store.addOrder(order);

    wx.showToast({ title: '预约已提交', icon: 'success' });
    setTimeout(function () {
      wx.redirectTo({ url: '/pages/myRecords/myRecords' });
    }, 1000);
  }
});

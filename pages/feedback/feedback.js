/**
 * pages/feedback/feedback.js —— 意见反馈（第三个完整表单）
 *
 * 表单三要素在这页体现得很紧凑：
 *   radio（满意度单选）+ input（联系方式）+ textarea（反馈内容）。
 * 提交时做必填校验，成功后写入本地存储并清空表单，
 * 页面下方会显示已提交的反馈条数，形成「提交—反馈—可见」的闭环。
 */

var store = require('../../utils/store.js');
var util = require('../../utils/util.js');
var a11y = require('../../utils/a11y.js');
var options = require('../../data/options.js');

Page({

  data: {
    a11yClass: '',
    satisfaction: options.satisfaction,   // 满意度选项
    satisfiedIndex: -1,                    // 未选择时为 -1，便于做必填校验
    contact: '',
    content: '',
    count: 0,                              // 已提交的反馈条数
    tip: ''
  },

  onLoad: function () {
    this.setData({ count: store.getFeedbackList().length });
  },

  onShow: function () {
    a11y.apply(this);
  },

  refreshA11y: a11y.refreshA11y,

  /* ------------------------- 表单字段事件 ------------------------- */

  /** radio：满意度 */
  onSatisfactionChange: function (e) {
    this.setData({ satisfiedIndex: Number(e.detail.value), tip: '' });
  },

  /** input：联系方式 */
  onContactInput: function (e) {
    this.setData({ contact: e.detail.value, tip: '' });
  },

  /** textarea：反馈内容 */
  onContentInput: function (e) {
    this.setData({ content: e.detail.value, tip: '' });
  },

  /* ------------------------- 校验与提交 ------------------------- */

  validate: function () {
    if (this.data.satisfiedIndex < 0) {
      return '请选择整体满意度';
    }
    if (!util.notEmpty(this.data.content)) {
      return '请填写反馈内容';
    }
    if (this.data.content.trim().length < 5) {
      return '反馈内容请不少于 5 个字';
    }
    var contact = this.data.contact.trim();
    // 联系方式选填，但填了就要校验格式：手机号或邮箱
    if (contact && !util.isPhone(contact) && contact.indexOf('@') === -1) {
      return '联系方式请填写手机号或邮箱';
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

    var d = this.data;
    var count = store.addFeedback({
      id: util.makeId(),
      satisfaction: options.satisfaction[d.satisfiedIndex],
      contact: d.contact.trim(),
      content: d.content.trim(),
      createTime: util.formatDateTime(new Date())
    });

    // 提交后清空表单，并更新已提交条数
    this.setData({
      satisfiedIndex: -1,
      contact: '',
      content: '',
      count: count,
      tip: ''
    });

    wx.showModal({
      title: '提交成功',
      content: '感谢你的反馈！我们会认真阅读每一条建议，持续改进无障碍体验。',
      showCancel: false,
      confirmText: '好的',
      confirmColor: '#1B7F6B'
    });
  }
});

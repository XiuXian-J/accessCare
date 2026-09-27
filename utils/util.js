/**
 * utils/util.js —— 通用工具函数
 *
 * 收纳与业务无关的纯函数：日期格式化与运算、手机号校验、
 * 申请单号生成，供各个页面按需引入。
 */

/** 数字补零，例如 9 -> '09' */
function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

/**
 * 把 Date 对象格式化为 'YYYY-MM-DD'
 * @param {Date} date
 * @return {String}
 */
function formatDate(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

/**
 * 把 Date 对象格式化为 'YYYY-MM-DD HH:mm'
 * @param {Date} date
 * @return {String}
 */
function formatDateTime(date) {
  return formatDate(date) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

/** 今天的日期字符串，如 '2026-09-26' */
function today() {
  return formatDate(new Date());
}

/**
 * 在日期字符串上加减天数
 * @param {String} dateStr 'YYYY-MM-DD'
 * @param {Number} days    可正可负
 * @return {String} 'YYYY-MM-DD'
 */
function addDays(dateStr, days) {
  var parts = dateStr.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * 计算两个日期字符串之间相差的天数（含首日，用于计算借用天数）
 * @return {Number}
 */
function diffDays(startStr, endStr) {
  var s = startStr.split('-');
  var e = endStr.split('-');
  var d1 = new Date(Number(s[0]), Number(s[1]) - 1, Number(s[2]));
  var d2 = new Date(Number(e[0]), Number(e[1]) - 1, Number(e[2]));
  return Math.round((d2 - d1) / 86400000) + 1;
}

/** 判断日期字符串 a 是否早于 b（同为 'YYYY-MM-DD' 格式时可直接比较） */
function isBefore(a, b) {
  return a < b;
}

/**
 * 校验手机号：11 位，1 开头，第二位 3-9
 * @param {String} phone
 * @return {Boolean}
 */
function isPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 校验非空（去掉首尾空格后判断） */
function notEmpty(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

/**
 * 生成业务单号：AC + 年月日 + 4 位随机数
 * 例：AC202609264829
 * @return {String}
 */
function makeOrderId() {
  var d = new Date();
  var rand = Math.floor(Math.random() * 9000) + 1000;
  return 'AC' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + rand;
}

/** 生成一个简单的唯一 id（用于反馈记录） */
function makeId() {
  return 'ID' + Date.now() + Math.floor(Math.random() * 100);
}

module.exports = {
  pad: pad,
  formatDate: formatDate,
  formatDateTime: formatDateTime,
  today: today,
  addDays: addDays,
  diffDays: diffDays,
  isBefore: isBefore,
  isPhone: isPhone,
  notEmpty: notEmpty,
  makeOrderId: makeOrderId,
  makeId: makeId
};

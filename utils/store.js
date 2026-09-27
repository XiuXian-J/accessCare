/**
 * utils/store.js —— 本地数据仓库
 *
 * 本项目不使用真实后端，所有业务数据都保存在小程序本地存储中。
 * 本文件把散落的 wx.getStorageSync / wx.setStorageSync 统一封装，
 * 页面只调用语义化方法（借出、归还、取消…），不直接操作存储。
 *
 * 本地存储键一览：
 *   ac_settings  无障碍设置
 *   ac_orders    借用 / 预约记录数组
 *   ac_favorites 收藏的辅具编号数组
 *   ac_stock     各辅具的实时可借数量
 *   ac_feedback  意见反馈记录
 *   ac_user      用户信息
 *   ac_seeded    种子数据版本号，防止每次启动都覆盖用户数据
 */

var aidsData = require('../data/aids.js');
var servicesData = require('../data/services.js');
var options = require('../data/options.js');
var util = require('./util.js');

/* ================================================================
 *  一、基础读写
 * ================================================================ */

/**
 * 读数组，为空时返回空数组
 * 必须做兜底：首次启动时该键不存在，getStorageSync 返回的是空字符串而非 []
 */
function readList(key) {
  return wx.getStorageSync(key) || [];
}

function writeList(key, list) {
  wx.setStorageSync(key, list);
}

/* ================================================================
 *  二、初始化种子数据
 * ================================================================ */

/** 种子数据版本，改动内置数据后可升级版本号触发重新初始化 */
var SEED_VERSION = 'v1';

/**
 * 首次运行时写入初始数据
 * 用版本号做判断，保证用户已经产生的借用记录不会被清掉。
 */
function initSeed() {
  if (wx.getStorageSync('ac_seeded') === SEED_VERSION) {
    return;
  }
  // 库存表：把内置数据的 stock 摊平成 { 编号: 数量 }
  var stockMap = {};
  for (var i = 0; i < aidsData.length; i++) {
    stockMap[aidsData[i].id] = aidsData[i].stock;
  }
  wx.setStorageSync('ac_stock', stockMap);
  writeList('ac_orders', []);
  writeList('ac_favorites', []);
  writeList('ac_feedback', []);
  wx.setStorageSync('ac_seeded', SEED_VERSION);
}

/** 让内置数据立刻回到初始状态（用于演示前重置） */
function resetAll() {
  wx.removeStorageSync('ac_seeded');
  wx.removeStorageSync('ac_orders');
  wx.removeStorageSync('ac_favorites');
  wx.removeStorageSync('ac_stock');
  wx.removeStorageSync('ac_feedback');
  initSeed();
}

/* ================================================================
 *  三、辅具数据
 * ================================================================ */

/** 取库存表 */
function getStockMap() {
  return wx.getStorageSync('ac_stock') || {};
}

/** 取某个辅具的实时可借数量 */
function getStock(id) {
  var map = getStockMap();
  if (map[id] === undefined) {
    // 表中没有时回落到内置数据的总数
    var aid = getAidById(id);
    return aid ? aid.total : 0;
  }
  return map[id];
}

/** 修改库存，delta 为增量（借出传 -1，归还传 +1） */
function changeStock(id, delta) {
  var map = getStockMap();
  var now = map[id];
  if (now === undefined) {
    var aid = getAidById(id);
    now = aid ? aid.total : 0;
  }
  map[id] = Math.max(0, now + delta);
  wx.setStorageSync('ac_stock', map);
  return map[id];
}

/** 把内置辅具数据与实时库存合并后返回（列表页直接用这份数据渲染） */
function getAids() {
  var map = getStockMap();
  var list = [];
  for (var i = 0; i < aidsData.length; i++) {
    var item = JSON.parse(JSON.stringify(aidsData[i]));
    if (map[item.id] !== undefined) {
      item.stock = map[item.id];
    }
    // 供页面直接使用的展示字段，避免在 WXML 里写复杂表达式
    item.stockText = item.stock > 0 ? ('可借 ' + item.stock + ' 台') : '暂无库存';
    item.available = item.stock > 0;
    list.push(item);
  }
  return list;
}

/** 按编号取单条辅具（含实时库存与是否已收藏） */
function getAidById(id) {
  for (var i = 0; i < aidsData.length; i++) {
    if (aidsData[i].id === id) {
      var item = JSON.parse(JSON.stringify(aidsData[i]));
      item.stock = getStock(id);
      item.stockText = item.stock > 0 ? ('可借 ' + item.stock + ' 台') : '暂无库存';
      item.available = item.stock > 0;
      item.fav = isFavorite(id);
      return item;
    }
  }
  return null;
}

/** 按分类 + 关键词筛选辅具（分类传 'all' 表示不筛选） */
function filterAids(category, keyword) {
  var all = getAids();
  var kw = (keyword || '').trim();
  var result = [];
  for (var i = 0; i < all.length; i++) {
    var item = all[i];
    var okCategory = (!category || category === 'all') ? true : item.category === category;
    var okKeyword = !kw || item.name.indexOf(kw) > -1 ||
      item.desc.indexOf(kw) > -1 ||
      item.suitable.join('').indexOf(kw) > -1;
    if (okCategory && okKeyword) {
      result.push(item);
    }
  }
  return result;
}

/* ================================================================
 *  四、手语服务数据
 * ================================================================ */

function getServices() {
  var list = JSON.parse(JSON.stringify(servicesData));
  for (var i = 0; i < list.length; i++) {
    // 展示用文本：免费 / 收费、时长
    list[i].priceText = list[i].price === 0 ? '公益免费' : ('￥' + list[i].price);
    list[i].durationText = '约 ' + list[i].duration + ' 分钟';
  }
  return list;
}

function getServiceById(id) {
  for (var i = 0; i < servicesData.length; i++) {
    if (servicesData[i].id === id) {
      return JSON.parse(JSON.stringify(servicesData[i]));
    }
  }
  return null;
}

/* ================================================================
 *  五、借用 / 预约记录（状态机）
 * ================================================================ */

/**
 * 新增一条记录（借用单或预约单）
 * @param {Object} order 记录对象，见下方 buildBorrowOrder / buildBookingOrder
 * 借用单：业务类型 aid，若有库存则同时扣减库存
 */
function addOrder(order) {
  var list = readList('ac_orders');
  list.unshift(order);          // 最新的排在最前，符合用户查看习惯
  writeList('ac_orders', list);
  if (order.bizType === 'aid') {
    changeStock(order.refId, -1);
  }
  return list;
}

/** 取全部记录 */
function getOrders() {
  return readList('ac_orders');
}

/** 按状态筛选记录，状态传 'all' 表示全部 */
function getOrdersByStatus(status) {
  var all = readList('ac_orders');
  if (!status || status === 'all') {
    return all;
  }
  var result = [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].status === status) {
      result.push(all[i]);
    }
  }
  return result;
}

/** 按编号取单条记录 */
function getOrderById(id) {
  var all = readList('ac_orders');
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      return all[i];
    }
  }
  return null;
}

/** 统计各状态记录条数，用于「我的」页面与首页数据卡 */
function countByStatus() {
  var all = readList('ac_orders');
  var res = { all: all.length, pending: 0, ongoing: 0, done: 0, canceled: 0, overdue: 0 };
  for (var i = 0; i < all.length; i++) {
    if (res[all[i].status] !== undefined) {
      res[all[i].status]++;
    }
  }
  return res;
}

/**
 * 变更记录状态（状态机的核心方法）
 * 每次变更都会追加一条时间轴，便于在详情中回溯流转过程。
 * @param {String} id     记录编号
 * @param {String} status 目标状态
 * @param {String} note   本次流转的文字说明
 */
function updateOrderStatus(id, status, note) {
  var all = readList('ac_orders');
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      var before = all[i].status;
      all[i].status = status;
      all[i].statusName = options.STATUS[status].name;
      all[i].statusCls = options.STATUS[status].cls;
      all[i].updateTime = util.formatDateTime(new Date());
      if (!all[i].timeline) {
        all[i].timeline = [];
      }
      all[i].timeline.push({
        status: status,
        time: all[i].updateTime,
        text: note || ('状态变更为' + options.STATUS[status].name)
      });
      // 借用单归还时把库存加回去
      if (all[i].bizType === 'aid' && status === 'done' && before !== 'done') {
        changeStock(all[i].refId, 1);
      }
      // 借用单取消时同样把库存加回去（无论此前是否已审核通过）
      if (all[i].bizType === 'aid' && status === 'canceled' &&
        (before === 'pending' || before === 'ongoing')) {
        changeStock(all[i].refId, 1);
      }
      break;
    }
  }
  writeList('ac_orders', all);
  return all;
}

/** 删除一条已结束的记录 */
function removeOrder(id) {
  var all = readList('ac_orders');
  var result = [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].id !== id) {
      result.push(all[i]);
    }
  }
  writeList('ac_orders', result);
  return result;
}

/**
 * 逾期自动判定：借用中的记录若已超过归还日期，自动置为「已逾期」
 * 在每个列表页 onShow 时调用，模拟服务端的定时任务。
 * @return {Number} 本次被置为逾期的记录条数
 */
function checkOverdue() {
  var all = readList('ac_orders');
  var today = util.today();
  var changed = 0;
  for (var i = 0; i < all.length; i++) {
    var o = all[i];
    if (o.bizType === 'aid' && o.status === 'ongoing' && o.endDate && o.endDate < today) {
      o.status = 'overdue';
      o.statusName = options.STATUS.overdue.name;
      o.statusCls = options.STATUS.overdue.cls;
      o.updateTime = util.formatDateTime(new Date());
      if (!o.timeline) { o.timeline = []; }
      o.timeline.push({
        status: 'overdue',
        time: o.updateTime,
        text: '已超过归还日期 ' + o.endDate + '，自动标记为逾期'
      });
      changed++;
    }
  }
  if (changed > 0) {
    writeList('ac_orders', all);
  }
  return changed;
}

/* ================================================================
 *  六、收藏
 * ================================================================ */

function getFavorites() {
  return readList('ac_favorites');
}

function isFavorite(id) {
  return getFavorites().indexOf(id) > -1;
}

/**
 * 切换收藏状态
 * @return {Boolean} 切换后的收藏状态，true 表示已收藏
 */
function toggleFavorite(id) {
  var list = getFavorites();
  var idx = list.indexOf(id);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.unshift(id);
  }
  writeList('ac_favorites', list);
  return idx === -1;
}

/** 取收藏的辅具完整数据（用于收藏页面渲染） */
function getFavoriteAids() {
  var ids = getFavorites();
  var result = [];
  for (var i = 0; i < ids.length; i++) {
    var aid = getAidById(ids[i]);
    if (aid) {
      result.push(aid);
    }
  }
  return result;
}

/* ================================================================
 *  七、意见反馈
 * ================================================================ */

function addFeedback(item) {
  var list = readList('ac_feedback');
  list.unshift(item);
  writeList('ac_feedback', list);
  return list.length;
}

function getFeedbackList() {
  return readList('ac_feedback');
}

/* ================================================================
 *  八、构造记录对象
 * ================================================================ */

/**
 * 构造一条辅具借用记录
 * @param {Object} aid   辅具数据
 * @param {Object} form  表单数据
 */
function buildBorrowOrder(aid, form) {
  var now = new Date();
  var startDate = form.startDate || util.today();
  var days = Number(form.days) || 7;
  return {
    id: util.makeOrderId(),
    bizType: 'aid',
    refId: aid.id,
    refName: aid.name,
    cover: aid.cover,
    emoji: aid.emoji,
    // ---- 表单字段 ----
    contactName: form.contactName,
    phone: form.phone,
    days: days,
    startDate: startDate,
    endDate: util.addDays(startDate, days - 1),
    pickup: form.pickup,
    pickupName: form.pickupName,
    accessories: form.accessories || [],
    address: form.address || '',
    remark: form.remark || '',
    agree: form.agree,
    // ---- 系统字段 ----
    status: 'pending',
    statusName: options.STATUS.pending.name,
    statusCls: options.STATUS.pending.cls,
    createTime: util.formatDateTime(now),
    updateTime: util.formatDateTime(now),
    timeline: [{
      status: 'pending',
      time: util.formatDateTime(now),
      text: '提交借用申请，等待服务点审核'
    }]
  };
}

/**
 * 构造一条手语服务预约记录
 * @param {Object} service 服务数据
 * @param {Object} form    表单数据
 */
function buildBookingOrder(service, form) {
  var now = new Date();
  return {
    id: util.makeOrderId(),
    bizType: 'service',
    refId: service.id,
    refName: service.name,
    cover: service.cover,
    emoji: service.emoji,
    // ---- 表单字段 ----
    contactName: form.contactName,
    phone: form.phone,
    serviceType: form.serviceType,
    serviceTypeName: form.serviceTypeName,
    bookingDate: form.bookingDate,
    timeSlot: form.timeSlot,
    needs: form.needs || [],
    scene: form.scene || '',
    remark: form.remark || '',
    // ---- 系统字段 ----
    status: 'pending',
    statusName: options.STATUS.pending.name,
    statusCls: options.STATUS.pending.cls,
    createTime: util.formatDateTime(now),
    updateTime: util.formatDateTime(now),
    timeline: [{
      status: 'pending',
      time: util.formatDateTime(now),
      text: '提交服务预约，等待安排译员'
    }]
  };
}

module.exports = {
  // 初始化
  initSeed: initSeed,
  resetAll: resetAll,
  // 辅具
  getAids: getAids,
  getAidById: getAidById,
  filterAids: filterAids,
  getStock: getStock,
  getStockMap: getStockMap,
  changeStock: changeStock,
  // 服务
  getServices: getServices,
  getServiceById: getServiceById,
  // 记录
  addOrder: addOrder,
  getOrders: getOrders,
  getOrdersByStatus: getOrdersByStatus,
  getOrderById: getOrderById,
  countByStatus: countByStatus,
  updateOrderStatus: updateOrderStatus,
  removeOrder: removeOrder,
  checkOverdue: checkOverdue,
  buildBorrowOrder: buildBorrowOrder,
  buildBookingOrder: buildBookingOrder,
  // 收藏
  getFavorites: getFavorites,
  isFavorite: isFavorite,
  toggleFavorite: toggleFavorite,
  getFavoriteAids: getFavoriteAids,
  // 反馈
  addFeedback: addFeedback,
  getFeedbackList: getFeedbackList
};

/**
 * tools/_selftest.js —— 数据层自测脚本（开发辅助，可选保留）
 *
 * 用 Node 模拟小程序的本地存储 API，把 utils/store.js 的完整业务流程跑一遍，
 * 在打开微信开发者工具之前就先把逻辑错误暴露出来。
 * 如需精简交付包，可直接删除本文件（不影响小程序运行，app.json 未引用它）。
 *
 * 运行：node tools/_selftest.js
 */

/* ---------- 模拟小程序的存储与提示 API ---------- */
var memory = {};
global.wx = {
  getStorageSync: function (k) { return memory[k] === undefined ? '' : memory[k]; },
  setStorageSync: function (k, v) { memory[k] = v; },
  removeStorageSync: function (k) { delete memory[k]; },
  showToast: function () {},
  showModal: function () {}
};

var store = require('../utils/store.js');
var util = require('../utils/util.js');
var options = require('../data/options.js');

var pass = 0, fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log('  [v] ' + label); }
  else { fail++; console.log('  [X] ' + label); }
}

console.log('=== 1. 工具函数 ===');
assert(/^\d{4}-\d{2}-\d{2}$/.test(util.today()), 'today() 返回 YYYY-MM-DD');
assert(util.addDays('2026-09-28', 6) === '2026-10-04', '日期加法跨月正确（09-28 +6 = 10-04）');
assert(util.diffDays('2026-09-28', '2026-10-04') === 7, '日期天数差正确');
assert(util.isPhone('13812345678') === true, '合法手机号通过校验');
assert(util.isPhone('12345678901') === false, '非法手机号被拒绝');
assert(util.notEmpty('  a  ') === true && util.notEmpty('   ') === false, '非空校验忽略空格');
assert(util.makeOrderId().indexOf('AC') === 0, '单号以 AC 开头');

console.log('=== 2. 初始化与库存 ===');
store.initSeed();
var aids = store.getAids();
assert(aids.length === 12, '内置辅具 12 条');
assert(store.getStock('A01') === 6, 'A01 初始库存 6');
assert(aids[0].stockText === '可借 6 台', '库存文案正确');

console.log('=== 3. 借用 -> 审核 -> 归还 全流程 ===');
var aid = store.getAidById('A01');
var order = store.buildBorrowOrder(aid, {
  contactName: '宫秀咸', phone: '13812345678', days: 7,
  startDate: util.today(), pickup: 'self', pickupName: '服务点自提',
  accessories: ['轮椅坐垫'], address: '', remark: '测试', agree: true
});
store.addOrder(order);
assert(store.getStock('A01') === 5, '提交借用后库存减 1');
assert(store.getOrderById(order.id).status === 'pending', '新记录状态为待审核');
assert(store.getOrderById(order.id).endDate === util.addDays(util.today(), 6), '归还日期 = 起始 + 天数 - 1');

store.updateOrderStatus(order.id, 'ongoing', '审核通过');
assert(store.getOrderById(order.id).status === 'ongoing', '审核通过后状态为进行中');
assert(store.getOrderById(order.id).timeline.length === 2, '时间轴追加了流转记录');

store.updateOrderStatus(order.id, 'done', '已归还');
assert(store.getStock('A01') === 6, '归还后库存恢复');
assert(store.getOrderById(order.id).status === 'done', '状态为已完成');

console.log('=== 4. 取消申请释放库存 ===');
var order2 = store.buildBorrowOrder(store.getAidById('A02'), {
  contactName: '测试', phone: '13900000000', days: 15,
  startDate: util.today(), pickup: 'self', pickupName: '服务点自提',
  accessories: [], address: '', remark: '', agree: true
});
store.addOrder(order2);
assert(store.getStock('A02') === 9, '借用后库存减 1');
store.updateOrderStatus(order2.id, 'canceled', '用户取消');
assert(store.getStock('A02') === 10, '取消后库存恢复');

console.log('=== 5. 预约流程 ===');
var svc = store.getServiceById('S01');
var booking = store.buildBookingOrder(svc, {
  contactName: '宫秀咸', phone: '13812345678', serviceType: 'onsite',
  serviceTypeName: '现场手语翻译', bookingDate: util.today(),
  timeSlot: '09:00-10:00', needs: ['轮椅通道'], scene: '陪同就医', remark: ''
});
store.addOrder(booking);
assert(store.getOrderById(booking.id).bizType === 'service', '业务类型为 service');
// 服务预约不应扣减辅具库存表（S01 是服务编号，辅具库存表里查不到）
assert(JSON.stringify(store.getStockMap()).indexOf('S01') === -1, '服务预约不影响辅具库存');

console.log('=== 6. 逾期自动判定 ===');
var order3 = store.buildBorrowOrder(store.getAidById('A03'), {
  contactName: '测试', phone: '13900000000', days: 1,
  startDate: util.addDays(util.today(), -10),   // 起始日设在 10 天前，必然逾期
  pickup: 'self', pickupName: '服务点自提',
  accessories: [], address: '', remark: '', agree: true
});
store.addOrder(order3);
store.updateOrderStatus(order3.id, 'ongoing', '审核通过');
var changed = store.checkOverdue();
assert(changed >= 1, '逾期判定生效（本次标记 ' + changed + ' 条）');
assert(store.getOrderById(order3.id).status === 'overdue', '超期记录状态为已逾期');
assert(store.countByStatus().overdue >= 1, '统计中逾期数量正确');

console.log('=== 7. 收藏与筛选 ===');
store.toggleFavorite('A05');
store.toggleFavorite('A07');
assert(store.getFavorites().length === 2, '收藏 2 条');
assert(store.getFavoriteAids().length === 2, '可取回收藏的辅具数据');
assert(store.toggleFavorite('A05') === false, '再次点击取消收藏');
assert(store.getFavorites().length === 1, '取消后剩 1 条');
assert(store.filterAids('vision', '').length === 4, '按视力辅具分类筛出 4 条');
assert(store.filterAids('all', '轮椅').length >= 2, '关键词「轮椅」可检索到结果');
assert(store.filterAids('hearing', '轮椅').length === 0, '分类与关键词同时生效');

console.log('=== 8. 删除记录 ===');
var before = store.getOrders().length;
store.removeOrder(order.id);
assert(store.getOrders().length === before - 1, '删除后记录数减 1');
assert(store.getOrderById(order.id) === null, '删除的记录已不存在');

console.log('=== 9. 状态字典完整性 ===');
for (var i = 0; i < options.recordTabs.length; i++) {
  var k = options.recordTabs[i].key;
  assert(k === 'all' || !!options.STATUS[k], '页签 ' + k + ' 在状态字典中有定义');
}

console.log('');
console.log('自测结果：通过 ' + pass + ' 项，失败 ' + fail + ' 项');
process.exit(fail === 0 ? 0 : 1);

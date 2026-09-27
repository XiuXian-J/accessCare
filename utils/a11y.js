/**
 * utils/a11y.js —— 无障碍主题同步工具
 *
 * 全局换肤机制的最后一段：每个页面在 onShow 时调用 apply(this)，
 * 并把 refreshA11y 挂到页面对象上，供 app.js 广播时回调。
 * 这样任何页面改动设置，其它已打开的页面都能立刻跟着变。
 */

var app = getApp();

/**
 * 页面 onShow 时调用：把全局设置换算成 class 字符串写进页面 data
 * 之所以放在 onShow 而不是 onLoad，是为了让从其它页面返回时也能拿到最新设置。
 * @param {Object} page 页面 this
 */
function apply(page) {
  page.setData({ a11yClass: app.a11yClass() });
}

/**
 * 供 app.broadcastA11y() 回调：无需参数，this 指向页面实例
 * 页面对象上写成 refreshA11y: a11y.refreshA11y 即可
 */
function refreshA11y() {
  this.setData({ a11yClass: app.a11yClass() });
}

/** 直接取当前 class 字符串（少数场景需要主动查询时使用） */
function classOf() {
  return app.a11yClass();
}

/** 当前是否处于高对比模式（个别页面需要做特殊处理时使用） */
function isHighContrast() {
  return !!app.globalData.a11y.highContrast;
}

module.exports = {
  apply: apply,
  refreshA11y: refreshA11y,
  classOf: classOf,
  isHighContrast: isHighContrast
};

/**
 * data/options.js —— 字典数据
 *
 * 把「分类、选项、状态」这类会被多个页面共用的字典集中在一处，
 * 避免同一份文案在多个页面里重复维护而写错。
 */

module.exports = {

  /* ------------------------- 辅具分类 ------------------------- */
  categories: [
    { key: 'all', name: '全部', emoji: '📦' },
    { key: 'mobility', name: '出行辅具', emoji: '♿' },
    { key: 'hearing', name: '听力辅具', emoji: '🦻' },
    { key: 'vision', name: '视力辅具', emoji: '🦯' },
    { key: 'limb', name: '肢体辅具', emoji: '🦾' },
    { key: 'daily', name: '生活辅具', emoji: '🍽️' }
  ],

  /* ------------------------- 借用表单选项 ------------------------- */
  // 取件方式（单选 radio，值为字符串）
  pickupMethods: [
    { value: 'self', name: '服务点自提' },
    { value: 'deliver', name: '配送上门' },
    { value: 'agent', name: '他人代领' }
  ],

  // 随借配件（多选 checkbox，值为数组）
  accessories: ['轮椅坐垫', '安全带', '防雨罩', '置物袋', '防滑手套', '备用电池'],

  // 借用天数快捷选项
  dayOptions: [7, 15, 30, 60],

  /* ------------------------- 预约表单选项 ------------------------- */
  // 服务类型（单选 radio）
  serviceTypes: [
    { value: 'onsite', name: '现场手语翻译' },
    { value: 'remote', name: '远程视频手语' },
    { value: 'training', name: '手语入门培训' }
  ],

  // 可预约时段（picker 取值，为数组下标）
  timeSlots: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00', '19:00-20:00'],

  // 无障碍配套需求（多选 checkbox）
  needs: ['轮椅通道', '字幕屏', '助听回路', '志愿者陪同'],

  /* ------------------------- 满意度（反馈表单） ------------------------- */
  satisfaction: ['非常满意', '满意', '一般', '需改进'],

  /* ------------------------- 字号档位 ------------------------- */
  fontLevels: [
    { value: 1, name: '标准' },
    { value: 2, name: '较大' },
    { value: 3, name: '特大' }
  ],

  /* ------------------------- 状态机字典 ------------------------- */
  // 键名即存储中的 status 值，顺序与「我的记录」页签顺序一致
  STATUS: {
    pending: { key: 'pending', name: '待审核', cls: 'status-pending', color: '#E8A33D' },
    ongoing: { key: 'ongoing', name: '进行中', cls: 'status-ongoing', color: '#1B7F6B' },
    done: { key: 'done', name: '已归还', cls: 'status-done', color: '#999999' },
    canceled: { key: 'canceled', name: '已取消', cls: 'status-canceled', color: '#BBBBBB' },
    overdue: { key: 'overdue', name: '已逾期', cls: 'status-overdue', color: '#D9534F' }
  },

  // 「我的记录」页签配置：全部 + 四个具体状态
  recordTabs: [
    { key: 'all', name: '全部' },
    { key: 'pending', name: '待审核' },
    { key: 'ongoing', name: '进行中' },
    { key: 'done', name: '已完成' },
    { key: 'canceled', name: '已取消' }
  ]
};

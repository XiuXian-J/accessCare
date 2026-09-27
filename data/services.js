/**
 * data/services.js —— 手语服务内置模拟数据（6 条）
 *
 * 与辅具库相对的另一条业务线：辅具解决「用得上」，手语服务解决「说得通」。
 * 每条服务都可被预约，预约记录与借用记录共用同一套状态机。
 *
 * 字段说明：
 *   id           唯一编号，预约单通过它关联服务
 *   name         服务名称
 *   type         服务类型，取值见 data/options.js 的 serviceTypes
 *   duration     单次服务时长（分钟）
 *   price        费用，0 表示公益免费
 *   cover/emoji  封面图与兜底图标
 *   desc         服务简介
 *   scenes       适用场景标签
 *   needOptions  该服务可选的无障碍配套需求（对应预约表单的多选项）
 *   quota        每日可预约名额
 */

module.exports = [
  {
    id: 'S01',
    name: '现场手语翻译',
    type: 'onsite',
    duration: 60,
    price: 0,
    cover: '/images/cover/sign.png',
    emoji: '🤟',
    desc: '手语译员按约定时间到达现场，为听障人士提供面对面翻译，沟通更自然准确。',
    scenes: ['医院就诊', '政务办理', '面试沟通'],
    needOptions: ['轮椅通道', '字幕屏', '助听回路', '志愿者陪同'],
    quota: 8
  },
  {
    id: 'S02',
    name: '远程视频手语翻译',
    type: 'remote',
    duration: 30,
    price: 0,
    cover: '/images/cover/remote.png',
    emoji: '📹',
    desc: '通过视频连线即时接入译员，足不出户完成沟通，适合临时、短时的交流需求。',
    scenes: ['电话沟通', '线上咨询', '临时求助'],
    needOptions: ['字幕屏', '助听回路'],
    quota: 20
  },
  {
    id: 'S03',
    name: '手语入门培训课',
    type: 'training',
    duration: 90,
    price: 0,
    cover: '/images/cover/training.png',
    emoji: '🧑‍🏫',
    desc: '面向听障家庭与志愿者的基础手语课程，从常用招呼语到就医用语逐步进阶。',
    scenes: ['家庭沟通', '志愿服务', '教师培训'],
    needOptions: ['字幕屏', '志愿者陪同'],
    quota: 15
  },
  {
    id: 'S04',
    name: '就医全程陪同志愿服务',
    type: 'onsite',
    duration: 120,
    price: 0,
    cover: '/images/cover/medical.png',
    emoji: '🏥',
    desc: '志愿者陪同挂号、问诊、取药全流程，同时提供手语沟通支持，缓解就医焦虑。',
    scenes: ['门诊陪同', '取药指导', '检查陪同'],
    needOptions: ['轮椅通道', '字幕屏', '志愿者陪同'],
    quota: 6
  },
  {
    id: 'S05',
    name: '政务办事手语协助',
    type: 'onsite',
    duration: 90,
    price: 0,
    cover: '/images/cover/gov.png',
    emoji: '🏛️',
    desc: '协助办理社保、残疾证年审、补贴申请等事项，帮助理解政策条款与填表要求。',
    scenes: ['证件办理', '补贴申请', '政策咨询'],
    needOptions: ['轮椅通道', '字幕屏', '志愿者陪同'],
    quota: 6
  },
  {
    id: 'S06',
    name: '就业面试手语支持',
    type: 'remote',
    duration: 60,
    price: 0,
    cover: '/images/cover/interview.png',
    emoji: '💼',
    desc: '线上面试实时翻译，帮助听障求职者准确表达专业能力，提升面试成功率。',
    scenes: ['线上面试', '技能考核', '入职沟通'],
    needOptions: ['字幕屏'],
    quota: 10
  }
];

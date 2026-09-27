/**
 * data/aids.js —— 辅具库内置模拟数据（12 条）
 *
 * 本项目不使用真实后端，所有辅具数据都在这里静态定义；
 * 库存数量由 utils/store.js 读写本地存储后动态覆盖，
 * 因此借用、归还操作会真实改变列表上显示的可借数量。
 *
 * 字段说明：
 *   id        唯一编号，借用单通过它关联辅具
 *   name      辅具名称
 *   category  所属分类，取值见 data/options.js 的 categories
 *   cover     封面图路径（由 tools/make_icons.py 生成）
 *   emoji     兜底图标，图片未加载时仍能显示主体
 *   images    详情页图片预览所用的图集，必须为本地文件路径
 *   desc      一句话简介
 *   params    规格参数，详情页逐行渲染
 *   suitable  适用人群标签
 *   total     设备总数
 *   stock     当前可借数量（会被本地存储中的实时值覆盖）
 *   maxDays   最长可借天数
 *   hot       是否在首页热门推荐中展示
 */

module.exports = [
  {
    id: 'A01',
    name: '轻量化手动轮椅',
    category: 'mobility',
    cover: '/images/cover/wheelchair.png',
    emoji: '♿',
    images: ['/images/cover/wheelchair.png', '/images/cover/electric.png'],
    desc: '铝合金车架，整车 9.8kg，可折叠放入汽车后备箱，适合日常代步与就医出行。',
    params: ['整车重量 9.8kg', '最大承重 100kg', '座宽 40cm', '折叠尺寸 78×30×70cm'],
    suitable: ['下肢功能障碍', '老年人短期出行', '术后康复期'],
    total: 6,
    stock: 6,
    maxDays: 30,
    hot: true
  },
  {
    id: 'A02',
    name: '折叠助行器',
    category: 'mobility',
    cover: '/images/cover/walker.png',
    emoji: '🦯',
    images: ['/images/cover/walker.png', '/images/cover/ramp.png'],
    desc: '四点支撑结构，高度五档可调，帮助平衡能力较弱的用户独立行走。',
    params: ['高度 78-96cm 可调', '净重 2.4kg', '最大承重 120kg', '可折叠收纳'],
    suitable: ['平衡功能减弱', '下肢术后康复', '帕金森病患者'],
    total: 10,
    stock: 10,
    maxDays: 60,
    hot: true
  },
  {
    id: 'A03',
    name: '耳背式助听器',
    category: 'hearing',
    cover: '/images/cover/hearing.png',
    emoji: '🦻',
    images: ['/images/cover/hearing.png', '/images/cover/pillbox.png'],
    desc: '数字降噪芯片，中重度听力损失适用，附赠干燥盒与备用耳塞。',
    params: ['最大增益 60dB', '续航 约 120 小时', '适配轻度至中重度听损', '配 3 种耳塞尺寸'],
    suitable: ['听力障碍人士', '老年性耳聋', '单侧听损'],
    total: 8,
    stock: 8,
    maxDays: 45,
    hot: true
  },
  {
    id: 'A04',
    name: '四脚防滑盲杖',
    category: 'vision',
    cover: '/images/cover/cane.png',
    emoji: '🩼',
    images: ['/images/cover/cane.png', '/images/cover/braille.png'],
    desc: '四脚底座可自由站立，杖身红白反光，夜间出行更安全。',
    params: ['杖身长度 115cm 可调', '净重 0.6kg', '四脚底座可站立', '红白反光贴膜'],
    suitable: ['视力障碍人士', '低视力人群', '临时行动不便'],
    total: 12,
    stock: 12,
    maxDays: 90,
    hot: true
  },
  {
    id: 'A05',
    name: '电动轮椅（院内外出用）',
    category: 'mobility',
    cover: '/images/cover/electric.png',
    emoji: '🛞',
    images: ['/images/cover/electric.png', '/images/cover/wheelchair.png'],
    desc: '智能控制器，续航 30 公里，可上坡道，适合长距离出行与就医往返。',
    params: ['续航 约 30km', '最高时速 6km/h', '最大爬坡 12°', '铅酸电池可拆卸'],
    suitable: ['重度下肢障碍', '长期卧床康复', '远距离出行需求'],
    total: 4,
    stock: 4,
    maxDays: 15,
    hot: false
  },
  {
    id: 'A06',
    name: '手持电子放大镜',
    category: 'vision',
    cover: '/images/cover/magnifier.png',
    emoji: '🔍',
    images: ['/images/cover/magnifier.png', '/images/cover/braille.png'],
    desc: '最大 24 倍放大，支持正负片切换，可用于读书、看药品说明书、辨认票据。',
    params: ['放大 4-24 倍', '4.3 英寸屏幕', '内置电池续航 3 小时', '支持图像冻结'],
    suitable: ['低视力人群', '老年阅读困难', '阅读障碍学生'],
    total: 9,
    stock: 9,
    maxDays: 45,
    hot: true
  },
  {
    id: 'A07',
    name: '语音播报药盒',
    category: 'vision',
    cover: '/images/cover/pillbox.png',
    emoji: '💊',
    images: ['/images/cover/pillbox.png', '/images/cover/tableware.png'],
    desc: '到点语音播报并震动提醒，四格分装，帮助视力障碍者按时按量服药。',
    params: ['每天 4 组提醒', '语音 + 震动双提示', '四格独立分装', 'USB 充电'],
    suitable: ['视力障碍人士', '独居老年人', '认知障碍者'],
    total: 7,
    stock: 7,
    maxDays: 60,
    hot: false
  },
  {
    id: 'A08',
    name: '便携轮椅坡道板',
    category: 'mobility',
    cover: '/images/cover/ramp.png',
    emoji: '📐',
    images: ['/images/cover/ramp.png', '/images/cover/walker.png'],
    desc: '可伸缩设计，用于跨越台阶、门槛，解决轮椅出行的最后一道障碍。',
    params: ['展开长度 120-180cm', '单块承重 150kg', '净重 4.2kg', '表面防滑纹理'],
    suitable: ['轮椅使用者', '公共无障碍改造', '临时活动场地'],
    total: 5,
    stock: 5,
    maxDays: 30,
    hot: false
  },
  {
    id: 'A09',
    name: '盲文点显器（入门款）',
    category: 'vision',
    cover: '/images/cover/braille.png',
    emoji: '⠿',
    images: ['/images/cover/braille.png', '/images/cover/magnifier.png'],
    desc: '连接手机即可把文字转为盲文触摸读取，支持中英文，适合视障学生阅读。',
    params: ['20 方点阵', '蓝牙 5.0 连接', '续航 8 小时', '支持中英文切换'],
    suitable: ['视障学生', '盲文学习者', '特殊教育教师'],
    total: 3,
    stock: 3,
    maxDays: 30,
    hot: false
  },
  {
    id: 'A10',
    name: '坐姿矫正支撑椅',
    category: 'daily',
    cover: '/images/cover/posture.png',
    emoji: '🪑',
    images: ['/images/cover/posture.png', '/images/cover/walker.png'],
    desc: '带胸部与骨盆固定带，帮助脑瘫儿童维持正确坐姿，便于课堂学习。',
    params: ['适合身高 100-140cm', '五处可调固定带', '底盘可加装滚轮', '承重 60kg'],
    suitable: ['脑瘫儿童', '肌张力异常', '特殊教育学校'],
    total: 4,
    stock: 4,
    maxDays: 60,
    hot: false
  },
  {
    id: 'A11',
    name: '防抖康复餐具套装',
    category: 'daily',
    cover: '/images/cover/tableware.png',
    emoji: '🍽️',
    images: ['/images/cover/tableware.png', '/images/cover/posture.png'],
    desc: '加粗防滑手柄与防洒碗边，适合手部震颤或握力不足者自主进食。',
    params: ['含勺、叉、碗三件', '手柄直径 3.5cm', '碗底硅胶吸盘', '可高温消毒'],
    suitable: ['帕金森病患者', '手部功能障碍', '脑卒中康复期'],
    total: 11,
    stock: 11,
    maxDays: 90,
    hot: false
  },
  {
    id: 'A12',
    name: '上肢假肢适配训练器',
    category: 'limb',
    cover: '/images/cover/prosthetic.png',
    emoji: '🦾',
    images: ['/images/cover/prosthetic.png', '/images/cover/posture.png'],
    desc: '用于假肢佩戴前的抓握与肌力训练，帮助用户更快适应正式假肢。',
    params: ['训练等级 3 档', '配重块 0.5-2kg', '握力反馈指示', '附训练指导手册'],
    suitable: ['上肢截肢者', '义肢适配期', '康复训练机构'],
    total: 3,
    stock: 3,
    maxDays: 45,
    hot: false
  }
];

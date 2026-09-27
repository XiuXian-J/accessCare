# -*- coding: utf-8 -*-
"""
make_icons.py —— 「无碍同行」小程序图标素材生成器

设计说明：
  为保证作品原创性、避免版权风险，本项目不使用任何教材或网络素材，
  全部图标由本脚本用 Python 标准库（zlib + struct）直接绘制并写出 PNG 文件，
  无需安装 Pillow 等第三方依赖。

产出：
  images/bar/*.png     底部 tabBar 图标 8 个（4 个图标 × 选中/未选中两态），81×81
  images/banner/*.png  首页轮播图 3 张，750×340
  images/cover/*.png   辅具 / 服务封面图 若干，300×300

用法：
  python tools/make_icons.py
"""

import os
import zlib
import struct

# 项目根目录（本脚本位于 <root>/tools/ 下，向上退一级即为根目录）
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 主题配色：主绿 / 辅蓝 / 未选中灰
GREEN = (27, 127, 107)     # #1B7F6B
BLUE = (42, 111, 191)      # #2A6FBF
GRAY = (153, 153, 153)     # #999999
ORANGE = (232, 163, 61)    # #E8A33D
WHITE = (255, 255, 255)


# ---------------------------------------------------------------- 画布对象
class Canvas(object):
    """极简 RGBA 画布，提供矩形 / 圆形 / 三角形 / 圆角矩形 / 渐变等绘制方法"""

    def __init__(self, w, h):
        self.w = w
        self.h = h
        # 每个像素初始化为完全透明
        self.px = [[(0, 0, 0, 0) for _ in range(w)] for _ in range(h)]

    def blend(self, x, y, color, alpha=255):
        """按 alpha 混合写入一个像素（越界自动忽略）"""
        if x < 0 or y < 0 or x >= self.w or y >= self.h:
            return
        r, g, b, a = color if len(color) == 4 else (color[0], color[1], color[2], 255)
        a = int(a * alpha / 255.0)
        if a <= 0:
            return
        or_, og, ob, oa = self.px[y][x]
        # src-over 混合
        na = a + oa * (255 - a) // 255
        if na == 0:
            self.px[y][x] = (0, 0, 0, 0)
            return
        nr = (r * a + or_ * oa * (255 - a) // 255) // na
        ng = (g * a + og * oa * (255 - a) // 255) // na
        nb = (b * a + ob * oa * (255 - a) // 255) // na
        self.px[y][x] = (nr, ng, nb, na)

    def rect(self, x0, y0, x1, y1, color):
        for y in range(int(y0), int(y1)):
            for x in range(int(x0), int(x1)):
                self.blend(x, y, color)

    def circle(self, cx, cy, r, color):
        r2 = r * r
        for y in range(int(cy - r) - 1, int(cy + r) + 2):
            for x in range(int(cx - r) - 1, int(cx + r) + 2):
                dx, dy = x - cx, y - cy
                d2 = dx * dx + dy * dy
                if d2 <= r2:
                    # 边缘 1 像素做简单抗锯齿
                    edge = r2 - d2
                    a = 255 if edge > r * 1.6 else max(60, int(255 * edge / (r * 1.6)))
                    self.blend(x, y, color, a)

    def ring(self, cx, cy, r, thick, color):
        """圆环（用于车轮等图形）"""
        for y in range(int(cy - r) - 2, int(cy + r) + 3):
            for x in range(int(cx - r) - 2, int(cx + r) + 3):
                dx, dy = x - cx, y - cy
                d = (dx * dx + dy * dy) ** 0.5
                if r - thick <= d <= r:
                    self.blend(x, y, color)

    def triangle(self, p1, p2, p3, color):
        """实心三角形（重心坐标判定）"""

        def sign(ax, ay, bx, by, cx, cy):
            return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)

        xs = [int(min(p1[0], p2[0], p3[0])), int(max(p1[0], p2[0], p3[0]))]
        ys = [int(min(p1[1], p2[1], p3[1])), int(max(p1[1], p2[1], p3[1]))]
        for y in range(ys[0], ys[1] + 1):
            for x in range(xs[0], xs[1] + 1):
                d1 = sign(p1[0], p1[1], p2[0], p2[1], x, y)
                d2 = sign(p2[0], p2[1], p3[0], p3[1], x, y)
                d3 = sign(p3[0], p3[1], p1[0], p1[1], x, y)
                neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
                pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
                if not (neg and pos):
                    self.blend(x, y, color)

    def round_rect(self, x0, y0, x1, y1, r, color):
        for y in range(int(y0), int(y1)):
            for x in range(int(x0), int(x1)):
                # 计算到圆角矩形内部的最近点距离
                cx = min(max(x, x0 + r), x1 - r)
                cy = min(max(y, y0 + r), y1 - r)
                dx, dy = x - cx, y - cy
                if dx * dx + dy * dy <= r * r:
                    self.blend(x, y, color)

    def v_gradient(self, c_top, c_bottom):
        """竖向线性渐变铺满整个画布"""
        for y in range(self.h):
            t = y / float(max(1, self.h - 1))
            c = tuple(int(c_top[i] + (c_bottom[i] - c_top[i]) * t) for i in range(3))
            for x in range(self.w):
                self.blend(x, y, c)

    def save(self, path):
        """按 PNG 规范写出文件：IHDR + IDAT + IEND"""
        raw = bytearray()
        for row in self.px:
            raw.append(0)  # 每行开头的过滤类型 0（None）
            for r, g, b, a in row:
                raw += bytes((r, g, b, a))

        def chunk(tag, data):
            return (struct.pack('>I', len(data)) + tag + data +
                    struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

        ihdr = struct.pack('>IIBBBBB', self.w, self.h, 8, 6, 0, 0, 0)
        blob = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
                chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f:
            f.write(blob)
        print('  生成 %s (%dx%d, %d B)' % (os.path.relpath(path, ROOT), self.w, self.h, len(blob)))


# ---------------------------------------------------------------- tabBar 图标
def icon_home(c, color):
    """首页：屋顶三角 + 房身方块"""
    c.triangle((40, 14), (12, 40), (68, 40), color)   # 屋顶
    c.round_rect(20, 40, 61, 70, 3, color)            # 房身
    c.rect(35, 52, 46, 70, WHITE)                     # 门洞（挖空）


def icon_aids(c, color):
    """辅具：轮椅（大轮圆环 + 轮心 + 座面 + 靠背 + 小前轮）"""
    c.ring(31, 55, 17, 4.5, color)          # 大轮
    c.circle(31, 55, 3.5, color)            # 轮心
    c.round_rect(31, 41, 59, 47, 3, color)  # 座面（横向）
    c.round_rect(53, 17, 60, 43, 3.5, color)  # 靠背（纵向）
    c.round_rect(11, 51, 19, 59, 4, color)  # 小前轮
    c.rect(44, 47, 48, 60, color)           # 支撑柱


def icon_service(c, color):
    """服务：对话气泡 + 三个点（代表手语沟通 / 预约咨询）"""
    c.round_rect(12, 14, 69, 54, 12, color)           # 气泡主体
    c.triangle((26, 52), (44, 52), (26, 70), color)   # 气泡尖角
    for i, cx in enumerate((28, 40, 52)):
        c.circle(cx, 34, 5, WHITE)                    # 三个白点


def icon_mine(c, color):
    """我的：头像（头部圆 + 肩部弧）"""
    c.circle(40, 30, 14, color)                       # 头部
    for y in range(48, 72):                           # 肩部：逐行变宽的梯形
        t = (y - 48) / 24.0
        half = 12 + int(20 * t)
        c.rect(40 - half, y, 40 + half, y + 1, color)


def gen_bar_icons():
    """生成 8 个 tabBar 图标：4 图形 × 选中(绿) / 未选中(灰) 两态"""
    print('[1/3] 生成 tabBar 图标...')
    drawers = {'home': icon_home, 'aids': icon_aids,
               'service': icon_service, 'mine': icon_mine}
    for name, fn in drawers.items():
        for state, color in (('0', GREEN), ('1', GRAY)):   # 0=选中 1=未选中
            c = Canvas(81, 81)
            fn(c, color)
            c.save(os.path.join(ROOT, 'images', 'bar', '%s-%s.png' % (name, state)))


# ---------------------------------------------------------------- 轮播图
def gen_banners():
    """生成 3 张首页轮播图（750×340 纯色渐变 + 装饰圆），文字由 WXML 的 text 组件叠加"""
    print('[2/3] 生成首页轮播图...')
    plans = [
        ('banner-1.png', (27, 127, 107), (14, 92, 78)),    # 绿：辅具共享
        ('banner-2.png', (42, 111, 191), (26, 74, 134)),   # 蓝：手语服务
        ('banner-3.png', (232, 163, 61), (200, 130, 40)),  # 橙：公益科普
    ]
    for name, top, bottom in plans:
        c = Canvas(750, 340)
        c.v_gradient(top, bottom)
        # 半透明装饰圆，避免大面积纯色显得单调
        for cx, cy, r, a in ((640, 70, 120, 40), (700, 300, 90, 30), (80, 300, 150, 26)):
            for y in range(cy - r, cy + r):
                for x in range(cx - r, cx + r):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                        c.blend(x, y, WHITE, a)
        c.save(os.path.join(ROOT, 'images', 'banner', name))


# ---------------------------------------------------------------- 封面图
def gen_covers():
    """生成辅具 / 服务封面图（300×300）：主题色渐变 + 中央浅色圆，emoji 由页面 text 叠加"""
    print('[3/3] 生成辅具与服务封面图...')
    # 与 data/aids.js、data/services.js 中的 cover 字段一一对应
    plans = [
        ('wheelchair.png', (27, 127, 107), (20, 95, 82)),
        ('walker.png', (42, 111, 191), (28, 80, 140)),
        ('hearing.png', (90, 140, 200), (50, 95, 160)),
        ('cane.png', (232, 163, 61), (190, 125, 40)),
        ('electric.png', (60, 160, 140), (30, 115, 100)),
        ('magnifier.png', (150, 110, 190), (110, 78, 150)),
        ('pillbox.png', (230, 120, 120), (180, 85, 85)),
        ('ramp.png', (110, 150, 90), (80, 115, 65)),
        ('braille.png', (70, 130, 180), (45, 95, 140)),
        ('posture.png', (200, 140, 90), (155, 105, 60)),
        ('tableware.png', (120, 170, 190), (85, 130, 150)),
        ('prosthetic.png', (160, 120, 175), (120, 85, 135)),
        ('sign.png', (42, 111, 191), (26, 74, 134)),
        ('remote.png', (27, 127, 107), (18, 90, 78)),
        ('training.png', (232, 163, 61), (195, 130, 45)),
        ('medical.png', (220, 110, 110), (175, 80, 80)),
        ('gov.png', (90, 120, 190), (60, 88, 150)),
        ('interview.png', (100, 160, 130), (70, 125, 100)),
    ]
    for name, top, bottom in plans:
        c = Canvas(300, 300)
        c.v_gradient(top, bottom)
        c.circle(150, 150, 96, (255, 255, 255))            # 中央白色底盘
        c.ring(150, 150, 96, 4, tuple(int(v * 0.75) for v in top))
        c.circle(150, 150, 60, tuple(int(v * 0.9) for v in top))  # 内层色块
        c.save(os.path.join(ROOT, 'images', 'cover', name))


if __name__ == '__main__':
    print('无碍同行 —— 图标素材生成')
    print('输出根目录：%s' % ROOT)
    gen_bar_icons()
    gen_banners()
    gen_covers()
    print('全部素材生成完毕。')

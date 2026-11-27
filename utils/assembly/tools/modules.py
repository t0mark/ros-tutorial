"""3D 모델을 내려받을 수 없는 부품의 모델을 만든다.

치수 출처는 각 함수 주석과 models/SOURCES.md에 적는다. 부품 배치는 판매 페이지 사진 기준이다.
실행: python tools/modules.py  (utils/assembly에서, cadquery-ocp·numpy 필요)
결과: models/<이름>/<색>.stl. 색 이름이 8자리(rrggbbaa)면 반투명이다.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from compose import (Module, box, cone, cut, cyl, fuse, moved, prism, revolve, sphere, torus, tube)  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, 'kicad-lib')
OUT = os.path.join(HERE, '..', 'models')

GOLD = '#d4a640'
METAL = '#b8bcc2'
T = 1.6  # 기판 두께


def board(m, size, color, holes=(), ring=None, fillet=0.6):
    """기판: 바닥 z 0, 윗면 z T. holes: [(x, y, 지름)], ring: 금도금 링 바깥 지름."""
    b = box((size[0], size[1], T), (0, 0, T / 2), fillet)
    for x, y, d in holes:
        b = cut(b, cyl(d / 2, T + 1, 'z', (x, y, T / 2)))
    m.add(b, color)
    if ring:
        for x, y, d in holes:
            m.add(tube(ring / 2, d / 2, T + 0.08, 'z', (x, y, T / 2)), GOLD)


def pad(m, x, y, w, h):
    m.add(box((w, h, 0.08), (x, y, T + 0.04)), GOLD)


# ---------- 강압 컨버터 SZH-EK366: 63.4×27.5mm (디바이스마트 표기) ----------
def ek366():
    m = Module(LIB)
    board(m, (63.4, 27.5), '#1d4fb3')
    blue = {'116622': '#2367d1'}
    m.place('USB_A_Molex_67643_Horizontal', at=(-24.5, 6.2), face=180, z=T)
    m.place('TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.00mm_Horizontal', at=(-26, -7.6), face=-90, z=T, recolor=blue)
    m.place('BarrelJack_Horizontal', at=(24.5, 6.5), face=0, z=T)
    m.place('TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.00mm_Horizontal', at=(26, -7.6), face=-90, z=T, recolor=blue)
    m.place('L_Bourns_SRR1260', at=(-6, 4.5), z=T, recolor={'000000': '#3b3d40'})
    m.place('CP_Elec_8x10', at=(-12.5, -7.5), z=T)
    m.place('CP_Elec_8x10', at=(13.5, -7.5), z=T)
    m.place('TO-263-5_TabPin3', at=(8.5, 5.5), rot=90, z=T)
    m.place('D_SMB', at=(1.5, -9), rot=90, z=T)
    m.place('SOIC-8_3.9x4.9mm_P1.27mm', at=(2, -3.2), rot=0, z=T)
    for x, y in ((-2.5, -3), (-2.5, -6.5), (17.5, -1.5), (6.5, -3)):
        m.place('R_0805_2012Metric', at=(x, y), rot=90, z=T)
    for x, y in ((4.5, -10.5), (-18.5, 1)):
        m.place('C_0805_2012Metric', at=(x, y), rot=90, z=T)
    m.save(os.path.join(OUT, 'ek366'))


# ---------- TB6612 모듈 SZH-MDBL-003: 21×21mm (디바이스마트), SparkFun 배치 ----------
def tb6612():
    m = Module(LIB)
    xs = 21 / 2 - 1.27
    holes = [(sx * xs, (i - 3.5) * 2.54, 1.0) for sx in (-1, 1) for i in range(8)]
    board(m, (21, 21), '#c62a2c', holes, ring=1.7, fillet=0.4)
    m.place('SSOP-24_5.3x8.2mm_P0.65mm', at=(0, -0.5), rot=90, z=T)
    m.place('C_1206_3216Metric', at=(0, 7.4), rot=0, z=T, recolor={'221111': '#e3b62c'})
    for x in (-3.4, 0, 3.4):
        m.place('C_0805_2012Metric', at=(x, -7.6), rot=90, z=T)
    for sx in (-1, 1):
        m.place('PinHeader_1x08_P2.54mm_Vertical', at=(sx * xs, 0), rot=0, flip=True, z=0)
    m.save(os.path.join(OUT, 'tb6612'))


# ---------- MOSFET 모듈 DFR0457: 44×32mm, 고정 구멍 Ø3.1 / 링 Ø6 (DFRobot 위키) ----------
def dfr0457():
    m = Module(LIB)
    holes = [(sx * 18, sy * 12, 3.1) for sx in (-1, 1) for sy in (-1, 1)]
    board(m, (44, 32), '#1b1c1e', holes, ring=6, fillet=2)
    m.place('TerminalBlock_Phoenix_MKDS-1,5-3_1x03_P5.00mm_Horizontal', at=(15.5, 0), face=0, z=T, recolor={'116622': '#232427'})
    m.place('TO-252-2', at=(1, 3.5), rot=0, z=T)
    m.place('SOT-23', at=(-5, -4), rot=0, z=T)
    m.place('JST_PH_B3B-PH-K_1x03_P2.00mm_Vertical', at=(-15, 0), rot=90, z=T, recolor={'cccc99': '#f1efe8'})
    for x, y in ((-5, 2), (-8, -8), (4, -8)):
        m.place('R_0805_2012Metric', at=(x, y), rot=90, z=T)
    m.place('LED_0805_2012Metric', at=(-9, 7), rot=0, z=T, recolor={'116622': '#e23b2e'})
    m.save(os.path.join(OUT, 'dfr0457'))


# ---------- 3S 보호회로 SZH-18650M005: 56×45mm (디바이스마트) ----------
def bms3s():
    m = Module(LIB)
    board(m, (45, 56), '#1f7a3c', fillet=0.5)
    for y in (-21, -10, 1, 12):
        pad(m, -19.5, y, 4.5, 6)
    for y in (-21, 1, 21):
        pad(m, 19.5, y, 4.5, 6)
    for x in (-9.5, 0.5, 10.5):
        for y in (-16, -5):
            m.place('SOIC-8_3.9x4.9mm_P1.27mm', at=(x, y), rot=0, z=T)
    for x in (-9.5, 0.5, 10.5):
        m.place('SOT-23-6', at=(x, 16), rot=0, z=T)
    for i in range(7):
        m.place('R_0805_2012Metric', at=(-12 + i * 4, 7), rot=90, z=T)
        m.place('C_0805_2012Metric', at=(-12 + i * 4, 22.5), rot=90, z=T)
    for x in (-6, 6):
        m.place('R_2512_6332Metric', at=(x, -24), rot=0, z=T)
    m.save(os.path.join(OUT, 'bms3s'))


# ---------- 3S 충전 모듈 SZH-MIN012: 39×18×6.3mm (같은 기판 판매처 표기) ----------
def min012():
    m = Module(LIB)
    board(m, (39, 18), '#1f8a3e', fillet=0.4)
    m.place('USB_C_Receptacle_GCT_USB4125-xx-x_6P_TopMnt_Horizontal', at=(16, 0), face=0, z=T)
    m.place('L_Bourns_SRR1260', at=(5.5, 4), z=T, scale=0.56, recolor={'000000': '#3b3d40'})
    m.place('SOIC-8_3.9x4.9mm_P1.27mm', at=(-3.5, -3.5), rot=90, z=T)
    m.place('SOIC-8_3.9x4.9mm_P1.27mm', at=(4, -4), rot=90, z=T)
    m.place('D_SMA', at=(-3, 5.5), rot=0, z=T)
    for x in (-13, -10, -7):
        m.place('R_1206_3216Metric', at=(x, 6), rot=90, z=T)
    for x, y in ((9.5, -5), (-9, -2), (-9, -6)):
        m.place('C_0805_2012Metric', at=(x, y), rot=90, z=T)
    m.place('LED_0805_2012Metric', at=(-12.5, -6.5), z=T, recolor={'116622': '#e23b2e'})
    m.place('LED_0805_2012Metric', at=(-12.5, -3), z=T)
    for y in (6, 0, -6):
        pad(m, -17.3, y, 3, 3.6)
    m.save(os.path.join(OUT, 'min012'))


# ---------- 18650 3칸 홀더 PN-HOLDER-18650-3S: 77.7×59.7×21.3mm (디바이스마트) + 셀 3개 ----------
def holder3s():
    m = Module(LIB)
    W, L, H = 59.7, 77.7, 21.3
    pitch, rc, zc = 19.3, 9.55, 11.4
    body = box((W, L, H), (0, 0, H / 2), 1.5)
    for i in (-1, 0, 1):
        body = cut(body, cyl(rc, 70, 'y', (i * pitch, 0, zc)))
        body = cut(body, box((13, 70, 12), (i * pitch, 0, zc + 9)))
        body = cut(body, box((8, 40, 4), (i * pitch, 0, 1)))  # 바닥 창
    m.add(body, '#1f2022')
    for i in (-1, 0, 1):
        x = i * pitch
        m.add(cone(4.2, 2.2, 4.5, 'y', (x, -35, zc)), METAL)  # 음극 스프링
        m.add(box((9, 0.5, 9), (x, 34.8, zc)), METAL)  # 양극 접점
        # 18650 셀: Ø18.4×65
        m.add(cyl(9.2, 64, 'y', (x, -0.3, zc)), '#2c5fd8')
        m.add(cyl(8.6, 0.5, 'y', (x, -32.5, zc)), METAL)
        m.add(cyl(3.6, 1.2, 'y', (x, 32.3, zc)), METAL)
        m.add(tube(9.21, 7.6, 0.4, 'y', (x, 31.6, zc)), '#e8e8e8')
    m.save(os.path.join(OUT, 'holder3s'))


# ---------- WAGO 221-415: 30×18.6×8.4mm (WAGO 데이터시트) ----------
def wago221():
    m = Module(LIB)
    W, D, H = 30, 18.6, 8.4
    pitch = 5.8
    base = box((W, D, 6.0), (0, 0, 3.0), 1.2)
    for i in range(5):
        x = (i - 2) * pitch
        base = cut(base, cyl(1.9, 12, 'y', (x, -9.3, 3.0)))  # 전선 구멍
        base = cut(base, box((1.2, 2.4, 3), (x, -6.8, 6.0)))  # 시험 슬롯
    m.add(base, '#dde6ebaa')
    for i in range(5):
        x = (i - 2) * pitch
        m.add(box((3.6, 7, 3.2), (x, 1.5, 3.0)), '#9ea3a8')  # 내부 클램프
        lever = box((5.2, 15.5, 2.3), (x, -0.6, 7.25), 0.8)
        lever = fuse(lever, cyl(1.4, 5.2, 'x', (x, 7.2, 7.0)))
        m.add(lever, '#f2741d')
    m.save(os.path.join(OUT, 'wago221'))


# ---------- 전원 스위치 R16-503AD-R: Ø18.4 베젤, Ø13 버튼, M16 (Handsontec 도면) ----------
def r16():
    m = Module(LIB)
    # 패널 윗면 z 0. 베젤 8.7, 아래 몸체 9.3, 단자 7.5
    bezel = revolve([(0, 0), (9.2, 0), (9.2, 6.2), (8.6, 8.7), (0, 8.7)], 'z')
    m.add(bezel, '#1c1c1e')
    for k in range(36):
        a = 2 * math.pi * k / 36
        m.add(box((0.7, 0.7, 5.8), (9.25 * math.cos(a), 9.25 * math.sin(a), 3.2)), '#1c1c1e')
    m.add(tube(6.9, 6.5, 0.3, 'z', (0, 0, 8.8)), '#ff5a4a')  # LED 링
    m.add(revolve([(0, 8.7), (6.5, 8.7), (6.5, 11.2), (6.0, 11.7), (0, 11.7)], 'z'), '#d42f2a')
    thread = cyl(8, 3.8, 'z', (0, 0, -1.9))
    for k in range(4):
        thread = fuse(thread, torus(8, 0.25, 'z', (0, 0, -0.5 - k * 0.9)))
    m.add(thread, '#2a2b2e')
    m.add(cyl(7.4, 5.5, 'z', (0, 0, -6.55)), '#2a2b2e')
    for x, y in ((-3, 0), (3, 0), (0, 4.2), (0, -4.2)):
        m.add(box((2, 0.5, 7.5), (x, y, -13.05)), GOLD)
    m.save(os.path.join(OUT, 'r16'))


# ---------- 흡입 모터 MB3650-SUC: 하우징 Ø38.5 (모터뱅크 표기), 길이는 사진 비례 근사 ----------
def mb3650():
    m = Module(LIB)
    housing = revolve([(0, -25), (7.5, -25), (7.5, -24), (17.8, -24), (19.25, -22.5), (19.25, -6), (0, -6)], 'x')
    housing = cut(housing, cyl(7.5, 3, 'x', (-24, 0, 0)))
    m.add(housing, '#c9ccd1')
    m.add(cyl(7.4, 0.5, 'x', (-22.5, 0, 0)), '#2a2b2e')  # 임펠러
    m.add(tube(10.5, 7.5, 0.8, 'x', (-25.2, 0, 0)), '#e4dcc6')  # 흡입구 링
    ring = tube(18.4, 13.6, 3, 'x', (-4.5, 0, 0))
    for k in range(6):
        a = 2 * math.pi * k / 6
        ring = cut(ring, box((3.2, 4, 4), (-4.5, 16.5 * math.cos(a), 16.5 * math.sin(a))))
    m.add(ring, '#e4dcc6')
    can = cyl(13.85, 30, 'x', (12, 0, 0))
    for k in range(2):
        a = math.pi * k + math.pi / 2
        can = cut(can, box((7, 4, 4), (6, 13.85 * math.cos(a), 13.85 * math.sin(a))))  # 통풍구
    m.add(can, '#b9bdc2')
    m.add(cyl(13.2, 2.5, 'x', (28.25, 0, 0)), '#262628')
    m.add(cyl(3, 1.5, 'x', (30.25, 0, 0)), '#b9bdc2')
    for y in (-6, 6):
        m.add(box((5, 0.5, 2.4), (31.5, y, 0)), GOLD)
    m.save(os.path.join(OUT, 'mb3650'))


# ---------- 베어링 (규격 치수) ----------
def bearing(name, od, id_, w):
    m = Module(LIB)
    t = (od - id_) / 2
    m.add(tube(od / 2, od / 2 - t * 0.28, w, 'z'), METAL)
    m.add(tube(id_ / 2 + t * 0.28, id_ / 2, w, 'z'), METAL)
    m.add(tube(od / 2 - t * 0.28, id_ / 2 + t * 0.28, w - 0.3, 'z'), '#6b7078')  # 실드
    m.save(os.path.join(OUT, name))


def thrust_f10_18():
    m = Module(LIB)
    for z in (-1.95, 1.95):
        m.add(tube(9, 5, 1.6, 'z', (0, 0, z)), METAL)
    m.add(tube(8, 6, 1.8, 'z'), '#c9a646')
    for k in range(10):
        a = 2 * math.pi * k / 10
        m.add(sphere(1.25, (7 * math.cos(a), 7 * math.sin(a), 0)), '#dfe2e6')
    m.save(os.path.join(OUT, 'f10-18m'))


# ---------- 먼지 필터 (Mi 미니 청소기 헤파 필터): 원통 주름 필터 Ø48 ----------
def filter_hepa():
    m = Module(LIB)
    n = 44
    pts = []
    for k in range(2 * n):
        a = math.pi * k / n
        r = 23.6 if k % 2 == 0 else 19.5
        pts.append((r * math.cos(a), r * math.sin(a)))
    pleat = prism(pts, 30, -15.5)
    pleat = cut(pleat, cyl(16, 40, 'z'))
    m.add(pleat, '#f1efe8')
    m.add(tube(17, 15.5, 30, 'z', (0, 0, -0.5)), '#c8ccd0')
    m.add(cyl(24, 4, 'z', (0, 0, 16.5)), '#9aa1a8')
    m.add(tube(24, 16, 1.5, 'z', (0, 0, -16.25)), '#9aa1a8')
    m.save(os.path.join(OUT, 'filter'))


if __name__ == '__main__':
    targets = sys.argv[1:] or ['ek366', 'tb6612', 'dfr0457', 'bms3s', 'min012', 'holder3s', 'wago221', 'r16', 'mb3650', 'bearings', 'filter']
    for t in targets:
        if t == 'bearings':
            bearing('mr128zz', 12, 8, 3.5)
            bearing('mr52zz', 5, 2, 2.5)
            thrust_f10_18()
        elif t == 'filter':
            filter_hepa()
        else:
            globals()[t]()

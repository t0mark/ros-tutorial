"""전자 모듈 3D 모델 조립 도구.

판매 페이지·데이터시트 치수로 기판과 몸체를 OpenCascade 형상으로 만들고,
그 위에 KiCad 3D 라이브러리 부품(색별 STL로 변환해 둔 것)을 사진 배치대로 얹는다.
결과는 models/<이름>/<색 hex>.stl (색마다 파일 하나, 단위 mm)로 저장한다.

필요한 패키지: cadquery-ocp, numpy (requirements.txt)
"""
import glob
import math
import os
import struct
from collections import defaultdict

import numpy as np
from OCP.BRep import BRep_Tool
from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
from OCP.BRepFilletAPI import BRepFilletAPI_MakeFillet
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCone, BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeTorus
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakePolygon, BRepBuilderAPI_MakeFace, BRepBuilderAPI_Transform
from OCP.BRepPrimAPI import BRepPrimAPI_MakePrism, BRepPrimAPI_MakeRevol
from OCP.gp import gp_Ax1, gp_Ax2, gp_Dir, gp_Pnt, gp_Trsf, gp_Vec
from OCP.TopAbs import TopAbs_EDGE, TopAbs_FACE, TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS

AXES = {'x': (1, 0, 0), 'y': (0, 1, 0), 'z': (0, 0, 1)}


# ---------- STL ----------
def read_stl(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[80:84])[0]
    a = np.frombuffer(b, dtype=np.dtype([('n', '<3f4'), ('v', '<9f4'), ('a', '<u2')]), count=n, offset=84)
    return a['v'].reshape(-1, 3, 3).astype(np.float64)


def write_stl(path, tris):
    tris = np.asarray(tris, np.float32).reshape(-1, 3, 3)
    a = np.zeros(len(tris), dtype=np.dtype([('n', '<3f4'), ('v', '<9f4'), ('a', '<u2')]))
    a['v'] = tris.reshape(-1, 9)
    with open(path, 'wb') as fh:
        fh.write(b'\0' * 80 + struct.pack('<I', len(tris)))
        fh.write(a.tobytes())


# ---------- OpenCascade 형상 ----------
def box(size, center=(0, 0, 0), fillet=0.0):
    sx, sy, sz = size
    s = BRepPrimAPI_MakeBox(gp_Pnt(center[0] - sx / 2, center[1] - sy / 2, center[2] - sz / 2), sx, sy, sz).Shape()
    return round_edges(s, fillet, vertical_only=True) if fillet else s


def cyl(r, h, axis='z', center=(0, 0, 0)):
    d = AXES[axis]
    p = gp_Pnt(center[0] - d[0] * h / 2, center[1] - d[1] * h / 2, center[2] - d[2] * h / 2)
    return BRepPrimAPI_MakeCylinder(gp_Ax2(p, gp_Dir(*d)), r, h).Shape()


def cone(r1, r2, h, axis='z', base=(0, 0, 0)):
    return BRepPrimAPI_MakeCone(gp_Ax2(gp_Pnt(*base), gp_Dir(*AXES[axis])), r1, r2, h).Shape()


def sphere(r, center=(0, 0, 0)):
    from OCP.BRepPrimAPI import BRepPrimAPI_MakeSphere
    return BRepPrimAPI_MakeSphere(gp_Pnt(*center), r).Shape()


def tube(ro, ri, h, axis='z', center=(0, 0, 0)):
    return cut(cyl(ro, h, axis, center), cyl(ri, h + 0.2, axis, center))


def torus(R, r, axis='z', center=(0, 0, 0)):
    return BRepPrimAPI_MakeTorus(gp_Ax2(gp_Pnt(*center), gp_Dir(*AXES[axis])), R, r).Shape()


def revolve(profile, axis='z', center=(0, 0, 0)):
    """profile: [(r, h), ...] 닫힌 단면을 축 둘레로 회전시킨다."""
    d = AXES[axis]
    # 단면을 r→x(또는 y), h→축 방향 평면에 놓는다
    other = (0, 1, 0) if axis == 'x' else (1, 0, 0)
    poly = BRepBuilderAPI_MakePolygon()
    for r, h in profile:
        poly.Add(gp_Pnt(center[0] + other[0] * r + d[0] * h, center[1] + other[1] * r + d[1] * h, center[2] + other[2] * r + d[2] * h))
    poly.Close()
    face = BRepBuilderAPI_MakeFace(poly.Wire()).Face()
    return BRepPrimAPI_MakeRevol(face, gp_Ax1(gp_Pnt(*center), gp_Dir(*d)), 2 * math.pi).Shape()


def prism(points, h, z0=0.0):
    """xy 다각형을 z0부터 h만큼 밀어 올린다."""
    poly = BRepBuilderAPI_MakePolygon()
    for x, y in points:
        poly.Add(gp_Pnt(x, y, z0))
    poly.Close()
    face = BRepBuilderAPI_MakeFace(poly.Wire()).Face()
    return BRepPrimAPI_MakePrism(face, gp_Vec(0, 0, h)).Shape()


def cut(a, *bs):
    for b in bs:
        a = BRepAlgoAPI_Cut(a, b).Shape()
    return a


def fuse(a, *bs):
    for b in bs:
        a = BRepAlgoAPI_Fuse(a, b).Shape()
    return a


def round_edges(shape, r, vertical_only=False):
    mk = BRepFilletAPI_MakeFillet(shape)
    ex = TopExp_Explorer(shape, TopAbs_EDGE)
    n = 0
    while ex.More():
        e = TopoDS.Edge(ex.Current())
        ex.Next()
        if vertical_only:
            c = BRep_Tool.Curve_s(e, 0, 1)
            f, l = BRep_Tool.Range_s(e)
            p0, p1 = c.Value(f), c.Value(l)
            if abs(p0.X() - p1.X()) > 1e-6 or abs(p0.Y() - p1.Y()) > 1e-6:
                continue
        mk.Add(r, e)
        n += 1
    try:
        return mk.Shape() if n else shape
    except Exception:
        return shape


def moved(shape, rot=(), pos=(0, 0, 0)):
    """rot: [('x', 도), ...] 차례로, 그다음 pos로 옮긴다."""
    for axis, deg in rot:
        t = gp_Trsf()
        t.SetRotation(gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(*AXES[axis])), math.radians(deg))
        shape = BRepBuilderAPI_Transform(shape, t, True).Shape()
    t = gp_Trsf()
    t.SetTranslation(gp_Vec(*pos))
    return BRepBuilderAPI_Transform(shape, t, True).Shape()


def mesh(shape, defl=0.04, ang=0.35):
    BRepMesh_IncrementalMesh(shape, defl, False, ang, True)
    out = []
    ex = TopExp_Explorer(shape, TopAbs_FACE)
    while ex.More():
        f = TopoDS.Face(ex.Current())
        ex.Next()
        loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(f, loc)
        if tri is None:
            continue
        tr = loc.Transformation()
        pts = np.array([[p.X(), p.Y(), p.Z()] for p in (tri.Node(i).Transformed(tr) for i in range(1, tri.NbNodes() + 1))])
        idx = np.array([tri.Triangle(i).Get() for i in range(1, tri.NbTriangles() + 1)]) - 1
        if f.Orientation() == TopAbs_REVERSED:
            idx = idx[:, [0, 2, 1]]
        out.append(pts[idx])
    return np.concatenate(out) if out else np.zeros((0, 3, 3))


# ---------- 변환 ----------
def rot_matrix(rot):
    m = np.eye(3)
    for axis, deg in rot:
        a = math.radians(deg)
        c, s = math.cos(a), math.sin(a)
        r = {'x': [[1, 0, 0], [0, c, -s], [0, s, c]], 'y': [[c, 0, s], [0, 1, 0], [-s, 0, c]], 'z': [[c, -s, 0], [s, c, 0], [0, 0, 1]]}[axis]
        m = np.array(r) @ m
    return m


# ---------- 조립 ----------
class Module:
    def __init__(self, lib_dir):
        self.lib_dir = lib_dir
        self.groups = defaultdict(list)
        self._lib = {}

    def add(self, shape, color, defl=0.04):
        self.groups[color.lstrip('#').lower()].append(mesh(shape, defl))

    def add_tris(self, tris, color):
        self.groups[color.lstrip('#').lower()].append(tris)

    def lib(self, name):
        if name not in self._lib:
            parts = {}
            for f in glob.glob(os.path.join(self.lib_dir, name, '*.stl')):
                parts[os.path.basename(f)[:6].lower()] = read_stl(f)
            if not parts:
                raise FileNotFoundError(name)
            self._lib[name] = parts
        return self._lib[name]

    def place(self, name, at=(0, 0), rot=0.0, z=0.0, face=None, flip=False, recolor=None, color=None, scale=1.0):
        """KiCad 부품을 얹는다. KiCad 모델은 z 0이 기판 윗면이다.

        at: 부품(기판 위쪽 부분) 중심의 xy, rot: z축 회전(도),
        face: 커넥터 입구가 향할 방향(도, +x = 0). 입구 방향은 다리(기판 아래) 중심에서 몸체 중심 쪽으로 본다.
        flip: 기판 아랫면에 뒤집어 단다(핀 헤더 등).
        """
        parts = self.lib(name)
        allv = np.concatenate([t.reshape(-1, 3) for t in parts.values()])
        top = allv[allv[:, 2] > 0.05]
        top = top if len(top) else allv
        c = (top[:, :2].min(0) + top[:, :2].max(0)) / 2
        if face is not None:
            pins = allv[allv[:, 2] < -0.3]
            body = (top[:, :2].min(0) + top[:, :2].max(0)) / 2
            pc = pins[:, :2].mean(0) if len(pins) else body
            v = body - pc
            native = math.degrees(math.atan2(v[1], v[0])) if np.hypot(*v) > 0.2 else 0.0
            rot = face - native
        R = rot_matrix(([('x', 180)] if flip else []) + [('z', rot)])
        for col, t in parts.items():
            col = (color or (recolor or {}).get(col, col)).lstrip('#').lower()
            v = (t.reshape(-1, 3) - [c[0], c[1], 0]) * scale
            v = v @ R.T + [at[0], at[1], z]
            self.groups[col].append(v.reshape(-1, 3, 3))

    def transform(self, rot=(), pos=(0, 0, 0)):
        R = rot_matrix(rot)
        for col, ts in self.groups.items():
            self.groups[col] = [(t.reshape(-1, 3) @ R.T + pos).reshape(-1, 3, 3) for t in ts]

    def save(self, out_dir):
        os.makedirs(out_dir, exist_ok=True)
        for f in glob.glob(os.path.join(out_dir, '*.stl')):
            os.remove(f)
        total = 0
        allv = []
        for col, ts in self.groups.items():
            t = np.concatenate(ts)
            write_stl(os.path.join(out_dir, col + '.stl'), t)
            total += len(t)
            allv.append(t.reshape(-1, 3))
        v = np.concatenate(allv)
        print(f'{os.path.basename(out_dir)}: {len(self.groups)}색, 삼각형 {total}, 범위 {v.min(0).round(2)} ~ {v.max(0).round(2)}')

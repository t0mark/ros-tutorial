export class ROS2Simulator {
  constructor() {
    this.subs          = new Map();
    this.pubs          = new Map();
    this.nodes         = new Map();
    this.nodeInstances = new Map(); // id → SimulatedNode
    this.services      = new Map(); // name → { nodeId, type, handler }
    this.params        = new Map(); // nodeName → { key: value }
    this.actions       = new Map(); // name → { nodeId, type }
  }

  /* ── 노드 ──────────────────────────────────────────────── */
  registerNode(id, name) {
    this.nodes.set(id, { id, name, publishers: [], subscriptions: [] });
  }

  registerNodeInstance(id, instance) {
    this.nodeInstances.set(id, instance);
  }

  unregisterNode(id) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.subscriptions.forEach(t => {
      const arr = this.subs.get(t);
      if (arr) this.subs.set(t, arr.filter(s => s.nodeId !== id));
    });
    node.publishers.forEach(t => {
      const arr = this.pubs.get(t);
      if (arr) this.pubs.set(t, arr.filter(p => p.nodeId !== id));
    });
    this.nodes.delete(id);
    this.nodeInstances.delete(id);
    for (const [name, svc] of this.services) {
      if (svc.nodeId === id) this.services.delete(name);
    }
    for (const [name, act] of this.actions) {
      if (act.nodeId === id) this.actions.delete(name);
    }
  }

  getNodeList() {
    return Array.from(this.nodes.values()).map(n => n.name);
  }

  getNodeInfo(name) {
    return Array.from(this.nodes.values()).find(n => n.name === name);
  }

  getNodeInstanceByName(name) {
    for (const [id, inst] of this.nodeInstances) {
      if (this.nodes.get(id)?.name === name) return inst;
    }
    return null;
  }

  hasNode(name) {
    return Array.from(this.nodes.values()).some(n => n.name === name);
  }

  /* ── 토픽 ──────────────────────────────────────────────── */
  subscribe(nodeId, topic, msgType, cb) {
    if (!this.subs.has(topic)) this.subs.set(topic, []);
    const entry = { nodeId, msgType, callback: cb };
    this.subs.get(topic).push(entry);
    const node = this.nodes.get(nodeId);
    if (node && !node.subscriptions.includes(topic)) node.subscriptions.push(topic);
    return () => {
      const arr = this.subs.get(topic);
      if (arr) this.subs.set(topic, arr.filter(s => s !== entry));
    };
  }

  publish(nodeId, topic, msgType, msg) {
    if (!this.pubs.has(topic)) this.pubs.set(topic, []);
    const pubArr = this.pubs.get(topic);
    if (!pubArr.find(p => p.nodeId === nodeId)) {
      pubArr.push({ nodeId, msgType });
      const node = this.nodes.get(nodeId);
      if (node && !node.publishers.includes(topic)) node.publishers.push(topic);
    }
    const subs = this.subs.get(topic) || [];
    subs.forEach(s => { try { s.callback(msg); } catch (e) { console.error(e); } });
  }

  getTopicList() {
    const map = new Map();
    this.pubs.forEach((arr, t) => { if (arr.length) map.set(t, arr[0].msgType); });
    this.subs.forEach((arr, t) => { if (arr.length && !map.has(t)) map.set(t, arr[0].msgType); });
    return Array.from(map.entries()).map(([name, type]) => ({ name, type }));
  }

  getTopicInfo(topic) {
    const pubArr = this.pubs.get(topic) || [];
    const subArr = this.subs.get(topic) || [];
    const getName = id => this.nodes.get(id)?.name ?? id;
    return {
      type:        pubArr[0]?.msgType ?? subArr[0]?.msgType ?? 'unknown',
      pubCount:    pubArr.length,
      subCount:    subArr.length,
      publishers:  pubArr.map(p => getName(p.nodeId)),
      subscribers: subArr.map(s => getName(s.nodeId)),
    };
  }

  /* ── 서비스 ────────────────────────────────────────────── */
  registerService(nodeId, name, type, handler) {
    this.services.set(name, { nodeId, type, handler });
  }

  callService(name, request) {
    const svc = this.services.get(name);
    return svc ? svc.handler(request) : null;
  }

  getServiceList() {
    return Array.from(this.services.entries()).map(([name, s]) => ({ name, type: s.type }));
  }

  getServiceType(name) { return this.services.get(name)?.type ?? null; }
  hasService(name)     { return this.services.has(name); }

  /* ── 파라미터 ───────────────────────────────────────────── */
  setParam(nodeName, key, value) {
    if (!this.params.has(nodeName)) this.params.set(nodeName, {});
    this.params.get(nodeName)[key] = value;
  }

  getParam(nodeName, key)    { return this.params.get(nodeName)?.[key]; }
  getNodeParams(nodeName)    { return this.params.get(nodeName) ?? null; }
  getParamNodeList()         { return Array.from(this.params.keys()); }

  /* ── 액션 ──────────────────────────────────────────────── */
  registerAction(nodeId, name, type) {
    this.actions.set(name, { nodeId, type });
  }

  getActionList()       { return Array.from(this.actions.entries()).map(([name, a]) => ({ name, type: a.type })); }
  getActionType(name)   { return this.actions.get(name)?.type ?? null; }
  getActionNodeId(name) { return this.actions.get(name)?.nodeId ?? null; }
  hasAction(name)       { return this.actions.has(name); }
}

export const ros2 = new ROS2Simulator();

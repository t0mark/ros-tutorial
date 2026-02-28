export class ROS2Simulator {
  constructor() {
    this.subs = new Map();
    this.pubs = new Map();
    this.nodes = new Map();
  }

  registerNode(id, name) {
    this.nodes.set(id, { id, name, publishers: [], subscriptions: [] });
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
  }

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
    subs.forEach(s => {
      try { s.callback(msg); } catch (e) { console.error(e); }
    });
  }

  getNodeList() {
    return Array.from(this.nodes.values()).map(n => n.name);
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
      type: pubArr[0]?.msgType ?? subArr[0]?.msgType ?? 'unknown',
      pubCount: pubArr.length,
      subCount: subArr.length,
      publishers: pubArr.map(p => getName(p.nodeId)),
      subscribers: subArr.map(s => getName(s.nodeId)),
    };
  }

  getNodeInfo(name) {
    return Array.from(this.nodes.values()).find(n => n.name === name);
  }

  hasNode(name) {
    return Array.from(this.nodes.values()).some(n => n.name === name);
  }
}

export const ros2 = new ROS2Simulator();

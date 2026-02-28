export type MessageCallback = (msg: unknown) => void;

interface SubEntry {
  nodeId: string;
  msgType: string;
  callback: MessageCallback;
}

interface PubEntry {
  nodeId: string;
  msgType: string;
}

export interface NodeInfo {
  id: string;
  name: string;
  publishers: string[];
  subscriptions: string[];
}

class ROS2Simulator {
  private subs = new Map<string, SubEntry[]>();
  private pubs = new Map<string, PubEntry[]>();
  private nodes = new Map<string, NodeInfo>();

  registerNode(id: string, name: string): void {
    this.nodes.set(id, { id, name, publishers: [], subscriptions: [] });
  }

  unregisterNode(id: string): void {
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

  subscribe(nodeId: string, topic: string, msgType: string, cb: MessageCallback): () => void {
    if (!this.subs.has(topic)) this.subs.set(topic, []);
    const entry: SubEntry = { nodeId, msgType, callback: cb };
    this.subs.get(topic)!.push(entry);
    const node = this.nodes.get(nodeId);
    if (node && !node.subscriptions.includes(topic)) node.subscriptions.push(topic);
    return () => {
      const arr = this.subs.get(topic);
      if (arr) this.subs.set(topic, arr.filter(s => s !== entry));
    };
  }

  publish(nodeId: string, topic: string, msgType: string, msg: unknown): void {
    if (!this.pubs.has(topic)) this.pubs.set(topic, []);
    const pubArr = this.pubs.get(topic)!;
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

  getNodeList(): string[] {
    return Array.from(this.nodes.values()).map(n => n.name);
  }

  getTopicList(): Array<{ name: string; type: string }> {
    const map = new Map<string, string>();
    this.pubs.forEach((arr, t) => { if (arr.length) map.set(t, arr[0].msgType); });
    this.subs.forEach((arr, t) => { if (arr.length && !map.has(t)) map.set(t, arr[0].msgType); });
    return Array.from(map.entries()).map(([name, type]) => ({ name, type }));
  }

  getTopicInfo(topic: string): { type: string; pubCount: number; subCount: number; publishers: string[]; subscribers: string[] } {
    const pubArr = this.pubs.get(topic) || [];
    const subArr = this.subs.get(topic) || [];
    const getNodeName = (id: string) => this.nodes.get(id)?.name ?? id;
    return {
      type: pubArr[0]?.msgType ?? subArr[0]?.msgType ?? 'unknown',
      pubCount: pubArr.length,
      subCount: subArr.length,
      publishers: pubArr.map(p => getNodeName(p.nodeId)),
      subscribers: subArr.map(s => getNodeName(s.nodeId)),
    };
  }

  getNodeInfo(name: string): NodeInfo | undefined {
    return Array.from(this.nodes.values()).find(n => n.name === name);
  }

  hasNode(name: string): boolean {
    return Array.from(this.nodes.values()).some(n => n.name === name);
  }
}

export const ros2 = new ROS2Simulator();

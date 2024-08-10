export default class GeneralSet<T> {
  map: Map<string, T>;
  constructor() {
    this.map = new Map();
  }

  add(item: T) {
    this.map.set(JSON.stringify(item), item);
  }

  values() {
    return this.map.values();
  }

  delete(item: T) {
    return this.map.delete(JSON.stringify(item));
  }

  size() {
    return this.map.size;
  }

  [Symbol.iterator]() {
    return this.values();
  }
}
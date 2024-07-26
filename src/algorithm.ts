export function randomInt(exclusiveMax: number, inclusiveMin?: number) {
  return Math.floor(Math.random() * (exclusiveMax - (inclusiveMin ?? 0))) + (inclusiveMin ?? 0);
}

export function randomInts(length: number, exclusiveMax: number, inclusiveMin?: number) {
  let result: number[] = [];
  for (let i = 0; i < length; i++) {
    result.push(randomInt(exclusiveMax, inclusiveMin));
  }
  return result;
}

export function sequence(start: number, length: number, f: (prev: number) => number) {
  let result: number[] = [];
  let value = start;
  for (let i = 0; i < length; i++) {
    result.push(value);
    value = f(value);
  }
  return result;
}

export function countingSequence(length: number) {
  return sequence(1, length, p => p + 1)
}

export function shuffleArray<T>(input: T[]) {
  let array = input.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function primeFactors(v: number) {
  let result = [1];
  const maxFactor = Math.floor(Math.sqrt(v));
  for (let factor = 2; factor < maxFactor; factor++) {
    while (v % factor === 0) {
      result.push(factor);
      v = v / factor;
    }
  }
  return result;
}
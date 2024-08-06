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

export function sequence(length: number, start: number, f: (prev: number) => number) {
  let result: number[] = [];
  let value = start;
  for (let i = 0; i < length; i++) {
    result.push(value);
    value = f(value);
  }
  return result;
}

export function countingSequence(max: number, min?: number) {
  min ??= 1;
  return sequence(max - min + 1, min, p => p + 1)
}

export function sum(a: number[]) {
  return a.reduce((agg, c) => c + agg, 0);
}

export function product(a: number[]) {
  return a.reduce((agg, c) => agg * c, 1);
}

export function triangular(n: number) {
  return n * (n + 1) / 2;
}

export function factorial(n: number) {
  return product(countingSequence(n));
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
  let result = [];
  let maxFactor = Math.floor(Math.sqrt(v));
  let factor = 2;
  for (; factor <= v && factor <= maxFactor; factor++) {
    while (v % factor === 0) {
      result.push(factor);
      v = v / factor;
    }
  }
  if (v > 1) {
    result.push(v);
  }
  return result;
}

export function multiset(a: number[]) {
  let result: { [v: number]: number } = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i] in result) {
      result[a[i]]++;
    } else {
      result[a[i]] = 1;
    }
  }
  return result;
}

class Partition {
  numberOfValues: number;
  numberOfGroups: number;
  selections: number[];

  constructor(numberOfValues: number, numberOfGroups: number) {
    this.numberOfValues = numberOfValues;
    this.numberOfGroups = numberOfGroups;
    this.selections = new Array(numberOfValues).fill(0);
  }

  next() {
    this.selections[0]++;
    for (let i = 0; i < this.numberOfValues; i++) {
      if (this.selections[i] === this.numberOfGroups) {
        this.selections[i] = 0;
        this.selections[i + 1]++;
      } else {
        break;
      }
    }
    return this;
  }

  hasMore() {
    return this.selections[this.selections.length - 1] === 0;
  }
}
export function partitions<T>(a: T[], numberOfGroups: number) {
  let result: T[][][] = [];
  for (let partition = new Partition(a.length, numberOfGroups); partition.hasMore(); partition = partition.next()) {
    let thisPart: T[][] = [];
    for (let group = 0; group < numberOfGroups; group++) {
      thisPart.push([]);
    }
    for (let i = 0; i < a.length; i++) {
      thisPart[partition.selections[i]].push(a[i]);
    }
    result.push(thisPart);
  }
  return result;
}

export function arrayEquals<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function setEquals<T>(a: Set<T>, b: Set<T>) {
  return a.size === b.size && [...a].every(v => b.has(v));
}

// find all factorizations with the given number of factors
export function factorizations(v: number, numberOfFactors: number) {
  if (numberOfFactors === 1) {
    return [[v]];
  }
  const primes = primeFactors(v);
  const groupings = partitions(primes, numberOfFactors);
  const factorizations = groupings.map(grouping => {
    return grouping.map(group => product(group)).sort()
  }).filter((factorization, i, factorizations) => {
    for (let j = 0; j < i; j++) {
      if (arrayEquals(factorization, factorizations[j])) {
        return false;
      }
    }
    return true;
  })
  return factorizations;
}

export function intersect<T>(a: Set<T>, b: Set<T>) {
  return new Set([...a].filter(v => b.has(v)));
}

export function combinations<T>(options: T[][]) {
  const totalCombinations = product(options.map(o => o.length));
  if (totalCombinations === 0) {
    console.log(options)
    throw new Error("Cannot get combinations with 0 length option set");
  }
  const lengthMinusOnes = options.map(o => o.length - 1);
  let result: T[][] = [];
  let selection = new Array(options.length).fill(0);
  for (let c = 0; c < totalCombinations; c++) {
    // add selection to result
    let thisComb: T[] = [];
    for (let i = 0; i < options.length; i++) {
      thisComb.push(options[i][selection[i]]);
    }
    result.push(thisComb);
    // increment
    if (arrayEquals(selection, lengthMinusOnes)) {
      break;
    }
    selection[0]++;
    for (let i = 0; i < options.length && selection[i] > lengthMinusOnes[i]; i++) {
      selection[i] = 0;
      selection[i + 1]++;
    }
  }
  return result;
}
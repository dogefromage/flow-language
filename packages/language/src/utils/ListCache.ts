import { hashIntSequence, hashAnyU32 } from "./hashing";

type ListCacheRow<V> = {
    value: V;
    keys: any[];
}

export class ListCache<K extends any[] = any[], V extends any = any> {
    private data: Array<ListCacheRow<V> | null>;

    constructor(
        private size: number
    ) {
        if (size != 1 && !isPrime(size)) {
            throw new Error(`size must be 1 or prime.`)
        }
        this.data = new Array(size);
    }

    hash(keys: K): number {
        const sequenceHash = hashIntSequence(keys.map(a => hashAnyU32(a)));
        return sequenceHash % this.size;
    }

    get(keys: K): V | undefined {
        const cacheIndex = this.hash(keys);
        const row = this.data[cacheIndex]
        if (!row || !areListsEqual(keys, row.keys)) return;
        return row.value;
    }

    set(keys: K, value: V) {
        const cacheIndex = this.hash(keys);
        this.data[cacheIndex] = { keys, value };
    }

    getCacheFull() {
        let total = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] != null) {
                total++;
            }
        }
        return total / this.size;
    }
}


function areListsEqual(a: any[], b: any[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const isPrime = (num: number) => {
    if (num <= 1) return false;
    
    for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
        if (num % i === 0) return false;
    }
    return true;
}
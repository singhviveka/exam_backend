// Deterministic PRNG (Mulberry32) based on a numeric seed
function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  
  // Simple string hash to numeric seed
  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24), 1) >>> 0;
    }
    return h >>> 0;
  }
  
  export function seededShuffle(array, seedStr) {
    const seed = hashString(String(seedStr));
    const rand = mulberry32(seed);
    const arr = Array.isArray(array) ? array.slice() : [];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
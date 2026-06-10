import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';
import { Buffer as NodeBuffer } from 'node:buffer';

// ---------------------------------------------------------------------------
// Web Crypto realm bridge
// ---------------------------------------------------------------------------
// Under vitest's worker pools (forks on CI, also worker_threads), jsdom
// creates ArrayBuffer / TypedArray instances in a realm distinct from the one
// Node's native Web Crypto (`node:crypto` webcrypto) validates against. Node's
// SubtleCrypto does a cross-realm `instanceof` check on BufferSource args and
// throws "2nd argument is not instance of ArrayBuffer, Buffer, TypedArray, or
// DataView" (ERR_INVALID_ARG_TYPE) for a jsdom-realm buffer. This breaks the
// license/hardware-encryption tests at full-suite scale on CI.
//
// Fix: install Node's webcrypto as the global crypto, fronted by a Proxy that
// copies every BufferSource argument of the buffer-consuming SubtleCrypto
// methods into a node:buffer `Buffer` (guaranteed to live in the Node realm,
// so it always passes the native instanceof check) before delegating. Methods
// that take no BufferSource pass straight through. This is a test-environment
// shim only — no production code and no cryptographic behaviour changes (same
// bytes, same algorithms).
{
  const subtle = webcrypto.subtle;

  const isBufferSource = (v: unknown): boolean =>
    v instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer !== 'undefined' && v instanceof SharedArrayBuffer) ||
    (typeof ArrayBuffer.isView === 'function' && ArrayBuffer.isView(v as ArrayBufferView)) ||
    Object.prototype.toString.call(v) === '[object ArrayBuffer]' ||
    ArrayBuffer.isView?.(v as ArrayBufferView);

  // Copy any BufferSource into a Node-realm Buffer (a Uint8Array subclass).
  const coerce = (v: unknown): unknown => {
    if (v instanceof ArrayBuffer) return NodeBuffer.from(new Uint8Array(v));
    if (typeof ArrayBuffer.isView === 'function' && ArrayBuffer.isView(v as ArrayBufferView)) {
      const view = v as ArrayBufferView;
      return NodeBuffer.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    }
    return v;
  };

  // Recursively coerce BufferSource fields inside algorithm-parameter objects
  // (e.g. PBKDF2 { salt }, AES-GCM { iv, additionalData }, counter).
  const coerceDeep = (v: unknown, depth = 0): unknown => {
    if (depth > 3 || v == null) return v;
    if (isBufferSource(v)) return coerce(v);
    if (typeof v === 'object' && !(v instanceof Date)) {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = coerceDeep(val, depth + 1);
      }
      return out;
    }
    return v;
  };

  const id = (x: unknown): unknown => x;

  // Per-method positional coercers. Args not listed pass through unchanged.
  // Signatures: importKey(format,keyData,algo,extractable,usages);
  // deriveKey(algo,baseKey,...); deriveBits(algo,baseKey,length);
  // sign(algo,key,data); verify(algo,key,signature,data);
  // encrypt/decrypt(algo,key,data); digest(algo,data);
  // unwrapKey(format,wrappedKey,unwrappingKey,unwrapAlgo,unwrappedKeyAlgo,...).
  const coercers: Record<string, Array<(a: unknown) => unknown>> = {
    importKey: [id, coerce, coerceDeep],
    deriveKey: [coerceDeep],
    deriveBits: [coerceDeep],
    sign: [coerceDeep, id, coerce],
    verify: [coerceDeep, id, coerce, coerce],
    encrypt: [coerceDeep, id, coerce],
    decrypt: [coerceDeep, id, coerce],
    digest: [id, coerce],
    unwrapKey: [id, coerce, id, coerceDeep, coerceDeep],
  };

  const subtleProxy = new Proxy(subtle, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig !== 'function') return orig;
      const cs = coercers[prop as string];
      if (!cs) return orig.bind(target);
      return (...args: unknown[]) => {
        const next = args.slice();
        cs.forEach((c, i) => {
          if (i < next.length) next[i] = c(next[i]);
        });
        return (orig as (...a: unknown[]) => unknown).apply(target, next);
      };
    },
  });

  const cryptoShim = {
    subtle: subtleProxy,
    // Fill a Node-realm buffer then copy back into the caller's (possibly
    // jsdom-realm) view, so getRandomValues never hands a foreign-realm array
    // to the native implementation.
    getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
      const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      const filled = webcrypto.getRandomValues(NodeBuffer.alloc(bytes.byteLength));
      bytes.set(filled);
      return arr;
    },
    randomUUID: webcrypto.randomUUID?.bind(webcrypto),
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoShim,
    configurable: true,
    writable: true,
  });
}

// jsdom should provide `navigator`, but under worker-pool reuse it can be
// absent in some files; offlineStorage.getStorageStats reads it. Provide a
// minimal stub when missing so the storage-stats path does not throw
// "navigator is not defined".
if (typeof (globalThis as { navigator?: unknown }).navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    // Provide a working StorageManager.estimate so the getStorageStats path
    // (`'storage' in navigator && 'estimate' in navigator.storage`) resolves
    // rather than throwing. Returning zeros keeps the stats deterministic.
    value: {
      storage: { estimate: async () => ({ quota: 0, usage: 0 }) },
    } as unknown as Navigator,
    configurable: true,
    writable: true,
  });
}

// Only run browser-specific mocks in jsdom/happy-dom environment
if (typeof window !== 'undefined') {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock IndexedDB
  const indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  };

  Object.defineProperty(window, 'indexedDB', {
    value: indexedDB,
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});

// jsdom does not implement Pointer Capture APIs (https://github.com/jsdom/jsdom/issues/2527).
// Annotation tools (DrawingCanvas, RectangleTool, EllipseTool, ArrowTool, LineTool) call
// setPointerCapture / releasePointerCapture during pointer events. Provide no-op stubs so
// component tests that fire pointer events can exercise the full handler path.
if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {
      /* noop in jsdom */
    };
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {
      /* noop in jsdom */
    };
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false;
    };
  }
}

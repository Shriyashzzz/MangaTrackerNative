// What the web's code uses from the browser's Intl that Hermes (React
// Native's JavaScript engine) doesn't have: "checked 2 days ago"
// (Intl.RelativeTimeFormat, in core lib/prices.ts) and the plural rules it
// needs. Loaded first, before any of the copied code runs (app/_layout.tsx).
// Each one only fills in what's missing
import "./practiceBrowser";
import "@formatjs/intl-getcanonicallocales/polyfill.js";
import "@formatjs/intl-locale/polyfill.js";
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-relativetimeformat/polyfill.js";
import "@formatjs/intl-relativetimeformat/locale-data/en.js";

// Decoding a picked file's bytes (core lib/imports/bookCsv.ts): UTF-8 with
// strict checking, else Windows' own encoding. Hermes may have TextDecoder
// without those; this one is used only when it is missing or can't do them
type Decoder = { decode: (bytes?: ArrayBuffer | ArrayBufferView) => string };
const hasDecoders = () => {
  try {
    new TextDecoder("utf-8", { fatal: true });
    new TextDecoder("windows-1252");
    return true;
  } catch {
    return false;
  }
};
if (!hasDecoders()) {
  // the 32 places where Windows-1252 differs from Latin-1 (0x80 to 0x9F)
  const CP1252 = "€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ";
  const toBytes = (input?: ArrayBuffer | ArrayBufferView) => {
    if (!input) return new Uint8Array(0);
    if (input instanceof Uint8Array) return input;
    if (ArrayBuffer.isView(input))
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    return new Uint8Array(input);
  };
  const utf8 = (bytes: Uint8Array, fatal: boolean) => {
    let out = "";
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i]!;
      let size = 0;
      let code = 0;
      if (b < 0x80) {
        size = 1;
        code = b;
      } else if (b >= 0xc2 && b < 0xe0) {
        size = 2;
        code = b & 0x1f;
      } else if (b >= 0xe0 && b < 0xf0) {
        size = 3;
        code = b & 0x0f;
      } else if (b >= 0xf0 && b < 0xf5) {
        size = 4;
        code = b & 0x07;
      }
      let ok = size > 0 && i + size <= bytes.length;
      for (let k = 1; ok && k < size; k++) {
        const next = bytes[i + k]!;
        if ((next & 0xc0) !== 0x80) ok = false;
        else code = (code << 6) | (next & 0x3f);
      }
      if (
        ok &&
        size === 3 &&
        (code < 0x800 || (code >= 0xd800 && code < 0xe000))
      )
        ok = false;
      if (ok && size === 4 && (code < 0x10000 || code > 0x10ffff)) ok = false;
      if (!ok) {
        if (fatal) throw new TypeError("The encoded data was not valid.");
        out += "�";
        i++;
        continue;
      }
      out += String.fromCodePoint(code);
      i += size;
    }
    return out;
  };
  class PlainTextDecoder implements Decoder {
    readonly encoding: string;
    readonly fatal: boolean;
    constructor(label = "utf-8", options: { fatal?: boolean } = {}) {
      const name = label.toLowerCase();
      if (
        !["utf-8", "utf8", "windows-1252", "latin1", "iso-8859-1"].includes(
          name,
        )
      )
        throw new RangeError(`The "${label}" encoding is not supported`);
      this.encoding = name.startsWith("utf") ? "utf-8" : "windows-1252";
      this.fatal = Boolean(options.fatal);
    }
    decode(input?: ArrayBuffer | ArrayBufferView) {
      const bytes = toBytes(input);
      if (this.encoding === "utf-8") {
        // the byte order mark says nothing, as a browser's decoder drops it
        const from =
          bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
        return utf8(from ? bytes.subarray(from) : bytes, this.fatal);
      }
      let out = "";
      for (const b of bytes)
        out +=
          b >= 0x80 && b < 0xa0 ? CP1252[b - 0x80]! : String.fromCharCode(b);
      return out;
    }
  }
  (globalThis as { TextDecoder: unknown }).TextDecoder = PlainTextDecoder;
}

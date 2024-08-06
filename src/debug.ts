const debugEnabled = false;

export default function debug(m: string) {
  if (debugEnabled) {
    console.debug(m);
  }
}
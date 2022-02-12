export default function chapterURLEncode(e: string) {
  let Index = '';
  const t = e.substring(0, 1);
  '1' !== t && (Index = '-index-' + t);
  const n = parseInt(e.slice(1, -1)),
    a = e[e.length - 1];
  let m = '';

  return '0' !== a && (m = '.' + a), '-chapter-' + n + m + Index + '.html';
}

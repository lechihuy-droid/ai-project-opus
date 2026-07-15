export const splitSubtitleLines = <T>(items: T[]): T[][] => {
  if (items.length <= 6) {
    return items.length === 0 ? [] : [items];
  }

  const lineBreak = Math.ceil(items.length / 2);
  return [items.slice(0, lineBreak), items.slice(lineBreak)];
};

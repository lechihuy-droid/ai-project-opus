import type { ProductShowcaseAsset } from "../../../../src/styles/families/product-showcase";

const svgAsset = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

type MockupOptions = {
  id: string;
  label: string;
  alt: string;
  orientation: "portrait" | "landscape";
  accent: string;
  title: string;
  focalPoint?: { x: number; y: number };
};

export const createProductShowcaseMockup = ({
  id,
  label,
  alt,
  orientation,
  accent,
  title,
  focalPoint = { x: 0.5, y: 0.5 },
}: MockupOptions): ProductShowcaseAsset => {
  const landscape = orientation === "landscape";
  const width = landscape ? 1440 : 900;
  const height = landscape ? 900 : 1280;
  const panelX = landscape ? 72 : 64;
  const panelY = landscape ? 64 : 72;
  const panelWidth = width - panelX * 2;
  const panelHeight = height - panelY * 2;
  const sidebarWidth = landscape ? 260 : 0;
  const contentX = panelX + (landscape ? sidebarWidth + 56 : 44);
  const contentWidth = panelWidth - (landscape ? sidebarWidth + 100 : 88);

  return {
    id,
    src: svgAsset(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#F4F8F5"/>
  <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="40" fill="#FFFFFF" stroke="#B7C9C0" stroke-width="4"/>
  <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="104" rx="40" fill="#14211C"/>
  <circle cx="${panelX + 44}" cy="${panelY + 52}" r="15" fill="${accent}"/>
  <rect x="${panelX + 82}" y="${panelY + 37}" width="${landscape ? 350 : 260}" height="18" rx="9" fill="#DCEBE5"/>
  <rect x="${panelX + 82}" y="${panelY + 68}" width="${landscape ? 214 : 174}" height="12" rx="6" fill="#7B8A83"/>
  ${landscape ? `<rect x="${panelX + 28}" y="${panelY + 140}" width="${sidebarWidth - 18}" height="${panelHeight - 168}" rx="26" fill="#EDF4F0"/>
  <rect x="${panelX + 58}" y="${panelY + 184}" width="${sidebarWidth - 78}" height="18" rx="9" fill="#52635B"/>
  <rect x="${panelX + 58}" y="${panelY + 238}" width="${sidebarWidth - 68}" height="46" rx="16" fill="${accent}"/>
  <rect x="${panelX + 58}" y="${panelY + 314}" width="${sidebarWidth - 68}" height="46" rx="16" fill="#FFFFFF" stroke="#D3E0DA" stroke-width="3"/>` : ""}
  <rect x="${contentX}" y="${panelY + 154}" width="${contentWidth}" height="${landscape ? 228 : 286}" rx="28" fill="#DCEBE5"/>
  <rect x="${contentX + 34}" y="${panelY + 194}" width="${Math.round(contentWidth * 0.46)}" height="28" rx="14" fill="${accent}"/>
  <rect x="${contentX + 34}" y="${panelY + 250}" width="${Math.round(contentWidth * 0.72)}" height="18" rx="9" fill="#52635B"/>
  <rect x="${contentX + 34}" y="${panelY + 290}" width="${Math.round(contentWidth * 0.58)}" height="18" rx="9" fill="#8FA59A"/>
  <rect x="${contentX}" y="${panelY + (landscape ? 416 : 492)}" width="${Math.round((contentWidth - 24) / 2)}" height="${landscape ? 226 : 248}" rx="24" fill="#FFFFFF" stroke="#D3E0DA" stroke-width="3"/>
  <rect x="${contentX + Math.round((contentWidth + 24) / 2)}" y="${panelY + (landscape ? 416 : 492)}" width="${Math.round((contentWidth - 24) / 2)}" height="${landscape ? 226 : 248}" rx="24" fill="#FFFFFF" stroke="#D3E0DA" stroke-width="3"/>
  <rect x="${contentX + 30}" y="${panelY + (landscape ? 454 : 532)}" width="${Math.round(contentWidth * 0.22)}" height="18" rx="9" fill="#7B8A83"/>
  <rect x="${contentX + 30}" y="${panelY + (landscape ? 500 : 586)}" width="${Math.round(contentWidth * 0.31)}" height="64" rx="20" fill="${accent}"/>
  <rect x="${contentX + Math.round(contentWidth * 0.56)}" y="${panelY + (landscape ? 454 : 532)}" width="${Math.round(contentWidth * 0.22)}" height="18" rx="9" fill="#7B8A83"/>
  <rect x="${contentX + Math.round(contentWidth * 0.56)}" y="${panelY + (landscape ? 500 : 586)}" width="${Math.round(contentWidth * 0.29)}" height="64" rx="20" fill="#2E9F5D"/>
  <rect x="${contentX}" y="${height - (landscape ? 184 : 304)}" width="${contentWidth}" height="${landscape ? 100 : 176}" rx="26" fill="#14211C"/>
  <rect x="${contentX + 34}" y="${height - (landscape ? 146 : 256)}" width="${Math.round(contentWidth * 0.32)}" height="18" rx="9" fill="#EEF5F1"/>
  <rect x="${contentX + 34}" y="${height - (landscape ? 106 : 208)}" width="${Math.round(contentWidth * 0.65)}" height="14" rx="7" fill="#7B8A83"/>
  <text x="${contentX + 34}" y="${panelY + 182}" fill="#14211C" font-family="Arial, sans-serif" font-size="20" font-weight="700">${title}</text>
</svg>`),
    kind: "image",
    usage: "embed_asset",
    alt,
    label,
    orientation,
    focalPoint,
  };
};

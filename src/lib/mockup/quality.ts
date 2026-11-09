import type {MockupNode} from "./model";

export const mockupExportPixelRatio=4;
export const mockupPreviewPixelRatio=3;

export function deviceRasterSize(node:Pick<MockupNode,"frame"|"width">){
 const phone=node.frame==="phone",aspect=phone?3.85/7.08:8.15/5.38;
 const width=Math.max(phone?1536:3072,Math.ceil(node.width*mockupExportPixelRatio/128)*128);
 const scale=Math.min(1,4096/width,4096/(width/aspect));
 return {width:Math.round(width*scale),height:Math.round(width/aspect*scale)};
}

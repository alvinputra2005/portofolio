export const base = "/api/alvin-ganteng";
export async function api<T = Record<string, unknown>>(path:string,options:RequestInit={}):Promise<T> {
  // Match Next's trailingSlash setting and avoid a redirect for every API call.
  const queryIndex=path.indexOf("?"),pathname=queryIndex<0?path:path.slice(0,queryIndex),query=queryIndex<0?"":path.slice(queryIndex);
  const response=await fetch(`${base}${pathname.endsWith("/")?pathname:`${pathname}/`}${query}`,{...options,headers:{...(options.body instanceof FormData?{}:{"Content-Type":"application/json"}),...options.headers}});
  const data=await response.json();
  if(!response.ok) throw new Error([data.error,...(data.details||[])].join("\n"));
  return data as T;
}
export function assetUrl(ref:string) { return ref.startsWith("media:") ? `${base}/media/${ref.slice(6)}/` : ref; }
export function renewMediaImage(image:HTMLImageElement,ref:string){if(image.dataset.renewed==="true")return;image.dataset.renewed="true";image.src=assetUrl(ref);}

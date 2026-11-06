/** Development-only access. Never enable access on a public host. */
export function localAdminAllowed(input:{enabled?:string;nodeEnv?:string;host:string|null;forwardedHost?:string|null;forwardedFor?:string|null}) {
  if(input.enabled!=="true"||input.nodeEnv!=="development"||!input.host)return false;
  function loopbackHost(host:string){try{const url=new URL(`http://${host}`);return url.host===host.toLowerCase()&&["localhost","127.0.0.1","[::1]"].includes(url.hostname);}catch{return false;}}
  if(!loopbackHost(input.host))return false;
  if(input.forwardedHost&&input.forwardedHost!==input.host)return false;
  if(input.forwardedFor&&!input.forwardedFor.split(",").every(ip=>["127.0.0.1","::1","::ffff:127.0.0.1"].includes(ip.trim())))return false;
  return true;
}

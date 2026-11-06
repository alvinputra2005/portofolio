export function AdminLoading(){
 return <section className="admin-loading" role="status" aria-label="Halaman sedang dimuat"><div className="admin-skeleton admin-skeleton-title"/><div className="admin-skeleton admin-skeleton-subtitle"/><div className="admin-loading-rows">{[0,1,2].map(n=><div className="admin-loading-row" key={n}><div className="admin-skeleton admin-skeleton-image"/><div className="admin-loading-lines"><div className="admin-skeleton"/><div className="admin-skeleton"/></div></div>)}</div></section>;
}

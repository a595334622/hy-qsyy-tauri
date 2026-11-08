export interface PageSeoMeta {
  /** 页面标题 */
  title?: string;
  /** 页面描述 */
  description?: string;
  /** 页面关键词 */
  keywords?: string;
}

/** 更新当前页面 SEO 元信息。 */
export function updateDocumentSeo(meta: PageSeoMeta) {
  if (meta.title) {
    document.title = meta.title;
  }
  updateMetaContent("description", meta.description);
  updateMetaContent("keywords", meta.keywords);
}

function updateMetaContent(name: string, content?: string) {
  const value = content?.trim();
  let element = document.querySelector<HTMLMetaElement>(`meta[name='${name}']`);
  if (!value) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = value;
}

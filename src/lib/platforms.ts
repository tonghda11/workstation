export interface NewsPlatform {
  id: "google" | "bing" | "baidu";
  name: string;
  latin: string;
  searchUrl: string;
  placeholder: string;
  quickLinks: { label: string; href: string }[];
}

export const NEWS_PLATFORMS: NewsPlatform[] = [
  {
    id: "google",
    name: "谷歌",
    latin: "Google",
    searchUrl: "https://www.google.com/search?q=",
    placeholder: "用 Google 搜索",
    quickLinks: [
      { label: "Google 资讯", href: "https://news.google.com" },
      { label: "Google 翻译", href: "https://translate.google.com" },
      { label: "Google 财经", href: "https://www.google.com/finance" },
    ],
  },
  {
    id: "bing",
    name: "必应",
    latin: "Bing",
    searchUrl: "https://www.bing.com/search?q=",
    placeholder: "用 Bing 搜索",
    quickLinks: [
      { label: "Bing 资讯", href: "https://www.bing.com/news" },
      { label: "必应翻译", href: "https://www.bing.com/translator" },
      { label: "必应地图", href: "https://cn.bing.com/maps" },
    ],
  },
  {
    id: "baidu",
    name: "百度",
    latin: "Baidu",
    searchUrl: "https://www.baidu.com/s?wd=",
    placeholder: "用百度搜索",
    quickLinks: [
      { label: "百度热榜", href: "https://top.baidu.com/board?tab=realtime" },
      { label: "百度资讯", href: "https://news.baidu.com" },
      { label: "百度地图", href: "https://map.baidu.com" },
    ],
  },
];

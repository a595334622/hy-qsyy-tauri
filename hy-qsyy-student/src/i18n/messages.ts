import type { LocaleCode } from "./index";

interface MessageTree {
  [key: string]: string | MessageTree;
}

const zhCN: MessageTree = {
  site: {
    brand: "洽思英语",
    metaTitle: "洽思英语 | 专业英语教育服务",
    metaDescription: "洽思英语专注英语学习与能力成长，提供专业课程、个性化学习方案与贴心服务。",
    footerIntro: "以智能研发与制造体系，打造可靠的重载运输装备，用定制服务赢得客户信任。",
    quickNav: "快速导航",
    solutions: "解决方案",
    productCategories: "产品分类",
    semiSeries: "半挂车系列",
    specialSeries: "专用车系列",
    communicate: "立即咨询",
    search: "搜索",
    inquiry: "官网询盘",
    rights: "版权所有",
    privacy: "隐私政策",
    terms: "服务条款",
    shipping: "运输说明",
    legalEmpty: "内容筹备中，请稍后查看。",
    startProject: "开始您的项目",
    mail: "邮件",
    faqBannerTitle: "关于万邦专用车服务的常见问题",
    faqBannerText: "通过需求沟通、方案定制、智能制造、交付维护四个步骤，专业高效地交付专用运输装备。"
  },
  topbar: {
    officeAddress: "办公地址",
    phoneWhatsApp: "电话 / WhatsApp"
  },
  nav: { home: "首页", products: "产品中心", solutions: "解决方案", about: "关于万邦", blog: "行业资讯", contact: "联系我们" },
  home: {
    eyebrow: "洽思英语 | 专业英语教育服务",
    title: "您可信赖的全球重载运输合作伙伴",
    summary: "20 万平方米智能制造基地，8 条专业生产线，轻量化与新能源定制方案并重。",
    viewProducts: "查看全部产品",
    getQuote: "索取报价",
    advantagesEyebrow: "核心优势",
    advantagesTitle: "智能与服务驱动的核心竞争力",
    whyEyebrow: "为什么选择我们",
    whyTitle: "选择万邦作为您的运输装备合作伙伴",
    productsEyebrow: "产品中心",
    productsTitle: "多场景定制化的主力产品系列",
    viewAllProducts: "查看全部产品",
    semiSeries: "半挂车系列",
    specialSeries: "专用车系列",
    semiIntro: "聚焦定制适配、轻量化节能与安全合规，覆盖普货、重载与散料运输需求。",
    specialIntro: "聚焦场景化设计、安全冗余与智能控制，服务危化、冷链与应急运输。",
    aboutEyebrow: "关于万邦",
    aboutTitle: "洽思英语教育",
    aboutText: "万邦依托专用车产业集群优势，构建智能化、规模化、柔性化生产体系，从原料加工到总装检测实现全流程管控。",
    learnMore: "了解更多",
    casesEyebrow: "客户案例",
    casesTitle: "定制方案解锁运输效率新高度",
    solutionsEyebrow: "解决方案",
    solutionsTitle: "按场景定制的运输解决方案",
    viewSolution: "查看方案详情",
    factoryEyebrow: "工厂能力与资质",
    factoryTitle: "专用车配套体系与资质展示",
    factoryText: "展示万邦工厂支撑体系与研发检测能力，为危化、重装、工程运输等场景提供交付保障。",
    gmQuote: "万邦总经理：我们聚焦危化、重装等细分场景的定制专用车，从防爆配置到重载适配，提供全面解决方案。",
    blogEyebrow: "万邦资讯",
    blogTitle: "行业洞察与最新动态",
    viewAllBlog: "查看全部文章",
    readMore: "查看详情",
    ctaTitle: "准备好找到您的理想运输方案了吗",
    ctaText: "留下需求，工程师将在 24 小时内提供初步方案。"
  },
  about: {
    title: "关于洽思英语",
    summary: "专注专用运输装备研发制造，服务全球物流、工程与能源客户。",
    journeyEyebrow: "发展历程",
    journeyTitle: "从区域制造到全球交付"
  },
  productsPage: {
    title: "产品中心",
    summary: "覆盖半挂车与专用运输装备，支持按工况定制配置。",
    bannerText: "工厂直供 · 严控质检 · 全球出口",
    viewDetails: "查看详情",
    categories: "产品分类"
  },
  solutionsPage: {
    title: "解决方案",
    summary: "按行业场景提供从咨询到交付的一体化运输方案。",
    processEyebrow: "服务流程",
    processTitle: "四步交付专用运输方案"
  },
  blogPage: {
    title: "行业资讯",
    summary: "运输装备选型、维护与行业趋势实用内容。"
  },
  productDetail: {
    specs: "规格参数",
    highlights: "产品亮点",
    related: "相关产品"
  },
  solutionDetail: {
    pain: "痛点",
    result: "成效",
    overview: "方案概述",
    recommended: "推荐产品",
    features: "方案特点",
    relatedCase: "相关案例",
    getQuote: "获取报价"
  },
  blogDetail: {
    related: "相关文章"
  },
  contact: {
    title: "联系我们",
    summary: "欢迎咨询产品、方案与报价，我们将在 24 小时内回复。",
    name: "姓名",
    email: "邮箱",
    phone: "电话",
    phoneLabel: "电话",
    emailLabel: "邮箱",
    addressLabel: "办公地址",
    message: "留言",
    submit: "提交咨询",
    submitting: "提交中...",
    submitSuccess: "提交成功，我们将尽快与您联系。",
    submitFail: "提交失败，请稍后重试。",
    addressValue: "山东省济南市历城区工业北路 288 号",
    withUs: "与我们联系"
  },
  common: {
    home: "首页",
    viewDetails: "查看详情",
    understandDetails: "了解详情",
    allProducts: "全部产品"
  }
};

const enUS: MessageTree = {
  site: {
    brand: "Wanbang Truck",
    metaTitle: "Wanbang Truck | Heavy-Duty Transport Equipment",
    metaDescription: "Wanbang Truck manufactures semi-trailers and special transport equipment with intelligent manufacturing and global support.",
    footerIntro: "An intelligent R&D and manufacturing system delivering reliable heavy-duty transport equipment through customized service.",
    quickNav: "Quick Nav",
    solutions: "Solutions",
    productCategories: "Products",
    semiSeries: "Semi-Trailer Series",
    specialSeries: "Special Vehicle Series",
    communicate: "Contact Us",
    search: "Search",
    inquiry: "Inquiry",
    rights: "All Rights Reserved",
    privacy: "Privacy",
    terms: "Terms",
    shipping: "Shipping",
    legalEmpty: "Content is being prepared. Please check back later.",
    startProject: "Start Your Project",
    mail: "Email",
    faqBannerTitle: "FAQ about Wanbang special vehicle services",
    faqBannerText: "We deliver specialized vehicle solutions through consultation, customization, manufacturing and after-sales support."
  },
  topbar: {
    officeAddress: "Office",
    phoneWhatsApp: "Phone / WhatsApp"
  },
  nav: { home: "Home", products: "Products", solutions: "Solutions", about: "About", blog: "Blog", contact: "Contact" },
  home: {
    eyebrow: "Wanbang Truck | Heavy-Duty Transport Equipment",
    title: "Your Global Partner in Heavy-Duty Transport",
    summary: "200,000 sqm intelligent factory, 8 professional lines, focusing on lightweight and new-energy customization.",
    viewProducts: "View All Products",
    getQuote: "Get a Quote",
    advantagesEyebrow: "Advantages",
    advantagesTitle: "Intelligence and service driven competitiveness",
    whyEyebrow: "Why Us",
    whyTitle: "Why choose Wanbang as your transport equipment partner",
    productsEyebrow: "Products",
    productsTitle: "Main product series for multiple scenarios",
    viewAllProducts: "View All Products",
    semiSeries: "Semi-Trailer Series",
    specialSeries: "Special Purpose Vehicle Series",
    semiIntro: "Custom adaptation, lightweight design and safety compliance for general, heavy and bulk transport.",
    specialIntro: "Scenario-specific design, safety redundancy and intelligent control for chemical, cold chain and emergency use.",
    aboutEyebrow: "About",
    aboutTitle: "Wanbang Truck Manufacturing Co., Ltd.",
    aboutText: "Wanbang builds an intelligent, scalable and flexible production system from material processing to final assembly.",
    learnMore: "Learn More",
    casesEyebrow: "Customer Cases",
    casesTitle: "Custom solutions unlock higher transport efficiency",
    solutionsEyebrow: "Solutions",
    solutionsTitle: "Scenario-based transport solutions",
    viewSolution: "View Solution",
    factoryEyebrow: "Factory & Certification",
    factoryTitle: "Special vehicle manufacturing system and certifications",
    factoryText: "Factory capability supporting hazardous, heavy and engineering transport delivery.",
    gmQuote: "Our GM: While competitors focus on standardized models, Wanbang focuses on niche special vehicles from explosion-proof configs to heavy-duty adaptations.",
    blogEyebrow: "Insights",
    blogTitle: "Industry insights and latest updates",
    viewAllBlog: "View All Articles",
    readMore: "Read More",
    ctaTitle: "Ready to find your ideal transport solution?",
    ctaText: "Leave your requirements and engineers will provide an initial proposal within 24 hours."
  },
  about: {
    title: "About Wanbang Truck",
    summary: "Dedicated to special transport equipment for global logistics, engineering and energy clients.",
    journeyEyebrow: "Journey",
    journeyTitle: "From regional manufacturing to global delivery"
  },
  productsPage: {
    title: "Our Products",
    summary: "Semi-trailers and special transport equipment with custom configurations.",
    bannerText: "Factory direct · Strict QC · Global export",
    viewDetails: "View Details",
    categories: "Product Categories"
  },
  solutionsPage: {
    title: "Solutions",
    summary: "End-to-end transport solutions from consultation to delivery.",
    processEyebrow: "Process",
    processTitle: "Four steps to deliver special transport solutions"
  },
  blogPage: {
    title: "Blog",
    summary: "Practical insights on equipment selection, maintenance and industry trends."
  },
  productDetail: {
    specs: "Specifications",
    highlights: "Highlights",
    related: "Related Products"
  },
  solutionDetail: {
    pain: "Pain Point",
    result: "Result",
    overview: "Overview",
    recommended: "Recommended Products",
    features: "Features",
    relatedCase: "Related Case",
    getQuote: "Get a Quote"
  },
  blogDetail: {
    related: "Related Articles"
  },
  contact: {
    title: "Contact Us",
    summary: "Ask about products, solutions and quotations. We reply within 24 hours.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Address",
    message: "Message",
    submit: "Submit Inquiry",
    submitting: "Submitting...",
    submitSuccess: "Submitted successfully. We will contact you soon.",
    submitFail: "Submit failed. Please try again later.",
    addressValue: "288 Industrial North Road, Licheng, Jinan",
    withUs: "Contact With Us"
  },
  common: {
    home: "Home",
    viewDetails: "View Details",
    understandDetails: "Understand the details",
    allProducts: "All Products"
  }
};

function cloneTree(tree: MessageTree): MessageTree {
  return JSON.parse(JSON.stringify(tree)) as MessageTree;
}

const frFR = cloneTree(enUS);
Object.assign(frFR.site as MessageTree, { brand: "Wanbang Truck", metaTitle: "Wanbang Truck | Equipements de transport lourd", communicate: "Contactez-nous", inquiry: "Demande" });
Object.assign(frFR.nav as MessageTree, { home: "Accueil", products: "Produits", solutions: "Solutions", about: "A propos", blog: "Blog", contact: "Contact" });

const ruRU = cloneTree(enUS);
Object.assign(ruRU.site as MessageTree, { brand: "Wanbang Truck", metaTitle: "Wanbang Truck | Тяжелый транспорт", communicate: "Связаться" });
Object.assign(ruRU.nav as MessageTree, { home: "Главная", products: "Продукция", solutions: "Решения", about: "О компании", blog: "Блог", contact: "Контакты" });

const arSA = cloneTree(enUS);
Object.assign(arSA.site as MessageTree, { brand: "وانبانغ للشاحنات", metaTitle: "وانبانغ | معدات النقل الثقيل", communicate: "تواصل الآن" });
Object.assign(arSA.nav as MessageTree, { home: "الرئيسية", products: "المنتجات", solutions: "الحلول", about: "عن الشركة", blog: "المدونة", contact: "اتصل بنا" });

const esES = cloneTree(enUS);
Object.assign(esES.site as MessageTree, { brand: "Wanbang Truck", metaTitle: "Wanbang Truck | Equipos de transporte pesado", communicate: "Contactar" });
Object.assign(esES.nav as MessageTree, { home: "Inicio", products: "Productos", solutions: "Soluciones", about: "Nosotros", blog: "Blog", contact: "Contacto" });

export const messages: Record<LocaleCode, MessageTree> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "fr-FR": frFR,
  "ru-RU": ruRU,
  "ar-SA": arSA,
  "es-ES": esES
};

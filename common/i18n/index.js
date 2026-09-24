/**
 * uni-app 官方 VueI18n 方案（Vue2 内置 vue-i18n@8）
 * https://uniapp.dcloud.net.cn/tutorial/i18n.html
 *
 * 页面模板：$t('key')
 * JS：this.$t('key')
 * 切换语言：this.$i18n.locale = 'en'（或 this.$setLocale('en')）
 */
import Vue from "vue";
import VueI18n from "vue-i18n";
import zhHans from "../../locale/zh-Hans.json";
import en from "../../locale/en.json";

Vue.use(VueI18n);

// 主 locale 文件保持精简，页面补充键写在 locale/parts/*.{zh,en}.json，启动时自动合并
function loadLocaleParts() {
	const zhParts = {};
	const enParts = {};
	try {
		const ctx = require.context("../../locale/parts", false, /\.json$/);
		ctx.keys().forEach((key) => {
			const mod = ctx(key);
			const data = mod && mod.default ? mod.default : mod;
			if (!data || typeof data !== "object") return;
			if (/\.zh\.json$/i.test(key)) Object.assign(zhParts, data);
			else if (/\.en\.json$/i.test(key)) Object.assign(enParts, data);
		});
	} catch (e) {}
	return { zhParts, enParts };
}

const { zhParts, enParts } = loadLocaleParts();
const zhHansMessages = Object.assign({}, zhHans, zhParts);
const enMessages = Object.assign({}, en, enParts);

const messages = {
	"zh-Hans": zhHansMessages,
	zh: zhHansMessages,
	en: enMessages,
};

function resolveLocale() {
	// 优先应用语言，其次系统语言，默认中文简体
	try {
		const appLocale = uni.getLocale && uni.getLocale();
		if (appLocale && messages[appLocale]) return appLocale;
	} catch (e) {}
	try {
		const sys = uni.getSystemInfoSync();
		const lang = sys.language || sys.appLanguage || "";
		if (lang && messages[lang]) return lang;
		if (lang && lang.indexOf("en") === 0) return "en";
	} catch (e) {}
	return "zh-Hans";
}

const i18n = new VueI18n({
	locale: resolveLocale(),
	fallbackLocale: "zh-Hans",
	messages,
});

/** 设置应用语言（只改 vue-i18n，不要调 uni.setLocale，避免整页重载冲掉状态） */
export function setLocale(locale) {
	if (!messages[locale]) locale = "zh-Hans";
	i18n.locale = locale;
	try {
		uni.setStorageSync("vk_locale", locale);
	} catch (e) {}
	return i18n.locale;
}

export function getLocale() {
	return i18n.locale;
}

/** 在 main.js 中：Vue.use 安装并传给根实例 */
export function installI18n(VueCtor) {
	VueCtor.prototype.$setLocale = setLocale;
	VueCtor.prototype.$getLocale = getLocale;
}

export { i18n, messages };
export default i18n;

/**
 * 轻量 i18n：Vue.prototype.$t / $setLocale
 * 默认中文简体，可切换 en
 */
import zhHans from "./zh-Hans.js";
import en from "./en.js";

const messages = {
	"zh-Hans": zhHans,
	zh: zhHans,
	en,
};

const STORAGE_KEY = "vk_locale";

let current = "zh-Hans";
try {
	current = uni.getStorageSync(STORAGE_KEY) || "zh-Hans";
} catch (e) {}

export function getLocale() {
	return current;
}

export function setLocale(locale) {
	if (!messages[locale]) locale = "zh-Hans";
	current = locale;
	try {
		uni.setStorageSync(STORAGE_KEY, locale);
	} catch (e) {}
	return current;
}

export function t(key, fallback) {
	const dict = messages[current] || messages["zh-Hans"];
	return dict[key] || messages["zh-Hans"][key] || fallback || key;
}

export function installI18n(Vue) {
	Vue.prototype.$t = t;
	Vue.prototype.$setLocale = setLocale;
	Vue.prototype.$getLocale = getLocale;
}

export default { installI18n, t, setLocale, getLocale, messages };

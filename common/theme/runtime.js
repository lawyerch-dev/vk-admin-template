/**
 * 运行时换肤：把品牌色写入 CSS 变量
 * 页面样式统一用 var(--vk-primary) 等，调用 applyBrand() 即可一键换色
 */
import { brandTokens, brandPresets } from "./brand.js";

const STORAGE_KEY = "vk_brand_theme";

function toCssVars(tokens) {
	return {
		"--vk-primary": tokens.primary,
		"--vk-primary-hover": tokens.primaryHover,
		"--vk-primary-light": tokens.primaryLight,
		"--vk-primary-border": tokens.primaryBorder,
		"--vk-primary-soft": tokens.primarySoft,
	};
}

function injectCssVars(vars) {
	// #ifdef H5
	if (typeof document !== "undefined") {
		const root = document.documentElement;
		Object.keys(vars).forEach((key) => {
			root.style.setProperty(key, vars[key]);
		});
		return;
	}
	// #endif
	// 小程序 / App：通过全局样式类兜底（页面请使用 var(--vk-primary)）
	try {
		uni.setStorageSync("vk_css_vars", vars);
	} catch (e) {}
}

/**
 * 应用品牌主题
 * @param {String|Object} name 预置名（blue/indigo/cyan）或色值对象
 */
export function applyBrand(name) {
	let tokens = brandTokens;
	if (typeof name === "string" && brandPresets[name]) {
		tokens = brandPresets[name];
	} else if (name && typeof name === "object") {
		tokens = { ...brandTokens, ...name };
	}
	injectCssVars(toCssVars(tokens));
	try {
		uni.setStorageSync(STORAGE_KEY, typeof name === "string" ? name : tokens);
	} catch (e) {}
	return tokens;
}

/** 启动时恢复上次主题 */
export function restoreBrand() {
	let saved = null;
	try {
		saved = uni.getStorageSync(STORAGE_KEY);
	} catch (e) {}
	return applyBrand(saved || "blue");
}

/** 当前主题名 */
export function getBrandName() {
	try {
		const saved = uni.getStorageSync(STORAGE_KEY);
		if (typeof saved === "string" && brandPresets[saved]) return saved;
	} catch (e) {}
	return "blue";
}

export { brandTokens, brandPresets };
export default { applyBrand, restoreBrand, getBrandName, brandTokens, brandPresets };

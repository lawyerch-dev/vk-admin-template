/**
 * 全局主题：浅色 / 深色
 * 用 <style id="vk-theme-vars"> 注入 :root/page/uni-page-body，优先级最高，保证切换立刻生效
 */
const STORAGE_KEY = "vk_color_mode";
const STYLE_ID = "vk-theme-vars";

export const modes = {
	light: {
		"--vk-bg": "#ffffff",
		"--vk-bg-secondary": "#f8fafc",
		"--vk-bg-muted": "#f1f5f9",
		"--vk-text": "#1e293b",
		"--vk-text-secondary": "#64748b",
		"--vk-text-muted": "#94a3b8",
		"--vk-border": "#e2e8f0",
		"--vk-primary": "#3b82f6",
		"--vk-primary-hover": "#2563eb",
		"--vk-primary-light": "#eff6ff",
		"--vk-primary-border": "#93c5fd",
		"--vk-primary-soft": "#ecfeff",
		"--vk-card": "#ffffff",
		"--vk-nav": "rgba(255, 255, 255, 0.92)",
	},
	dark: {
		"--vk-bg": "#0f172a",
		"--vk-bg-secondary": "#1e293b",
		"--vk-bg-muted": "#334155",
		"--vk-text": "#f1f5f9",
		"--vk-text-secondary": "#94a3b8",
		"--vk-text-muted": "#64748b",
		"--vk-border": "#334155",
		"--vk-primary": "#60a5fa",
		"--vk-primary-hover": "#3b82f6",
		"--vk-primary-light": "#1e3a5f",
		"--vk-primary-border": "#1d4ed8",
		"--vk-primary-soft": "#172554",
		"--vk-card": "#1e293b",
		"--vk-nav": "rgba(15, 23, 42, 0.92)",
	},
};

function varsToCss(vars) {
	const body = Object.keys(vars)
		.map((k) => `${k}: ${vars[k]}`)
		.join(";");
	// 覆盖 html / page / uni-app 页面容器，避免 page 上的默认值把变量“锁死”
	return `:root, html, body, page, uni-app, uni-page, uni-page-body, .uni-page-body {${body}}`;
}

function inject(vars) {
	// #ifdef H5
	if (typeof document !== "undefined") {
		let styleEl = document.getElementById(STYLE_ID);
		if (!styleEl) {
			styleEl = document.createElement("style");
			styleEl.id = STYLE_ID;
			document.head.appendChild(styleEl);
		}
		styleEl.textContent = varsToCss(vars);

		const root = document.documentElement;
		Object.keys(vars).forEach((k) => root.style.setProperty(k, vars[k]));
		try {
			document.body.style.background = vars["--vk-bg"];
			document.body.style.color = vars["--vk-text"];
		} catch (e) {}
		// 页面容器也写一份，双保险
		const pages = document.querySelectorAll("uni-page-body, uni-page, page, .uni-page-body");
		pages.forEach((el) => {
			el.style.background = vars["--vk-bg"];
			el.style.color = vars["--vk-text"];
			Object.keys(vars).forEach((k) => el.style.setProperty(k, vars[k]));
		});
		return vars;
	}
	// #endif
	try {
		uni.setStorageSync("vk_css_vars", vars);
	} catch (e) {}
	return vars;
}

/** 切换深浅色 mode: 'light' | 'dark' */
export function applyColorMode(mode) {
	const m = mode === "dark" ? "dark" : "light";
	inject(modes[m]);
	try {
		uni.setStorageSync(STORAGE_KEY, m);
	} catch (e) {}
	return m;
}

export function getColorMode() {
	try {
		const saved = uni.getStorageSync(STORAGE_KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch (e) {}
	try {
		const info = uni.getSystemInfoSync();
		if (info.osTheme === "dark") return "dark";
	} catch (e) {}
	return "light";
}

export function restoreColorMode() {
	return applyColorMode(getColorMode());
}

/** 兼容旧调用 */
export function applyBrand(name) {
	if (name === "dark" || (name && name.mode === "dark")) return applyColorMode("dark");
	return applyColorMode("light");
}

export function restoreBrand() {
	return restoreColorMode();
}

export function getBrandName() {
	return getColorMode();
}

export default {
	applyColorMode,
	getColorMode,
	restoreColorMode,
	applyBrand,
	restoreBrand,
	getBrandName,
	modes,
};

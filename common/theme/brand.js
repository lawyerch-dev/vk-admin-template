/**
 * 品牌色令牌（默认主题蓝）
 * 一键换肤时只改这里的色值，或调用 applyBrand() 注入 CSS 变量
 */
export const brandTokens = {
	primary: "#3b82f6",
	primaryHover: "#2563eb",
	primaryLight: "#eff6ff",
	primaryBorder: "#93c5fd",
	primarySoft: "#ecfeff",
};

// 预置主题（一键切换）
export const brandPresets = {
	blue: {
		primary: "#3b82f6",
		primaryHover: "#2563eb",
		primaryLight: "#eff6ff",
		primaryBorder: "#93c5fd",
		primarySoft: "#ecfeff",
	},
	indigo: {
		primary: "#6366f1",
		primaryHover: "#4f46e5",
		primaryLight: "#eef2ff",
		primaryBorder: "#a5b4fc",
		primarySoft: "#eef2ff",
	},
	cyan: {
		primary: "#0891b2",
		primaryHover: "#0e7490",
		primaryLight: "#ecfeff",
		primaryBorder: "#67e8f9",
		primarySoft: "#ecfeff",
	},
};

export default brandTokens;

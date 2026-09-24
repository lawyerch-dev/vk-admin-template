/**
 * 个人中心页面配置常量
 * 文案统一走 i18n key，由页面组件用 this.$t 解析
 */

// 状态类型映射
export const statusTypeMap = {
	0: "success",  // 未使用
	1: "info",     // 已使用
	2: "danger",   // 已过期
	3: "warning"   // 已禁用
};

// 状态文本 i18n key
export const statusTextKeyMap = {
	0: "userCenter.status.unused",
	1: "userCenter.status.used",
	2: "userCenter.status.expired",
	3: "userCenter.status.disabled"
};

// 来源类型映射
export const sourceTypeMap = {
	'recharge': 'success',
	'card_buy': 'warning',
	'card_renew': 'warning',
	'buy_product': 'success',
	'reward': 'success',
	'refund': 'info'
};

// 来源文本 i18n key
export const sourceTextKeyMap = {
	'recharge': 'userCenter.source.recharge',
	'card_buy': 'userCenter.source.card_buy',
	'card_renew': 'userCenter.source.card_renew',
	'buy_product': 'userCenter.source.buy_product',
	'reward': 'userCenter.source.reward',
	'refund': 'userCenter.source.refund'
};

// 产品类型 i18n key
export const productTypeKeyMap = {
	'software': 'userCenter.productType.software',
	'plugin': 'userCenter.productType.plugin',
	'normal': 'userCenter.productType.normal'
};

// 格式化日期
export function formatDate(timestamp) {
	if (!timestamp) return '-';
	const d = new Date(timestamp);
	const pad = n => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 格式化更新日志（完整版）
export function formatLog(log) {
	if (!log) return '';

	const lines = log.split('\n').map(line => {
		line = line.trim();
		if (!line) return '';

		if (/^[•\-\*]\s*/.test(line)) {
			line = line.replace(/^[•\-\*]\s*/, '');
			if (/^(新增|添加|增加)/.test(line)) return `<li class="feature">✨ ${line}</li>`;
			if (/^(修复|修正|解决)/.test(line)) return `<li class="bugfix">🐛 ${line}</li>`;
			if (/^(优化|改进|提升)/.test(line)) return `<li class="optimization">⚡ ${line}</li>`;
			if (/^(删除|移除|废弃)/.test(line)) return `<li class="deprecated">🗑️ ${line}</li>`;
			return `<li>${line}</li>`;
		}

		return `<p>${line}</p>`;
	}).filter(Boolean);

	return `<ul class="update-list">${lines.join('')}</ul>`;
}

// 格式化更新日志预览（卡片背面，前3行）
export function formatLogPreview(log) {
	if (!log) return '';

	return log.split('\n').filter(l => l.trim()).slice(0, 3).map(line => {
		line = line.trim().replace(/^[•\-\*]\s*/, '');
		if (/^(新增|添加|增加)/.test(line)) return `<div class="log-item">✨ ${line}</div>`;
		if (/^(修复|修正|解决)/.test(line)) return `<div class="log-item">🐛 ${line}</div>`;
		if (/^(优化|改进|提升)/.test(line)) return `<div class="log-item">⚡ ${line}</div>`;
		return `<div class="log-item">${line}</div>`;
	}).join('');
}

// 积分流水表格列配置（titleKey 由组件 $t 解析）
export const pointsTableColumns = [
	{ key: "type", titleKey: "userCenter.col.type", type: "text", width: 100, slot: true },
	{ key: "amount", titleKey: "userCenter.col.amount", type: "text", width: 120, slot: true },
	{ key: "balance", titleKey: "userCenter.col.balance", type: "text", width: 120 },
	{ key: "source", titleKey: "userCenter.col.source", type: "text", width: 120, slot: true },
	{ key: "remark", titleKey: "userCenter.col.remark", type: "text", minWidth: 200 },
	{ key: "_add_time", titleKey: "userCenter.col.time", type: "time", width: 180 }
];

// 卡密表格列配置（titleKey 由组件 $t 解析）
export const cardsTableColumns = [
	{ key: "card_code", titleKey: "userCenter.col.cardCode", type: "text", width: 250, slot: true },
	{ key: "product_name", titleKey: "userCenter.col.productName", type: "text", width: 150 },
	{ key: "product_type", titleKey: "userCenter.col.productType", type: "text", width: 120, slot: true },
	{ key: "download_url", titleKey: "userCenter.col.downloadUrl", type: "text", width: 200, slot: true },
	{ key: "status", titleKey: "userCenter.col.status", type: "text", width: 100, slot: true },
	{ key: "_add_time", titleKey: "userCenter.col.buyTime", type: "time", width: 180 },
	{ key: "used_time", titleKey: "userCenter.col.usedTime", type: "time", width: 180, defaultValue: "-" },
	{ key: "expire_time", titleKey: "userCenter.col.expireTime", type: "time", width: 180, defaultValue: "-" }
];

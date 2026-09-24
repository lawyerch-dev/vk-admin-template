"use strict";

/**
 * 种子示例产品（可重复执行，按 product_id upsert）
 * 保证产品中心/产品列表有默认可展示产品
 * 用法：HBuilderX 上传部署后运行一次
 */
const DEMO_PRODUCTS = [
	{
		_id: "demo-basic",
		product_id: "demo-basic",
		product_name: "AI 商务助手（示例）",
		product_type: "software",
		product_image: "",
		download_url: "",
		detail_url: "",
		price_points: 5,
		price_months: 1,
		price_machines: 1,
		buy_price: 10,
		description:
			"这是系统预置的基础示例产品，用于产品中心展示与购买流程演示。你可以在「产品配置 → 产品管理」中修改名称、价格、描述，或删除后换成自己的正式产品。",
		remark: "种子示例数据，可安全删除",
		status: 1,
		valid_days_options: [
			{ days: 30, label: "月卡(30天)", discount: 1 },
			{ days: 90, label: "季卡(90天)", discount: 0.9 },
			{ days: 365, label: "年卡(365天)", discount: 0.8 }
		],
		custom_user_ids: ["all"],
		purchased_user_ids: [],
		special_price_user_ids: [],
		special_price: 1,
		special_price_configs: [],
		version_logs: [
			{
				version: "1.0.0",
				date: Date.now(),
				log: "首个示例版本：基础产品展示与购买流程演示",
				download_url: ""
			}
		]
	},
	{
		_id: "demo-plugin",
		product_id: "demo-plugin",
		product_name: "效率浏览器插件（示例）",
		product_type: "plugin",
		product_image: "",
		download_url: "",
		detail_url: "",
		price_points: 10,
		price_months: 1,
		price_machines: 1,
		buy_price: 0,
		description:
			"浏览器插件类型示例，购买价格为 0 表示不可直接购买，用于「了解详情」展示。可在产品管理中调整为正式插件产品。",
		remark: "种子示例数据，可安全删除",
		status: 1,
		valid_days_options: [
			{ days: 30, label: "月卡(30天)", discount: 1 },
			{ days: 365, label: "年卡(365天)", discount: 0.85 }
		],
		custom_user_ids: ["all"],
		purchased_user_ids: [],
		special_price_user_ids: [],
		special_price: 1,
		special_price_configs: [],
		version_logs: [
			{
				version: "1.0.0",
				date: Date.now(),
				log: "示例插件首版",
				download_url: ""
			}
		]
	}
];

exports.main = async () => {
	const db = uniCloud.database();
	const col = db.collection("vk-products");
	const now = Date.now();
	const result = { inserted: 0, updated: 0, skipped: 0 };

	for (const item of DEMO_PRODUCTS) {
		const exist = await col.where({ product_id: item.product_id }).limit(1).get();
		if (exist.data && exist.data.length) {
			// 已存在则只补齐可见性/上架等关键字段，避免覆盖管理员改过的价格文案
			await col.doc(exist.data[0]._id).update({
				status: 1,
				custom_user_ids: ["all"],
				last_update_date: now
			});
			result.updated++;
		} else {
			await col.add({
				...item,
				_add_time: now,
				_update_time: now
			});
			result.inserted++;
		}
	}

	const all = await col.orderBy("_add_time", "desc").limit(50).get();
	const list = (all.data || []).map((p) => ({
		product_id: p.product_id,
		product_name: p.product_name,
		status: p.status,
		buy_price: p.buy_price,
		visible: Array.isArray(p.custom_user_ids) && p.custom_user_ids.includes("all")
	}));

	return {
		code: 0,
		msg: "ok",
		data: {
			...result,
			total: list.length,
			products: list
		}
	};
};

"use strict";

/**
 * 同步管理员菜单到 opendb-admin-menus（可重复执行）
 * 解决：后建业务页只改了页面、未更新 init_data / 线上菜单
 * 用法：HBuilderX 云函数调试调用一次即可；以 menu_id 做 upsert
 */
const MENUS = [
	{
		_id: "product-config",
		menu_id: "product-config",
		name: "产品配置",
		icon: "el-icon-goods",
		comment: "产品与运营配置",
		sort: 1005,
		enable: true,
		parent_id: null,
		url: ""
	},
	{
		_id: "product-config-product",
		menu_id: "product-config-product",
		name: "产品管理",
		icon: "el-icon-s-goods",
		comment: "维护产品名称、价格、可见性与下载",
		url: "/pages/system/product/product",
		sort: 1,
		enable: true,
		parent_id: "product-config"
	},
	{
		_id: "product-config-category",
		menu_id: "product-config-category",
		name: "产品分类",
		icon: "el-icon-menu",
		comment: "维护产品分类",
		url: "/pages/system/product-category/product-category",
		sort: 2,
		enable: true,
		parent_id: "product-config"
	},
	{
		_id: "product-config-statistics",
		menu_id: "product-config-statistics",
		name: "数据统计",
		icon: "el-icon-s-data",
		comment: "用户积分与购买记录查询",
		url: "/pages/system/statistics/statistics",
		sort: 3,
		enable: true,
		parent_id: "product-config"
	},
	{
		_id: "product-config-rebate",
		menu_id: "product-config-rebate",
		name: "返利配置",
		icon: "el-icon-s-marketing",
		comment: "邀请返利阶梯配置",
		url: "/pages/system/rebate-config/rebate-config",
		sort: 4,
		enable: true,
		parent_id: "product-config"
	},
	{
		_id: "product-config-rebate-records",
		menu_id: "product-config-rebate-records",
		name: "返利记录",
		icon: "el-icon-notebook-2",
		comment: "返利发放记录",
		url: "/pages/system/rebate-records/rebate-records",
		sort: 5,
		enable: true,
		parent_id: "product-config"
	},
	{
		_id: "product-config-landing",
		menu_id: "product-config-landing",
		name: "落地页配置",
		icon: "el-icon-monitor",
		comment: "对外落地页区块与产品展示配置（与产品配置同级）",
		url: "/pages/system/landing-manage/landing-manage",
		sort: 1000,
		enable: true,
		parent_id: ""
	}
];

exports.main = async () => {
	const db = uniCloud.database();
	const col = db.collection("opendb-admin-menus");
	const now = Date.now();
	const result = { inserted: 0, updated: 0, skipped: 0 };

	for (const menu of MENUS) {
		const payload = {
			name: menu.name,
			icon: menu.icon,
			comment: menu.comment,
			url: menu.url || "",
			sort: menu.sort,
			enable: true,
			parent_id: menu.parent_id || "",
			last_update_date: now
		};
		const exist = await col.where({ menu_id: menu.menu_id }).limit(1).get();
		if (exist.data && exist.data.length) {
			await col.doc(exist.data[0]._id).update(payload);
			result.updated++;
		} else {
			await col.add({
				...payload,
				_id: menu._id,
				menu_id: menu.menu_id,
				_add_time: now
			});
			result.inserted++;
		}
	}

	// 自动并入 admin 角色菜单，无需再进「菜单赋予」手点
	try {
		const roleCol = db.collection("uni-id-roles");
		const adminRole = await roleCol.where({ role_id: "admin" }).limit(1).get();
		if (adminRole.data && adminRole.data.length) {
			const roleDoc = adminRole.data[0];
			const menuIds = MENUS.map((m) => m.menu_id);
			const oldMenu = Array.isArray(roleDoc.menu) ? roleDoc.menu : [];
			const merged = [...new Set([...oldMenu, ...menuIds])];
			await roleCol.doc(roleDoc._id).update({ menu: merged });
			result.adminRoleMenuCount = merged.length;
		}
	} catch (e) {
		result.adminRoleError = (e && e.message) || String(e);
	}

	// 回读全量菜单，便于确认「产品配置」是否已入库
	const all = await col.orderBy("sort", "asc").limit(100).get();
	const menuList = (all.data || []).map((m) => ({
		menu_id: m.menu_id,
		name: m.name,
		parent_id: m.parent_id || "",
		enable: m.enable
	}));

	return {
		code: 0,
		msg: "ok",
		data: {
			...result,
			total: menuList.length,
			hasProductConfig: menuList.some((m) => m.menu_id === "product-config"),
			menus: menuList
		}
	};
};

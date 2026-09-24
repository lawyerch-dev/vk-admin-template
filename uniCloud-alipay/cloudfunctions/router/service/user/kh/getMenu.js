'use strict';
module.exports = {
	/**
	 * 获取我拥有的菜单列表
	 * @url user/kh/getMenu 前端调用的url参数地址
	 * res 返回参数说明
	 * @param {Number} code 错误码，0表示成功
	 * @param {String} msg 详细信息
	 * @param {Array} menus 树形结构菜单
	 * @param {Array} menuList 扁平结构菜单
	 *
	 * 说明：不依赖 listMenuByRole 的树拼装，直接查启用菜单再组树，
	 * 避免后补菜单（如产品配置）因 parent_id/树查询差异装不进响应。
	 * admin 看全部；其它角色按 uni-id-roles.menu 白名单（含祖先）过滤。
	 */
	main: async (event) => {
		let { userInfo, util } = event;
		let { vk, db, _ } = util;
		let { role = [] } = userInfo || {};
		const isAdmin = role.indexOf("admin") > -1;

		// 1. 全量启用菜单
		let listRes = await vk.baseDao.select({
			dbName: "opendb-admin-menus",
			pageIndex: 1,
			pageSize: 1000,
			whereJson: { enable: true },
			sortArr: [{ name: "sort", type: "asc" }]
		});
		let rows = (listRes && listRes.rows) || [];

		// 规范化 parent_id：null / undefined / '' 都当根节点
		rows = rows.map((m) => {
			const item = Object.assign({}, m);
			if (item.parent_id === undefined || item.parent_id === null || item.parent_id === "") {
				item.parent_id = "";
			}
			return item;
		});

		// 2. 非 admin：按角色 menu 白名单过滤，并保留祖先，避免树断裂
		if (!isAdmin) {
			let allow = [];
			if (role.length) {
				let roleRes = await vk.baseDao.select({
					dbName: "uni-id-roles",
					pageIndex: 1,
					pageSize: 100,
					whereJson: { role_id: _.in(role), enable: true },
					fieldJson: { menu: true }
				});
				(roleRes.rows || []).forEach((r) => {
					if (Array.isArray(r.menu) && r.menu.length) {
						allow = allow.concat(r.menu);
					}
				});
			}
			allow = [...new Set(allow)];
			if (!allow.length) {
				rows = [];
			} else {
				const byId = {};
				rows.forEach((m) => {
					byId[m.menu_id] = m;
				});
				const keep = new Set(allow);
				allow.forEach((id) => {
					let cur = byId[id];
					while (cur && cur.parent_id) {
						keep.add(cur.parent_id);
						cur = byId[cur.parent_id];
					}
				});
				rows = rows.filter((m) => keep.has(m.menu_id));
			}
		}

		// 3. 组树（menu_id / parent_id）
		const menus = vk.pubfn.arrayToTree(rows, {
			id: "menu_id",
			parent_id: "parent_id",
			children: "children",
			deleteParentId: false
		});
		const menuList = vk.pubfn.treeToArray(menus, {
			id: "menu_id",
			parent_id: "parent_id",
			children: "children"
		});

		return {
			code: 0,
			msg: "",
			menus,
			menuList,
			userInfo
		};
	}
};

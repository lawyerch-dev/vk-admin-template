"use strict";

/**
 * 初始化演示账号（可重复执行）
 * 统一密码：123456
 * 仅两种演示角色，均无完全权限：
 * - demo-view    只读参观：可看菜单/数据，不可增删改
 * - demo-product 仅产品列表：侧边栏只保留「产品列表」
 *
 * 密码加密走 uni-id，不在此处硬编码 passwordSecret。
 */
exports.main = async (event = {}) => {
	const uniId = require("uni-id");
	const uniID = uniId.createInstance({
		clientInfo: {
			appId: "__UNI__seed",
			platform: "h5",
			clientIP: "127.0.0.1",
			userAgent: "seed-test-accounts",
			os: "node",
			locale: "zh-Hans"
		}
	});
	const db = uniCloud.database();
	const userCol = db.collection("uni-id-users");
	const roleCol = db.collection("uni-id-roles");
	const now = Date.now();
	const { passwordHash: password } = uniID.encryptPwd("123456");

	// 演示角色（不使用 admin）
	const roles = [
		{
			role_id: "demo-product",
			role_name: "仅产品列表",
			comment: "演示：只看产品列表菜单",
			permission: []
		}
	];

	for (const role of roles) {
		const existRole = await roleCol.where({ role_id: role.role_id }).limit(1).get();
		const roleData = {
			role_id: role.role_id,
			role_name: role.role_name,
			comment: role.comment,
			permission: role.permission,
			enable: true
		};
		if (existRole.data && existRole.data.length > 0) {
			await roleCol.doc(existRole.data[0]._id).update({ ...roleData, last_update_date: now });
		} else {
			await roleCol.add({ ...roleData, _add_time: now });
		}
	}

	const accounts = [
		{
			// 只读参观：复用 query-all（仅查询，不可增删改）
			username: "demo-view",
			nickname: "只读参观",
			role: ["query-all"],
			allow_login_background: true
		},
		{
			username: "demo-product",
			nickname: "仅产品列表",
			role: ["demo-product"],
			allow_login_background: true
		}
	];

	const results = [];

	for (const account of accounts) {
		const exist = await userCol.where({ username: account.username }).limit(1).get();
		const baseData = {
			username: account.username,
			nickname: account.nickname,
			role: account.role,
			allow_login_background: account.allow_login_background,
			password,
			token: [],
			login_ip_limit: [],
			status: 0
		};

		if (exist.data && exist.data.length > 0) {
			const id = exist.data[0]._id;
			await userCol.doc(id).update({
				...baseData,
				last_update_date: now
			});
			results.push({ username: account.username, action: "updated", id });
		} else {
			const addRes = await userCol.add({
				...baseData,
				register_date: now,
				register_ip: "127.0.0.1"
			});
			results.push({ username: account.username, action: "created", id: addRes.id });
		}
	}

	return {
		code: 0,
		msg: "演示账号初始化完成（demo-view / demo-product），密码 123456",
		data: {
			accounts: results.map((item) => {
				const meta = accounts.find((a) => a.username === item.username);
				return {
					username: item.username,
					password: "123456",
					nickname: meta.nickname,
					role: meta.role,
					action: item.action
				};
			})
		}
	};
};

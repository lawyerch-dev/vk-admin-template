"use strict";

/**
 * 初始化演示/测试账号（可重复执行）
 * 统一密码：123456
 * 均无完全权限（不含 admin 超管角色），便于给客户演示不同功能权限：
 * - demo-ops  产品运营：产品管理 + 数据统计
 * - demo-view 只读访客：仅查询
 * - demo-user 基础用户：可进后台，几乎无管理权限
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
			role_id: "demo-ops",
			role_name: "产品运营",
			comment: "演示：产品管理 + 数据统计",
			permission: ["system-uni-product-manage", "system-uni-statistics"]
		},
		{
			role_id: "demo-view",
			role_name: "只读访客",
			comment: "演示：仅查询",
			permission: ["sys-permission-read"]
		},
		{
			role_id: "demo-user",
			role_name: "基础用户",
			comment: "演示：可进后台，无管理权限",
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
			username: "demo-ops",
			nickname: "产品运营",
			role: ["demo-ops"],
			allow_login_background: true,
			desc: "产品管理 + 数据统计"
		},
		{
			username: "demo-view",
			nickname: "只读访客",
			role: ["demo-view"],
			allow_login_background: true,
			desc: "仅查询，不可增删改"
		},
		{
			username: "demo-user",
			nickname: "基础用户",
			role: ["demo-user"],
			allow_login_background: true,
			desc: "可进后台，无管理权限"
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
			results.push({ username: account.username, action: "updated", id, desc: account.desc });
		} else {
			const addRes = await userCol.add({
				...baseData,
				register_date: now,
				register_ip: "127.0.0.1"
			});
			results.push({ username: account.username, action: "created", id: addRes.id, desc: account.desc });
		}
	}

	return {
		code: 0,
		msg: "演示账号初始化完成，统一密码 123456（均无完全权限）",
		data: {
			accounts: results.map((item) => {
				const meta = accounts.find((a) => a.username === item.username);
				return {
					username: item.username,
					password: "123456",
					nickname: meta.nickname,
					role: meta.role,
					allow_login_background: meta.allow_login_background,
					desc: item.desc,
					action: item.action
				};
			})
		}
	};
};

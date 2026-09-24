"use strict";

/**
 * 初始化测试账号（可重复执行）
 * 账号统一密码：123456
 * - admin  超级管理员（后台可登录）
 * - test11 高级管理员（后台可登录，admin 角色）
 * - test12 初级管理员（后台可登录，仅查询角色）
 * - test13 无权限用户（禁止登录后台）
 *
 * 密码加密走 uni-id，不在此处硬编码 passwordSecret。
 */
exports.main = async (event = {}) => {
	const uniId = require("uni-id");
	const uniID = uniId.init({});
	const db = uniCloud.database();
	const collection = db.collection("uni-id-users");
	const now = Date.now();
	const password = await uniID.encryptPwd("123456");

	const accounts = [
		{
			username: "admin",
			nickname: "超级管理员",
			role: ["admin"],
			allow_login_background: true
		},
		{
			username: "test11",
			nickname: "高级管理员",
			role: ["admin"],
			allow_login_background: true
		},
		{
			username: "test12",
			nickname: "初级管理员",
			role: ["query-all"],
			allow_login_background: true
		},
		{
			username: "test13",
			nickname: "无权限用户",
			role: [],
			allow_login_background: false
		}
	];

	const results = [];

	for (const account of accounts) {
		const exist = await collection.where({ username: account.username }).limit(1).get();
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
			await collection.doc(id).update({
				...baseData,
				last_update_date: now
			});
			results.push({ username: account.username, action: "updated", id });
		} else {
			const addRes = await collection.add({
				...baseData,
				register_date: now,
				register_ip: "127.0.0.1"
			});
			results.push({ username: account.username, action: "created", id: addRes.id });
		}
	}

	return {
		code: 0,
		msg: "测试账号初始化完成，统一密码 123456",
		data: {
			accounts: results.map((item) => {
				const meta = accounts.find((a) => a.username === item.username);
				return {
					username: item.username,
					password: "123456",
					nickname: meta.nickname,
					role: meta.role,
					allow_login_background: meta.allow_login_background,
					action: item.action
				};
			})
		}
	};
};

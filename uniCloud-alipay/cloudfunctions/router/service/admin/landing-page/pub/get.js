module.exports = {
	/**
	 * 获取落地页配置（公开，无需登录）
	 * @url admin/landing-page/pub/get
	 */
	main: async (event) => {
		let { data = {}, util } = event;
		let { db } = util;
		let res = { code: 0, msg: '' };

		try {
			const result = await db.collection("vk-landing-page")
				.limit(1)
				.get();

			if (result.data && result.data.length > 0) {
				const doc = result.data[0];
				res.data = {
					_id: doc._id,
					sections: doc.sections || []
				};
			} else {
				res.data = { sections: [] };
			}
		} catch (err) {
			console.error("vk-landing-page query error:", err);
			res.data = { sections: [] };
		}

		return res;
	}
}

module.exports = {
	/**
	 * 获取所有启用的产品分类（公开，无需登录）
	 * @url admin/product-category/pub/getAll
	 */
	main: async (event) => {
		let { data = {}, util } = event;
		let { db } = util;
		let res = { code: 0, msg: '' };

		try {
			const result = await db.collection('vk-product-categories')
				.where({ enable: true })
				.orderBy('sort', 'asc')
				.get();

			const seen = new Set();
			const list = [];
			for (const item of (result.data || [])) {
				if (!seen.has(item.value)) {
					seen.add(item.value);
					list.push({
						value: item.value,
						label: item.label,
						sort: item.sort,
						enable: item.enable
					});
				}
			}
			res.data = list;
		} catch (err) {
			console.error("product-category getAll error:", err);
			res.data = [];
		}

		return res;
	}
}

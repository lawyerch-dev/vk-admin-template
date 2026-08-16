module.exports = {
	/**
	 * 获取公开产品列表（无需登录，用于产品展示页）
	 * @url admin/product/sys/getPublicList
	 */
	main: async (event) => {
		let { data = {}, util } = event;
		let { vk, db, _ } = util;
		let res = { code: 0, msg: '' };

		try {
			// 只返回上架的产品，然后在内存中过滤公开产品
			const products = await db.collection('vk-products')
				.where({
					status: 1
				})
				.orderBy('_add_time', 'desc')
				.get();

			// 过滤公开产品（custom_user_ids 包含 'all'）
			let publicProducts = (products.data || []).filter(product => {
				return product.custom_user_ids && product.custom_user_ids.includes('all');
			});

			// 只返回展示需要的字段，不暴露敏感信息
			const result = publicProducts.map(product => ({
				_id: product._id,
				product_id: product.product_id,
				product_name: product.product_name,
				product_type: product.product_type,
				product_image: product.product_image,
				description: product.description,
				price_points: product.price_points,
				price_months: product.price_months,
				price_machines: product.price_machines,
				buy_price: product.buy_price,
				detail_url: product.detail_url,
				_add_time: product._add_time,
			}));

			res.data = result;
		} catch (err) {
			console.error("getPublicList error:", err);
			res.data = [];
		}

		return res;
	}
}

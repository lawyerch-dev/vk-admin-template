module.exports = {
	/**
	 * 获取公开产品列表（无需登录，用于产品展示页）
	 * @url admin/product/pub/getPublicList
	 */
	main: async (event) => {
		let { data = {}, util } = event;
		let { db } = util;
		let res = { code: 0, msg: '' };

		try {
			const products = await db.collection('vk-products')
				.where({
					status: 1
				})
				.orderBy('_add_time', 'desc')
				.get();

			let publicProducts = (products.data || []).filter(product => {
				return product.custom_user_ids && product.custom_user_ids.includes('all');
			});

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

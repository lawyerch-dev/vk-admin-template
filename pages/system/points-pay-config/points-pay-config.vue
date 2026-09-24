<template>
	<view class="points-pay-config">
		<!-- 配置说明 -->
		<div class="config-tips">
			<el-alert :title="$t('admin.common.configTips')" type="info" :closable="false" show-icon>
				<ul>
					<li>{{ $t('admin.pointsPay.tip1') }}</li>
					<li>{{ $t('admin.pointsPay.tip2') }}</li>
					<li>{{ $t('admin.pointsPay.tip3') }}</li>
					<li>{{ $t('admin.pointsPay.tip4') }}</li>
					<li>{{ $t('admin.pointsPay.tip5') }}</li>
					<li>{{ $t('admin.pointsPay.tip6') }}</li>
					<li>{{ $t('admin.pointsPay.tip7') }}</li>
				</ul>
			</el-alert>
		</div>

		<!-- 店铺选择工具栏 -->
		<el-card class="config-card store-toolbar-card">
			<div class="store-toolbar">
				<view class="store-picker">
					<text class="picker-label">{{ $t('admin.pointsPay.storeList') }}</text>
					<el-select
						v-model="selected_store_id"
						size="small"
						class="store-select"
						:placeholder="$t('admin.pointsPay.storeList')"
						@change="onStoreChange"
					>
						<el-option
							v-for="s in stores"
							:key="s.store_id"
							:label="s.name"
							:value="s.store_id"
						>
							<view class="store-option">
								<text class="store-option__name">{{ s.name }}</text>
								<text class="store-option__url">{{ s.base_url }}</text>
							</view>
						</el-option>
					</el-select>
				</view>
				<view class="header-actions">
					<el-button type="primary" icon="el-icon-plus" size="small" @click="addStore">{{ $t('admin.pointsPay.addStore') }}</el-button>
					<el-button
						type="danger"
						icon="el-icon-delete"
						size="small"
						:disabled="stores.length <= 1"
						@click="removeStore(selected_store_id)"
					>{{ $t('admin.common.delete') }}</el-button>
					<el-button type="success" icon="el-icon-check" size="small" @click="saveConfig" :loading="saving">
						{{ $t('admin.pointsPay.saveConfig') }}
					</el-button>
				</view>
			</div>
			<div class="tip-line">{{ $t('admin.pointsPay.storeTipLine') }}</div>
		</el-card>

		<!-- 当前选中店铺的完整配置 -->
		<el-card class="config-card" v-if="selectedStore">
			<div slot="header" class="card-header">
				<span>{{ $t('admin.pointsPay.currentStore', { name: selectedStore.name }) }}</span>
			</div>
			<el-form :model="selectedStore" label-width="150px" label-position="right">
				<el-form-item :label="$t('admin.pointsPay.colStoreName')">
					<el-input v-model="selectedStore.name" :placeholder="$t('admin.pointsPay.namePlaceholder')"></el-input>
				</el-form-item>
				<el-form-item :label="$t('admin.pointsPay.fieldGateway')">
					<el-input v-model="selectedStore.base_url" :placeholder="$t('admin.pointsPay.gatewayPlaceholder')"></el-input>
				</el-form-item>
				<el-form-item :label="$t('admin.pointsPay.fieldChannel')">
					<el-input-number v-model="selectedStore.channel_id" :min="1" :max="999" size="small"></el-input-number>
					<span style="margin-left: 8px; color: var(--vk-text-secondary, #64748b); font-size: 12px;">{{ $t('admin.pointsPay.channelTip') }}</span>
				</el-form-item>
				<el-form-item :label="$t('admin.pointsPay.fieldQueryPassword')">
					<el-input v-model="selectedStore.query_password" :placeholder="$t('admin.pointsPay.queryPasswordPlaceholder')"></el-input>
				</el-form-item>
			</el-form>

			<view class="dual-panel">
				<el-card class="inner-card panel-card">
					<div slot="header">{{ $t('admin.pointsPay.apiPathsHeader') }}</div>
					<el-form :model="selectedStore" label-width="120px" label-position="right">
						<el-form-item :label="$t('admin.pointsPay.fieldPayOrder')">
							<el-input v-model="selectedStore.pay_order_path" placeholder="/shopApi/Pay/order"></el-input>
						</el-form-item>
						<el-form-item :label="$t('admin.pointsPay.fieldPayQuery')">
							<el-input v-model="selectedStore.pay_query_path" placeholder="/shopApi/Pay/query"></el-input>
						</el-form-item>
						<el-form-item :label="$t('admin.pointsPay.fieldMerchantLogin')">
							<el-input v-model="selectedStore.merchant_login_path" placeholder="/merchantApi/user/login"></el-input>
						</el-form-item>
						<el-form-item :label="$t('admin.pointsPay.fieldMerchantOrder')">
							<el-input v-model="selectedStore.merchant_order_info_path" placeholder="/merchantApi/Order/orderInfo"></el-input>
						</el-form-item>
					</el-form>
				</el-card>

				<el-card class="inner-card panel-card">
					<div slot="header">{{ $t('admin.pointsPay.merchantCredsHeader') }}</div>
					<el-form :model="selectedStore" label-width="120px" label-position="right">
						<el-form-item :label="$t('admin.pointsPay.fieldMerchantUser')">
							<el-input v-model="selectedStore.merchant_user" :placeholder="$t('admin.pointsPay.merchantUserPlaceholder')"></el-input>
						</el-form-item>
						<el-form-item :label="$t('admin.pointsPay.fieldMerchantPass')">
							<el-input v-model="selectedStore.merchant_pass" type="password" show-password :placeholder="$t('admin.pointsPay.merchantPassPlaceholder')"></el-input>
						</el-form-item>
					</el-form>
				</el-card>
			</view>

			<!-- 该店铺自己的套餐（含商品key） -->
			<div class="sub-header">
				<span>{{ $t('admin.pointsPay.packagesHeader') }}</span>
				<el-button type="primary" icon="el-icon-plus" size="small" @click="addPackage">{{ $t('admin.pointsPay.addPackage') }}</el-button>
			</div>
			<el-table :data="selectedStore.packages" style="width: 100%" border>
				<el-table-column :label="$t('admin.pointsPay.colPackageName')" min-width="150">
					<template slot-scope="{ row }">
						<el-input v-model="row.name" size="small" :placeholder="$t('admin.pointsPay.packageNamePlaceholder')"></el-input>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.pointsPay.colPoints')" min-width="110" align="center">
					<template slot-scope="{ row }">
						<el-input-number
							v-model="row.points"
							:min="1"
							size="small"
							:controls="false"
							class="num-cell-input"
						></el-input-number>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.pointsPay.colPrice')" min-width="120" align="center">
					<template slot-scope="{ row }">
						<el-input-number
							v-model="row.price"
							:min="0"
							size="small"
							:controls="false"
							class="num-cell-input"
						></el-input-number>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.pointsPay.colDiscount')" width="100">
					<template slot-scope="{ row }">
						<el-input v-model="row.discount" size="small" :placeholder="$t('admin.pointsPay.discountPlaceholder')"></el-input>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.pointsPay.colRecommended')" width="75" align="center">
					<template slot-scope="{ row }">
						<el-switch v-model="row.recommended"></el-switch>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.pointsPay.colDesc')" min-width="120">
					<template slot-scope="{ row }">
						<el-input v-model="row.description" size="small" :placeholder="$t('admin.pointsPay.descPlaceholder')"></el-input>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.pointsPay.colGoodsKey')" width="110" align="center">
					<template slot-scope="{ row }">
						<el-input v-model="row.goods_key" size="small" :placeholder="$t('admin.pointsPay.goodsKeyPlaceholder')"></el-input>
					</template>
				</el-table-column>
				<el-table-column :label="$t('admin.common.action')" width="80" align="center">
					<template slot-scope="{ $index }">
						<el-button size="mini" type="danger" icon="el-icon-delete" circle :disabled="selectedStore.packages.length <= 1" @click="removePackage($index)"></el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
	</view>
</template>

<script>
let that;
let vk;

export default {
	data() {
		return {
			stores: [],
			selected_store_id: '',
			selectedStore: null,
			saving: false
		};
	},
	onLoad() {
		that = this;
		vk = that.vk;
		that.loadConfig();
	},
	methods: {
		// 加载配置
		loadConfig() {
			vk.callFunction({
				url: 'admin/points/sys/getPayConfig',
				success: (data) => {
					const cfg = data.data || {};
					that.stores = (cfg.stores && cfg.stores.length) ? cfg.stores : [];
					that.selected_store_id = cfg.active_store_id
						|| (that.stores[0] && that.stores[0].store_id)
						|| '';
					that.selectedStore = that.stores.find(s => s.store_id === that.selected_store_id) || null;
				},
				fail: (err) => {
					console.error('加载支付配置失败：', err);
					vk.toast(err.msg || err.message || that.$t('admin.common.loadFailed'), 'none');
				}
			});
		},
		// 下拉切换店铺：直接展示该店配置表单
		onStoreChange(store_id) {
			that.bindStore(store_id);
		},
		bindStore(store_id) {
			that.selected_store_id = store_id;
			that.selectedStore = that.stores.find(s => s.store_id === store_id) || null;
		},
		// 新增店铺（基于链动小店预设，主要修改域名/channel_id/商品key）
		addStore() {
			const store_id = 'store_' + Date.now();
			// 链动小店预设套餐模板
			const ldxpPackages = [
				{ id: 1, name: that.$t('admin.pointsPay.pkgTrial'), points: 10, price: 10, discount: '', description: that.$t('admin.pointsPay.pkgTrialDesc'), recommended: false, goods_key: '1eoood' },
				{ id: 2, name: that.$t('admin.pointsPay.pkgBasic'), points: 50, price: 45, discount: that.$t('admin.pointsPay.pkgBasicDiscount'), description: that.$t('admin.pointsPay.pkgBasicDesc'), recommended: false, goods_key: '3x529g' },
				{ id: 3, name: that.$t('admin.pointsPay.pkgValue'), points: 100, price: 90, discount: that.$t('admin.pointsPay.pkgValueDiscount'), description: that.$t('admin.pointsPay.pkgValueDesc'), recommended: true, goods_key: '5jrm9q' },
				{ id: 4, name: that.$t('admin.pointsPay.pkgDeluxe'), points: 300, price: 270, discount: that.$t('admin.pointsPay.pkgDeluxeDiscount'), description: that.$t('admin.pointsPay.pkgDeluxeDesc'), recommended: false, goods_key: 'ici991' },
				{ id: 5, name: that.$t('admin.pointsPay.pkgPremium'), points: 500, price: 450, discount: that.$t('admin.pointsPay.pkgPremiumDiscount'), description: that.$t('admin.pointsPay.pkgPremiumDesc'), recommended: false, goods_key: '2d0h8p' },
				{ id: 6, name: that.$t('admin.pointsPay.pkgUltimate'), points: 1000, price: 900, discount: that.$t('admin.pointsPay.pkgUltimateDiscount'), description: that.$t('admin.pointsPay.pkgUltimateDesc'), recommended: false, goods_key: 'et8wmn' }
			];
			that.stores.push({
				store_id,
				name: that.$t('admin.pointsPay.newStoreName'),
				base_url: 'https://pay.ldxp.cn',  // 链动小店
				channel_id: 4,                    // 链动小店默认通道
				query_password: '',
				pay_order_path: '/shopApi/Pay/order',
				pay_query_path: '/shopApi/Pay/query',
				merchant_login_path: '/merchantApi/user/login',
				merchant_order_info_path: '/merchantApi/Order/orderInfo',
				merchant_user: '',  // 管理员填写
				merchant_pass: '',  // 管理员填写
				packages: ldxpPackages
			});
			that.bindStore(store_id);
		},
		// 删除店铺
		removeStore(store_id) {
			const store = that.stores.find(s => s.store_id === store_id);
			that.$confirm(
				that.$t('admin.pointsPay.removeStoreConfirm', { name: store ? store.name : '' }),
				that.$t('admin.common.confirm'),
				{
					confirmButtonText: that.$t('admin.common.ok'),
					cancelButtonText: that.$t('admin.common.cancel'),
					type: 'warning'
				}
			).then(() => {
				const idx = that.stores.findIndex(s => s.store_id === store_id);
				if (idx > -1) that.stores.splice(idx, 1);
				if (that.selected_store_id === store_id) {
					if (that.stores.length) {
						that.bindStore(that.stores[0].store_id);
						vk.toast(that.$t('admin.pointsPay.autoSwitched', { name: that.stores[0].name }));
					} else {
						that.selected_store_id = '';
						that.selectedStore = null;
					}
				}
			}).catch(() => {});
		},
		// 新增套餐（加到当前店铺）
		addPackage() {
			const nextId = that.selectedStore.packages.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
			that.selectedStore.packages.push({
				id: nextId,
				name: that.$t('admin.pointsPay.newPackageName'),
				points: 0,
				price: 0,
				discount: '',
				description: '',
				recommended: false,
				goods_key: ''
			});
		},
		// 删除套餐
		removePackage(index) {
			if (that.selectedStore.packages.length <= 1) {
				vk.toast(that.$t('admin.pointsPay.keepOnePackage'));
				return;
			}
			that.selectedStore.packages.splice(index, 1);
		},
		// 保存配置
		saveConfig() {
			if (!that.stores.length) {
				vk.toast(that.$t('admin.pointsPay.keepOneStore'));
				return;
			}
			if (!that.selected_store_id || !that.stores.some(s => s.store_id === that.selected_store_id)) {
				vk.toast(that.$t('admin.pointsPay.invalidStore'));
				return;
			}
			for (const s of that.stores) {
				if (!s.base_url || !/^https?:\/\//.test(s.base_url)) {
					vk.toast(that.$t('admin.pointsPay.errGateway', { name: s.name }));
					return;
				}
				if (!s.channel_id || s.channel_id <= 0) {
					vk.toast(that.$t('admin.pointsPay.errChannel', { name: s.name }));
					return;
				}
				if (!s.merchant_user || !String(s.merchant_user).trim()) {
					vk.toast(that.$t('admin.pointsPay.errMerchantUser', { name: s.name }));
					return;
				}
				if (!s.merchant_pass || !String(s.merchant_pass).trim()) {
					vk.toast(that.$t('admin.pointsPay.errMerchantPass', { name: s.name }));
					return;
				}
				if (!s.packages || !s.packages.length) {
					vk.toast(that.$t('admin.pointsPay.errNeedPackage', { name: s.name }));
					return;
				}
				const ids = new Set();
				for (const p of s.packages) {
					if (!p.id || ids.has(p.id)) {
						vk.toast(that.$t('admin.pointsPay.errPackageId', { name: s.name }));
						return;
					}
					ids.add(p.id);
					if (!p.name || !String(p.name).trim()) {
						vk.toast(that.$t('admin.pointsPay.errPackageName', { name: s.name, id: p.id }));
						return;
					}
					if (!p.points || Number(p.points) <= 0) {
						vk.toast(that.$t('admin.pointsPay.errPackagePoints', { name: s.name, pkg: p.name }));
						return;
					}
					if (Number(p.price) < 0) {
						vk.toast(that.$t('admin.pointsPay.errPackagePrice', { name: s.name, pkg: p.name }));
						return;
					}
					if (!p.goods_key || !String(p.goods_key).trim()) {
						vk.toast(that.$t('admin.pointsPay.errGoodsKey', { name: s.name, pkg: p.name }));
						return;
					}
				}
			}

			that.saving = true;
			vk.callFunction({
				url: 'admin/points/sys/updatePayConfig',
				data: {
					active_store_id: that.selected_store_id,
					stores: that.stores
				},
				success: () => {
					vk.toast(that.$t('admin.common.saved'));
					that.loadConfig();
				},
				fail: (err) => {
					vk.toast(err.msg || err.message || that.$t('admin.common.saveFailed'), 'none');
				},
				complete: () => {
					that.saving = false;
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.points-pay-config {
	padding: 20px;
}

.config-card {
	margin-bottom: 20px;
}

.inner-card {
	margin-bottom: 20px;
}

/* 接口路径 + 商户凭证 一行双栏 */
.dual-panel {
	display: flex;
	align-items: stretch;
	gap: 16px;
	margin-bottom: 4px;

	.panel-card {
		flex: 1 1 0;
		min-width: 0;
		margin-bottom: 16px;
	}
}

@media screen and (max-width: 960px) {
	.dual-panel {
		flex-direction: column;
		gap: 0;
	}
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.sub-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 20px 0 10px 0;
	font-weight: bold;
	color: var(--vk-text);
}

.tip-line {
	margin-top: 8px;
	color: var(--vk-text-secondary, #64748b);
	font-size: 12px;
	line-height: 1.6;
}

.current-store-row {
	background: var(--vk-bg-secondary);
}

.store-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
}

.store-picker {
	display: flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
	flex: 1 1 320px;

	.picker-label {
		font-weight: 600;
		color: var(--vk-text);
		white-space: nowrap;
	}

	.store-select {
		width: 100%;
		max-width: 420px;
	}
}

.store-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	line-height: 22px;

	.store-option__name {
		color: var(--vk-text);
		font-weight: 500;
	}

	.store-option__url {
		color: var(--vk-text-secondary, #64748b);
		font-size: 12px;
	}
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

/* 表格内数字输入：去掉加减后默认宽约 150px，会溢出窄列，改为撑满 */
.num-cell-input {
	width: 100% !important;

	::v-deep .el-input {
		width: 100% !important;
	}

	::v-deep .el-input__inner {
		padding-left: 8px !important;
		padding-right: 8px !important;
		text-align: center;
	}
}

.config-tips {
	ul {
		margin: 10px 0 0 0;
		padding-left: 20px;

		li {
			line-height: 1.8;
			color: var(--vk-text);
		}
	}
}
</style>

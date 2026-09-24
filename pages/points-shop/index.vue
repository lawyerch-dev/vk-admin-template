<template>
	<view class="points-shop">
		<!-- 页面标题 -->
		<view class="page-header">
			<view class="header-content">
				<text class="header-title">{{ $t('shop.pageTitle') }}</text>
				<text class="header-subtitle">{{ $t('shop.pageSubtitle') }}</text>
			</view>
		</view>

		<!-- 当前积分显示 -->
		<el-card class="current-points-card">
			<view class="current-points">
				<view class="points-icon">
					<i class="el-icon-coin"></i>
				</view>
				<view class="points-info">
					<text class="points-label">{{ $t('shop.currentPoints') }}</text>
					<text class="points-value">{{ userPoints || 0 }}</text>
				</view>
				<el-button type="text" @click="refreshPoints" icon="el-icon-refresh">{{ $t('shop.refresh') }}</el-button>
				<el-button type="text" @click="showServiceQRCode" icon="el-icon-service" style="margin-left: 10px;">{{ $t('shop.contactSupport') }}</el-button>
			</view>
		</el-card>

		<!-- 支付未到账自助修复 -->
		<el-card class="repair-card">
			<view class="repair-inline">
				<i class="el-icon-warning-outline"></i>
				<text class="repair-label">{{ $t('shop.repairLabel') }}</text>
				<el-input
					v-model="repairTradeNo"
					:placeholder="$t('shop.repairPlaceholder')"
					size="small"
					clearable
					class="repair-input"
					@keyup.enter.native="submitRepair"
				/>
				<el-button
					type="warning"
					size="small"
					:loading="repairLoading"
					:disabled="repairLoading"
					@click="submitRepair"
				>{{ repairLoading ? $t('shop.repairChecking') : $t('shop.repairSubmit') }}</el-button>
			</view>
			<view class="repair-result" v-if="repairResult">
				<el-alert :title="repairResult.title" :type="repairResult.type" show-icon :closable="false">
					<template slot="default">
						<view v-if="repairResult.order" class="repair-order-info">
							<text class="repair-line">{{ $t('shop.orderTradeNo', { n: repairResult.order.trade_no }) }}</text>
							<text class="repair-line">{{ $t('shop.orderGoodsName', { n: repairResult.order.goods_name }) }}</text>
							<text class="repair-line">{{ $t('shop.orderPayAmount', { n: repairResult.order.total_amount }) }}</text>
							<text class="repair-line">{{ $t('shop.orderCreateTime', { n: repairResult.order.create_time }) }}</text>
							<text class="repair-line">{{ $t('shop.orderPayStatus', { n: repairResult.order.is_paid ? $t('shop.statusPaid') : $t('shop.statusUnpaid') }) }}</text>
							<text class="repair-line">{{ $t('shop.orderCreditStatus', { n: repairResult.order.is_credited ? $t('shop.statusCredited') : $t('shop.statusNotCredited') }) }}</text>
						</view>
						<text v-else class="repair-desc">{{ repairResult.desc }}</text>
					</template>
				</el-alert>
			</view>
		</el-card>

		<!-- 积分套餐列表 -->
		<view class="packages-section">
			<text class="section-title">{{ $t('shop.selectPackage') }}</text>
			<view class="packages-grid">
				<el-card 
					v-for="pkg in packages" 
					:key="pkg.id" 
					class="package-card"
					:class="{ 'recommended': pkg.recommended, 'selected': selectedPackage === pkg.id }"
					@click.native="selectPackage(pkg)"
				>
					<!-- 推荐标签 -->
					<view class="recommended-badge" v-if="pkg.recommended">
						<i class="el-icon-star-on"></i> {{ $t('shop.recommended') }}
					</view>

					<!-- 套餐名称 -->
					<text class="package-name">{{ pkgName(pkg) }}</text>

					<!-- 积分数量 -->
					<view class="package-points">
						<text class="points-number">{{ pkg.points }}</text>
						<text class="points-unit">{{ $t('shop.pointsUnit') }}</text>
					</view>


					<!-- 价格 -->
					<view class="package-price">
						<text class="price-symbol">¥</text>
						<text class="price-number">{{ pkg.price }}</text>
					</view>

					<!-- 优惠信息 -->
					<view class="package-discount" v-if="pkgDiscount(pkg)">
						<el-tag type="danger" size="mini">{{ pkgDiscount(pkg) }}</el-tag>
					</view>

					<!-- 说明 -->
					<text class="package-desc">{{ pkgDesc(pkg) }}</text>

					<!-- 选择按钮 -->
					<el-button 
						:type="selectedPackage === pkg.id ? 'primary' : 'default'" 
						class="select-btn"
						@click.stop="selectPackage(pkg)"
						:loading="creatingOrder && selectedPackage === pkg.id"
						:disabled="creatingOrder || paymentLoading"
					>
						{{ selectedPackage === pkg.id && creatingOrder ? $t('shop.redirecting') : $t('shop.payNow') }}
					</el-button>
				</el-card>

				<!-- 客服联系卡片 -->
				<el-card class="package-card service-card" @click.native="showServiceQRCode">
					<view class="service-icon">
						<i class="el-icon-service"></i>
					</view>
					<text class="package-name">{{ $t('shop.serviceTitle') }}</text>
					<view class="service-desc">
						<text class="service-line">{{ $t('shop.serviceDesc1') }}</text>
						<text class="service-line">{{ $t('shop.serviceDesc2') }}</text>
						<text class="service-line">{{ $t('shop.serviceDesc3') }}</text>
					</view>
					<el-button type="success" class="select-btn">
						{{ $t('shop.viewQrcode') }}
					</el-button>
				</el-card>
			</view>
		</view>

		<!-- 客服二维码弹窗 -->
		<ServiceQrcode :show.sync="serviceDialog.show" work-time="9:00 - 21:00" />

		<!-- 支付加载遮罩 -->
		<view class="payment-mask" v-if="paymentLoading">
			<view class="payment-modal">
				<view class="payment-icon">
					<i class="el-icon-loading"></i>
				</view>
				<text class="payment-title">{{ pollingStartTime ? $t('shop.pollingTitle') : $t('shop.orderCreatedTitle') }}</text>
				<text class="payment-desc">{{ $t('shop.paymentDesc') }}</text>
				<text class="payment-timer" v-if="pollingStartTime">{{ $t('shop.elapsed', { n: paymentElapsed }) }}</text>
				<view class="payment-progress">
					<el-progress 
						:percentage="Math.floor((paymentElapsed / 300) * 100)" 
						:stroke-width="6"
						color="var(--vk-primary, #409EFF)"
					></el-progress>
				</view>
				<view class="payment-tips">
					<i class="el-icon-info"></i>
					<text>{{ $t('shop.orderTradeNo', { n: currentTradeNo || '-' }) }}</text>
				</view>
				<view class="payment-actions" v-if="paymentUrl">
					<el-button type="primary" plain @click="openPaymentPage">{{ $t('shop.goPay') }}</el-button>
					<el-button type="success" plain @click="manualCheckPayment">{{ $t('shop.paidCheck') }}</el-button>
					<el-button plain @click="copyPaymentLink">{{ $t('shop.copyPayLink') }}</el-button>
				</view>
				<text class="payment-warning">
					{{ $t('shop.payWarning') }}
				</text>
				<el-button type="danger" plain @click="cancelPayment">{{ $t('shop.cancelPay') }}</el-button>
			</view>
		</view>
	</view>
</template>

<script>
import * as paymentService from '@/common/services/payment.js';
import ServiceQrcode from '@/components/service-qrcode/index.vue';

let vk = uni.vk;

export default {
	components: { ServiceQrcode },
	data() {
		return {
			// userPoints -> computed
			selectedPackage: null,
			pollingTimer: null,
			pollingStartTime: null,
			pollingTimeout: 5 * 60 * 1000,
			paymentLoading: false,
			paymentElapsed: 0,
			currentTradeNo: '',
			currentPackageInfo: null,
			paymentUrl: '',
			creatingOrder: false,
			checkingPayment: false,
			serviceDialog: { show: false },
			repairTradeNo: '',
			repairLoading: false,
			repairResult: null,
			// 支付接口配置（后台「支付接口配置」页面维护，前端加载失败时用默认值兜底）
			payConfig: {
				base_url: 'https://yunxiangit.com.cn',
				channel_id: 3,
				query_password: '',
				store_name: '',
				pay_order_path: '/shopApi/Pay/order',
				pay_query_path: '/shopApi/Pay/query'
			},
			// 积分套餐配置（与支付平台商品对应，goods_key 为兜底，实际以后台「支付接口配置」为准）
			// nameKey/descKey/discountN 为 i18n 默认文案；后台下发时用 name/description/discount 原文
			packages: [
				{ id: 1, nameKey: 'shop.pkgTrial', name: '', points: 10, price: 10, discountN: 0, discount: '', descKey: 'shop.pkgTrialDesc', description: '', recommended: false, goods_key: 't1hw3w' },
				{ id: 2, nameKey: 'shop.pkgBasic', name: '', points: 50, price: 45, discountN: 5, discount: '', descKey: 'shop.pkgBasicDesc', description: '', recommended: false, goods_key: 'u4zjhq' },
				{ id: 3, nameKey: 'shop.pkgValue', name: '', points: 100, price: 90, discountN: 10, discount: '', descKey: 'shop.pkgValueDesc', description: '', recommended: true, goods_key: 'mw9di3' },
				{ id: 4, nameKey: 'shop.pkgDeluxe', name: '', points: 300, price: 270, discountN: 30, discount: '', descKey: 'shop.pkgDeluxeDesc', description: '', recommended: false, goods_key: '8wouhk' },
				{ id: 5, nameKey: 'shop.pkgSupreme', name: '', points: 500, price: 450, discountN: 50, discount: '', descKey: 'shop.pkgSupremeDesc', description: '', recommended: false, goods_key: 'qv19cx' },
				{ id: 6, nameKey: 'shop.pkgUltimate', name: '', points: 1000, price: 900, discountN: 100, discount: '', descKey: 'shop.pkgUltimateDesc', description: '', recommended: false, goods_key: 'y3qiel' }
			]
		};
	},
	computed: {
		userPoints() { return this.$store.state.$user.pointsInfo.available_points || 0; },
	},
	onLoad() {
		vk = this.vk;
		this.init();
		this.restorePendingOrder();
	},
	onShow() {
		if (this.currentTradeNo && this.paymentLoading && !this.pollingTimer) {
			this.startPolling(this.currentTradeNo, false);
		}
	},
	onHide() {},
	onUnload() { this.clearPollingTimer(); },
	methods: {
		// 套餐展示文案：优先 i18n key，其次后台原文
		pkgName(pkg) {
			if (pkg.nameKey) return this.$t(pkg.nameKey, { n: pkg.points });
			return pkg.name || '';
		},
		pkgDesc(pkg) {
			if (pkg.descKey) return this.$t(pkg.descKey);
			return pkg.description || '';
		},
		pkgDiscount(pkg) {
			if (pkg.discountN) return this.$t('shop.saveYuan', { n: pkg.discountN });
			return pkg.discount || '';
		},

		async init() {
			this.$store.dispatch('$user/loadPointsInfo');
			this.loadPayConfig();
		},

		// 加载支付接口配置
		async loadPayConfig() {
			const { packages, payConfig } = await paymentService.loadPayConfig();
			if (packages.length > 0) {
				this.packages = packages.map(p => ({
					id: p.id,
					name: p.name,
					nameKey: null,
					points: p.points,
					price: p.price,
					discount: p.discount || '',
					discountN: 0,
					description: p.description || '',
					descKey: null,
					recommended: !!p.recommended,
					goods_key: p.goods_key || ''
				}));
			}
			this.payConfig = payConfig;
		},

		// 加载用户积分（从 store 响应式读取）
		loadUserPoints() {
			this.$store.dispatch('$user/loadPointsInfo', { force: true });
		},
		refreshPoints() {
			this.loadUserPoints();
			vk.toast(this.$t('shop.refreshSuccess'));
		},

		// ========== 核心流程：选套餐 → 创建订单 → 跳支付 → 轮询 ==========
		selectPackage(pkg) {
			if (this.creatingOrder || this.paymentLoading) return;
			this.createOrder(pkg);
		},

		async createOrder(pkg) {
			this.creatingOrder = true;
			try {
				const { trade_no, payurl } = await paymentService.createOrder(this.payConfig, pkg);
				console.log('[支付] 订单创建成功:', { trade_no, payurl, package: this.pkgName(pkg) });
				this.currentTradeNo = trade_no;
				this.currentPackageInfo = { ...pkg };
				this.paymentUrl = payurl;
				this.paymentLoading = true;
				this.pollingStartTime = null;
				this.paymentElapsed = 0;
				paymentService.savePendingOrder(trade_no, payurl, pkg);

				window.open(payurl, '_blank');
				this.startPolling(trade_no);
			} catch (err) {
				console.error('[支付] 创建订单异常:', err.message);
				vk.alert(
					this.$t('shop.createOrderFailMsg', { n: err.message, p: this.pkgName(pkg) }),
					this.$t('shop.createOrderFailed')
				);
			} finally {
				this.creatingOrder = false;
			}
		},

		// ========== 轮询 ==========
		startPolling(trade_no, immediate = true) {
			if (!trade_no) return;
			this.paymentLoading = true;
			if (!this.pollingStartTime) this.pollingStartTime = Date.now();
			this.clearPollingTimer();
			this.pollingTimer = setInterval(() => {
				this.paymentElapsed = Math.floor((Date.now() - this.pollingStartTime) / 1000);
				this.checkPaymentStatus(trade_no, true);
			}, 3000);
			if (immediate) this.checkPaymentStatus(trade_no, true);
		},

		async checkPaymentStatus(trade_no, fromPolling = false) {
			if (!trade_no) return;
			if (this.pollingStartTime && (Date.now() - this.pollingStartTime) > this.pollingTimeout) {
				this.clearPollingTimer();
				this.paymentElapsed = Math.floor(this.pollingTimeout / 1000);
				if (fromPolling) vk.toast(this.$t('shop.autoQueryStopped', { n: this.$t('shop.paidCheck') }));
				return;
			}
			if (this.checkingPayment) return;
			this.checkingPayment = true;

			try {
				const isPaid = await paymentService.queryPayment(this.payConfig, trade_no);
				if (!isPaid) {
					this.checkingPayment = false;
					if (!fromPolling) {
						vk.alert(
							this.$t('shop.unpaidMsg', { n: trade_no }),
							this.$t('shop.unpaidTitle')
						);
					}
					return;
				}

				// 已支付 → 入账
				const packageInfo = this.currentPackageInfo;
				const addRes = await paymentService.creditPoints(trade_no, packageInfo.id);

				this.checkingPayment = false;
				this.clearPollingTimer();
				this.paymentLoading = false;
				paymentService.clearPendingOrder();
				await this.loadUserPoints();

				if (addRes.code !== 0 && addRes.code !== 1) {
					vk.alert(
						this.$t('shop.creditFailMsg', {
							n: trade_no,
							p: this.pkgName(packageInfo),
							e: addRes.msg || '-'
						}),
						this.$t('shop.creditFailTitle')
					);
					return;
				}
				const totalPoints = (addRes.data && addRes.data.total_points) || packageInfo.points || 0;
				const balance = (addRes.data && addRes.data.balance !== undefined) ? addRes.data.balance : this.userPoints;
				vk.alert(
					this.$t('shop.paySuccessMsg', { n: totalPoints, b: balance }),
					this.$t('shop.paySuccessTitle'),
					() => { this.selectedPackage = null; }
				);
			} catch (err) {
				this.checkingPayment = false;
				if (!fromPolling) {
					vk.alert(
						this.$t('shop.queryErrorMsg', { n: trade_no, e: err.message }),
						this.$t('shop.queryErrorTitle'),
						() => { this.resetPaymentFlowState(); }
					);
				}
			}
		},

		manualCheckPayment() {
			if (!this.currentTradeNo) return vk.toast(this.$t('shop.orderMissing'));
			this.checkPaymentStatus(this.currentTradeNo);
		},
		cancelPayment() {
			vk.confirm(this.$t('shop.cancelConfirm'), this.$t('shop.cancelConfirmTitle'), res => {
				if (res.confirm) {
					this.resetPaymentFlowState();
					vk.toast(this.$t('shop.cancelled'));
				}
			});
		},
		copyPaymentLink() {
			if (!this.paymentUrl) return vk.toast(this.$t('shop.payLinkMissing'));
			uni.setClipboardData({
				data: this.paymentUrl,
				success: () => vk.toast(this.$t('shop.payLinkCopied')),
				fail: () => vk.toast(this.$t('shop.copyFailed'))
			});
		},
		openPaymentPage() {
			if (!this.paymentUrl) return vk.toast(this.$t('shop.payLinkMissing'));
			window.open(this.paymentUrl, '_blank');
			this.startPolling(this.currentTradeNo);
		},

		// ========== localStorage 持久化 ==========
		_savePendingOrder(trade_no, payurl, pkg) {
			paymentService.savePendingOrder(trade_no, payurl, pkg);
		},
		restorePendingOrder() {
			const d = paymentService.restorePendingOrder();
			if (!d) return;
			this.currentTradeNo = d.trade_no;
			this.paymentUrl = d.payurl;
			this.currentPackageInfo = { id: d.package_id, name: d.package_name, points: d.points, price: d.price };
			this.paymentLoading = true;
			this.pollingStartTime = null;
			this.paymentElapsed = 0;
			this.startPolling(d.trade_no, true);
		},
		clearPendingOrder() {
			paymentService.clearPendingOrder();
		},

		// ========== 工具 ==========
		resetPaymentFlowState() {
			this.clearPollingTimer();
			this.pollingStartTime = null;
			this.paymentLoading = false;
			this.paymentElapsed = 0;
			this.currentTradeNo = '';
			this.currentPackageInfo = null;
			this.paymentUrl = '';
			this.checkingPayment = false;
			this.creatingOrder = false;
			this.clearPendingOrder();
		},
		clearPollingTimer() {
			if (this.pollingTimer) clearInterval(this.pollingTimer);
			this.pollingTimer = null;
		},
		showServiceQRCode() { this.serviceDialog.show = true; },

		// ========== 自助修复 ==========
		async submitRepair() {
			const trade_no = this.repairTradeNo;
			if (!trade_no || !trade_no.trim()) return vk.toast(this.$t('shop.enterTradeNo'));

			this.repairLoading = true;
			this.repairResult = null;

			try {
				const res = await paymentService.submitRepair(trade_no);
				const d = res.data || {};
				const order = d.order || null;

				if (res.code === 0 && d.status === 'credited') {
					this.repairResult = { type: 'success', title: this.$t('shop.repairCredited'), order };
					this.repairTradeNo = '';
					await this.loadUserPoints();
				} else if (res.code === 0 && d.status === 'already_credited') {
					this.repairResult = { type: 'success', title: this.$t('shop.repairAlready'), order };
				} else if (res.code === 0 && d.status === 'not_paid') {
					this.repairResult = { type: 'warning', title: this.$t('shop.repairNotPaid'), order };
				} else {
					this.repairResult = { type: 'error', title: res.msg || this.$t('shop.repairFailed'), order };
				}
			} catch (err) {
				this.repairResult = {
					type: 'error',
					title: this.$t('shop.repairError'),
					desc: err.message || this.$t('shop.networkError')
				};
			} finally {
				this.repairLoading = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.points-shop {
	min-height: 100vh;
	background: var(--vk-bg, #e1e8f2);
	padding: 20px;
}

/* 页面标题 */
.page-header {
	text-align: center;
	padding: 30px 20px 20px;

	.header-title {
		display: block;
		font-size: 32px;
		font-weight: bold;
		margin-bottom: 10px;
		color: var(--vk-text, #1e293b);
	}

	.header-subtitle {
		display: block;
		font-size: 16px;
		color: var(--vk-text-secondary, #64748b);
	}
}

/* 当前积分卡片 */
.current-points-card {
	margin-bottom: 30px;
	border-radius: 16px;
	overflow: hidden;
	background: var(--vk-card, #ffffff);

	.current-points {
		display: flex;
		align-items: center;
		padding: 10px;

		.points-icon {
			font-size: 48px;
			color: #f39c12;
			margin-right: 20px;
		}

		.points-info {
			flex: 1;

			.points-label {
				display: block;
				font-size: 14px;
				color: var(--vk-text-secondary, #909399);
				margin-bottom: 5px;
			}

			.points-value {
				display: block;
				font-size: 32px;
				font-weight: bold;
				color: var(--vk-primary, #409EFF);
			}
		}
	}
}

/* 套餐区域 */
.packages-section {
	margin-bottom: 30px;

	.section-title {
		display: block;
		color: var(--vk-text, #1e293b);
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 20px;
		text-align: center;
	}
}

/* 套餐网格 */
.packages-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 20px;
}

/* 套餐卡片 */
.package-card {
	position: relative;
	border-radius: 16px;
	cursor: pointer;
	transition: all 0.3s;
	overflow: hidden;
	background: var(--vk-card, #ffffff);

	&:hover {
		transform: translateY(-8px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
	}

	&.recommended {
		border: 3px solid #f39c12;

		.recommended-badge {
			position: absolute;
			top: 12px;
			right: -35px;
			background: linear-gradient(45deg, #f39c12, #e67e22);
			color: white;
			padding: 5px 40px;
			font-size: 12px;
			font-weight: bold;
			transform: rotate(45deg);
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
		}
	}

	&.selected {
		border: 3px solid var(--vk-primary, #409EFF);
		box-shadow: 0 0 20px rgba(64, 158, 255, 0.5);
	}

	::v-deep .el-card__body {
		padding: 30px 20px;
		text-align: center;
	}

	.package-name {
		display: block;
		font-size: 22px;
		font-weight: bold;
		color: var(--vk-text, #303133);
		margin-bottom: 15px;
	}

	.package-points {
		margin-bottom: 10px;

		.points-number {
			font-size: 48px;
			font-weight: bold;
			color: var(--vk-primary, #409EFF);
		}

		.points-unit {
			font-size: 16px;
			color: var(--vk-text-secondary, #909399);
			margin-left: 5px;
		}
	}


	.package-price {
		margin-bottom: 10px;

		.price-symbol {
			font-size: 20px;
			color: #F56C6C;
		}

		.price-number {
			font-size: 36px;
			font-weight: bold;
			color: #F56C6C;
		}
	}

	.package-discount {
		margin-bottom: 10px;
		min-height: 20px;
	}

	.package-desc {
		display: block;
		font-size: 14px;
		color: var(--vk-text-secondary, #909399);
		margin-bottom: 20px;
	}

	.select-btn {
		width: 100%;
	}
}

/* 支付加载遮罩 */
.payment-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(5px);

	.payment-modal {
		background: var(--vk-card, #ffffff);
		border-radius: 20px;
		padding: 40px;
		width: 90%;
		max-width: 450px;
		text-align: center;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		animation: slideDown 0.3s ease;

		.payment-icon {
			font-size: 64px;
			color: var(--vk-primary, #409EFF);
			margin-bottom: 20px;
			
			i {
				animation: rotate 1s linear infinite;
			}
		}

		.payment-title {
			display: block;
			font-size: 24px;
			font-weight: bold;
			color: var(--vk-text, #303133);
			margin-bottom: 10px;
		}

		.payment-desc {
			display: block;
			font-size: 14px;
			color: var(--vk-text-secondary, #909399);
			margin-bottom: 20px;
		}

		.payment-timer {
			display: block;
			font-size: 18px;
			color: var(--vk-primary, #409EFF);
			font-weight: bold;
			margin-bottom: 15px;
		}

		.payment-progress {
			margin-bottom: 20px;
		}

		.payment-tips {
			background: var(--vk-bg-secondary, #f0f9ff);
			border: 1px solid var(--vk-border, #b3d8ff);
			border-radius: 8px;
			padding: 12px;
			color: var(--vk-primary, #409EFF);
			font-size: 13px;
			margin-bottom: 20px;

			i {
				margin-right: 5px;
			}
		}

		.payment-actions {
			display: flex;
			justify-content: center;
			gap: 12px;
			margin-bottom: 12px;
			flex-wrap: wrap;
		}

		.payment-warning {
			display: block;
			font-size: 13px;
			line-height: 1.6;
			color: var(--vk-text-secondary, #e6a23c);
			background: var(--vk-bg-muted, #fff7e6);
			border-radius: 12px;
			padding: 12px 14px;
			margin-bottom: 18px;
		}
	}
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-50px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

/* 客服卡片样式 */
.service-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	
	::v-deep .el-card__body {
		background: transparent;
	}
	
	.service-icon {
		font-size: 64px;
		margin-bottom: 15px;
		
		i {
			animation: pulse 2s ease-in-out infinite;
		}
	}
	
	.package-name {
		color: white;
	}
	
	.service-desc {
		color: rgba(255, 255, 255, 0.9);
		margin: 20px 0;
		line-height: 1.8;
		
		.service-line {
			display: block;
			margin: 5px 0;
			font-size: 14px;
		}
	}
	
	&:hover {
		transform: translateY(-8px);
		box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
	}
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.1);
	}
}

/* 支付未到账修复卡片 */
.repair-card {
	margin-bottom: 20px;
	border-radius: 12px;
	border: 1px solid var(--vk-border, #faecd8);
	background: var(--vk-bg-muted, #fdf6ec);

	::v-deep .el-card__body {
		padding: 14px 20px;
	}

	.repair-inline {
		display: flex;
		align-items: center;
		gap: 12px;

		> i {
			font-size: 20px;
			color: #e6a23c;
		}

		.repair-label {
			font-size: 14px;
			color: var(--vk-text-secondary, #909399);
			white-space: nowrap;
		}

		.repair-input {
			flex: 1;
			max-width: 300px;
		}
	}

	.repair-result {
		margin-top: 12px;

		.repair-order-info {
			.repair-line {
				display: block;
				margin: 4px 0;
				font-size: 13px;
				color: var(--vk-text, #606266);
			}
		}

		.repair-desc {
			display: block;
			font-size: 13px;
			color: var(--vk-text, #606266);
		}
	}
}
</style>

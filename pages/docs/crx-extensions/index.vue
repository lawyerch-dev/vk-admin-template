<template>
	<view class="page-container">
		<view v-if="loading" class="doc-status">
			<text class="doc-status-text">{{ $t('docs.loading') }}</text>
		</view>
		<view v-else-if="loadError" class="doc-status">
			<text class="doc-status-text">{{ $t('docs.loadFailed') }}</text>
			<view class="doc-retry-btn" @click="reload">
				<text class="doc-retry-text">{{ $t('docs.retry') }}</text>
			</view>
		</view>
		<iframe
			v-show="!loading && !loadError"
			:src="docUrl"
			class="doc-iframe"
			frameborder="0"
			@load="onIframeLoad"
		></iframe>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				docUrl: 'https://bluerangala.feishu.cn/share/base/view/shrcnWBYDtditet6nFZmng8ycGF',
				loading: true,
				loadError: false,
				loadTimer: null
			}
		},
		onLoad() {
			uni.setNavigationBarTitle({ title: this.$t('docs.crx.title') });
			this.startLoadWatch();
		},
		onUnload() {
			this.clearLoadWatch();
		},
		methods: {
			// iframe 跨域 load 时机不稳定，加超时兜底
			startLoadWatch() {
				this.loading = true;
				this.loadError = false;
				this.clearLoadWatch();
				this.loadTimer = setTimeout(() => {
					if (this.loading) {
						this.loading = false;
						this.loadError = true;
					}
				}, 15000);
			},
			clearLoadWatch() {
				if (this.loadTimer) {
					clearTimeout(this.loadTimer);
					this.loadTimer = null;
				}
			},
			onIframeLoad() {
				this.clearLoadWatch();
				this.loading = false;
				this.loadError = false;
			},
			reload() {
				this.startLoadWatch();
				// 强制重新加载 iframe
				const url = this.docUrl;
				this.docUrl = '';
				this.$nextTick(() => {
					this.docUrl = url;
				});
			}
		}
	}
</script>

<style scoped>
.page-container {
	width: 100%;
	height: 100vh;
	overflow: hidden;
	background: var(--vk-bg);
}

.doc-iframe {
	width: 100%;
	height: 100%;
	border: none;
	background: var(--vk-card, #ffffff);
}

.doc-status {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	background: var(--vk-bg);
}

.doc-status-text {
	font-size: 15px;
	color: var(--vk-text-secondary, #64748b);
}

.doc-retry-btn {
	padding: 8px 24px;
	border-radius: 6px;
	background: var(--vk-primary, #3b82f6);
	cursor: pointer;
}

.doc-retry-text {
	font-size: 14px;
	color: #ffffff;
}
</style>

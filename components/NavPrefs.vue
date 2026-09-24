<template>
	<view class="nav-prefs">
		<!-- 语言：中 / EN -->
		<view class="seg">
			<view
				v-for="item in locales"
				:key="item.value"
				class="seg__item"
				:class="{ active: locale === item.value }"
				@click="switchLocale(item.value)"
			>{{ item.label }}</view>
		</view>

		<!-- 主题：浅色 / 深色 -->
		<view class="seg">
			<view
				v-for="item in modes"
				:key="item.value"
				class="seg__item"
				:class="{ active: mode === item.value }"
				@click="switchMode(item.value)"
			>{{ item.label }}</view>
		</view>
	</view>
</template>

<script>
import { applyColorMode, getColorMode } from '@/common/theme/runtime';

export default {
	data() {
		return {
			locales: [
				{ value: 'zh-Hans', label: '中' },
				{ value: 'en', label: 'EN' }
			],
			modes: [
				{ value: 'light', label: '浅色' },
				{ value: 'dark', label: '深色' }
			],
			mode: 'light',
			locale: 'zh-Hans'
		};
	},
	mounted() {
		this.mode = getColorMode();
		this.locale = this.$getLocale ? this.$getLocale() : 'zh-Hans';
	},
	methods: {
		switchLocale(value) {
			if (this.locale === value) return;
			this.locale = value;
			// 同时写 vue-i18n 与本组件状态，并强制刷新整棵页面树
			this.$setLocale(value);
			if (this.$i18n) this.$i18n.locale = value;
			this.$forceUpdate();
			try {
				const pages = getCurrentPages();
				for (let i = 0; i < pages.length; i++) {
					const vm = pages[i].$vm;
					if (vm) vm.$forceUpdate();
				}
			} catch (e) {}
			this.$emit('locale-change', value);
		},
		switchMode(value) {
			if (this.mode === value) return;
			this.mode = value;
			applyColorMode(value);
			this.$forceUpdate();
			try {
				const pages = getCurrentPages();
				for (let i = 0; i < pages.length; i++) {
					const vm = pages[i].$vm;
					if (vm) vm.$forceUpdate();
				}
			} catch (e) {}
			this.$emit('theme-change', value);
		}
	}
};
</script>

<style lang="scss" scoped>
.nav-prefs {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 6px;
	margin-right: 0;
}

.seg {
	display: flex;
	flex-direction: row;
	align-items: center;
	background: var(--vk-bg-muted, #f1f5f9);
	border-radius: 8px;
	padding: 2px;
}

.seg__item {
	min-width: 36px;
	height: 28px;
	padding: 0 10px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 500;
	color: var(--vk-text-secondary, #64748b);
	display: flex;
	align-items: center;
	justify-content: center;
}

.seg__item.active {
	background: var(--vk-primary, #3b82f6);
	color: #ffffff;
}
</style>

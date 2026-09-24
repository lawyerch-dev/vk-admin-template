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

		<!-- 主题：色板 -->
		<view class="theme">
			<view
				v-for="item in themes"
				:key="item.name"
				class="theme__swatch"
				:class="{ active: themeName === item.name }"
				:style="{ background: item.color }"
				@click="switchTheme(item.name)"
			></view>
		</view>
	</view>
</template>

<script>
import { applyBrand, brandPresets, getBrandName } from '@/common/theme/runtime';

const LOCALES = [
	{ value: 'zh-Hans', label: '中' },
	{ value: 'en', label: 'EN' }
];

const THEMES = [
	{ name: 'blue', color: '#3b82f6', label: '蓝' },
	{ name: 'indigo', color: '#6366f1', label: '靛' },
	{ name: 'cyan', color: '#0891b2', label: '青' }
];

export default {
	data() {
		return {
			locales: LOCALES,
			themes: THEMES,
			themeName: 'blue',
			locale: 'zh-Hans'
		};
	},
	mounted() {
		this.themeName = getBrandName();
		this.locale = this.$getLocale ? this.$getLocale() : 'zh-Hans';
	},
	methods: {
		switchLocale(value) {
			if (this.locale === value) return;
			this.locale = value;
			this.$setLocale(value);
			// 文案不更新时强制刷新当前页
			this.$forceUpdate();
			const pages = getCurrentPages();
			const page = pages[pages.length - 1];
			if (page && typeof page.$vm !== 'undefined') {
				page.$vm.$forceUpdate();
			}
			this.$emit('locale-change', value);
		},
		switchTheme(name) {
			if (this.themeName === name) return;
			this.themeName = name;
			const tokens = applyBrand(name);
			// 同步给页面根节点，保证非 H5 也能吃到变量
			const pages = getCurrentPages();
			const page = pages[pages.length - 1];
			if (page && page.$vm && page.$vm.$el && page.$vm.$el.style) {
				const el = page.$vm.$el;
				el.style.setProperty('--vk-primary', tokens.primary);
				el.style.setProperty('--vk-primary-hover', tokens.primaryHover);
				el.style.setProperty('--vk-primary-light', tokens.primaryLight);
				el.style.setProperty('--vk-primary-border', tokens.primaryBorder);
				el.style.setProperty('--vk-primary-soft', tokens.primarySoft);
			}
			this.$emit('theme-change', name);
		}
	}
};
</script>

<style lang="scss" scoped>
.nav-prefs {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10px;
	margin-right: 8px;
}

/* 语言分段 */
.seg {
	display: flex;
	flex-direction: row;
	align-items: center;
	background: #f1f5f9;
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
	color: #64748b;
	display: flex;
	align-items: center;
	justify-content: center;
}

.seg__item.active {
	background: var(--vk-primary, #3b82f6);
	color: #ffffff;
}

/* 主题色板 */
.theme {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 6px;
	padding: 4px 8px;
	background: #f1f5f9;
	border-radius: 8px;
}

.theme__swatch {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	border: 2px solid transparent;
	box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.theme__swatch.active {
	border-color: #0f172a;
	transform: scale(1.1);
}
</style>

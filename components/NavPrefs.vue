<template>
	<view class="nav-prefs">
		<text class="nav-prefs__btn" @click="toggleLocale">{{ localeLabel }}</text>
		<text class="nav-prefs__btn nav-prefs__dot" :style="{ background: primaryColor }" @click="toggleTheme"></text>
	</view>
</template>

<script>
import { applyBrand, brandPresets } from '@/common/theme/runtime';

const THEME_ORDER = ['blue', 'indigo', 'cyan'];
const LOCALE_ORDER = ['zh-Hans', 'en'];

export default {
	data() {
		return {
			themeName: 'blue'
		};
	},
	computed: {
		localeLabel() {
			return (this.$getLocale && this.$getLocale()) === 'en' ? 'EN' : '中';
		},
		primaryColor() {
			const preset = brandPresets[this.themeName] || brandPresets.blue;
			return preset.primary;
		}
	},
	methods: {
		toggleLocale() {
			const cur = this.$getLocale ? this.$getLocale() : 'zh-Hans';
			const idx = LOCALE_ORDER.indexOf(cur);
			const next = LOCALE_ORDER[(idx + 1) % LOCALE_ORDER.length];
			this.$setLocale(next);
		},
		toggleTheme() {
			const idx = THEME_ORDER.indexOf(this.themeName);
			this.themeName = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
			applyBrand(this.themeName);
			this.$emit('theme-change', this.themeName);
		}
	}
};
</script>

<style lang="scss" scoped>
.nav-prefs {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8px;
	margin-right: 4px;
}

.nav-prefs__btn {
	min-width: 32px;
	height: 32px;
	padding: 0 8px;
	border: 1px solid var(--vk-primary-border, #93c5fd);
	border-radius: 6px;
	font-size: 12px;
	color: var(--vk-primary, #3b82f6);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.nav-prefs__dot {
	width: 32px;
	min-width: 32px;
	padding: 0;
	border-color: transparent;
}
</style>

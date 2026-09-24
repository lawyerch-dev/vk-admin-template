<template>
	<view class="header no-user-select" v-loading="!vk.getVuex('$app.inited')" :style="'--textColor'+textColor">
		<!-- 左侧 -->
		<view class="left">
			
			<!-- 模式一：纯图片 -->
			<!-- <navigator class="logo-mode-1" open-type="reLaunch" url="/">
				<image :src="vk.getVuex('$app.staticUrl.navBar.logo1')" mode="aspectFill" class="logo-image" v-show="vk.getVuex('$app.leftCollapse')"></image>
				<image :src="vk.getVuex('$app.staticUrl.navBar.logo2')" mode="aspectFill" class="logo-image" v-show="!vk.getVuex('$app.leftCollapse')"></image>
			</navigator> -->
			
			<!-- 模式二：图片+文字 -->
			<navigator class="logo-mode-2" open-type="reLaunch" url="/">
				<view class="logo-box" v-show="!vk.getVuex('$app.leftCollapse')">
					<image class="logo-image" :src="vk.getVuex('$app.staticUrl.navBar.logo')" mode="scaleToFill"></image>
					<view class="app-name">AI自动化商务定制</view>
				</view>
				<view class="logo-box" v-show="vk.getVuex('$app.leftCollapse')">
					<image class="logo-image" :src="vk.getVuex('$app.staticUrl.navBar.logo')" mode="aspectFit"></image>
				</view>
			</navigator>

		</view>
		<!-- 右侧 -->
		<view class="right">
			<!-- 右上 -->
			<view class="right-top" :style="topMenuStyle">
				<view
					class="navbar"
					:class="{ 'navbar-mini': !matchLeftWindow, 'popup-menu': popupMenuOpened }"
				>
					<vk-data-icon
						class="menu-collapse"
						:name="vk.getVuex('$app.leftCollapse') ? 'vk-icon-zhankaicaidan':'vk-icon-shouqicaidan'"
						size="17"
						:color="textColor"
						:pointer="true"
						@click="menuCollapse"
					></vk-data-icon>
					<!-- 面包屑 -->
					<breadcrumb></breadcrumb>

					<view class="navbar-left pointer">
						<vk-data-icon
							@click="toggleSidebar"
							class="menu-icon"
							name="vk-icon-sortlight"
							size="30"
							:color="textColor"
						></vk-data-icon>
					</view>
					<view class="navbar-middle">
						<text class="title-text">{{ navigationBarTitleText }}</text>
					</view>
					<view class="navbar-right pointer">
						<!-- #ifdef H5 -->
						<view
							v-if="vk.getVuex('$error.logs').length"
							@click="openForm('errorLog')"
							class="error-log-btn pointer"
						>
							<el-badge :value="vk.getVuex('$error.logs').length" class="item">
								<vk-data-icon
									name="el-icon-message-solid"
									size="20"
									:color="textColor"
								></vk-data-icon>
							</el-badge>
						</view>
						<!-- #endif -->
						<view class="navbar-prefs">
							<nav-prefs />
						</view>
						<view class="back-site pointer" @click.stop="goLanding">
							<vk-data-icon name="el-icon-s-home" size="14" color="#ffffff"></vk-data-icon>
							<text class="back-site__label">{{ $t('nav.backToSite') }}</text>
						</view>
						<view class="navbar-user navbar-user--always" :class="{ active: popupMenuOpened }" @click="togglePopupMenu">
							<text class="avatar">{{ avatarChar }}</text>
							<text class="username">{{ vk.getVuex("$user.userInfo.username") }}</text>
							<text class="caret">▾</text>
						</view>
						<view class="vk-mask" @click="togglePopupMenu"></view>
						<view class="navbar-menu">
							<view class="menu-header">
								<text class="avatar avatar--lg">{{ avatarChar }}</text>
								<view class="menu-header__meta">
									<text class="menu-header__name">{{ vk.getVuex("$user.userInfo.nickname") || vk.getVuex("$user.userInfo.username") }}</text>
									<text class="menu-header__role">{{ vk.getVuex("$user.userInfo.username") }}</text>
								</view>
							</view>
							<view class="menu-divider"></view>
							<view class="menu-item menu-row" @click="goLanding">
								<text class="menu-row__label">{{ $t('nav.backToSite') }}</text>
							</view>
							<view class="menu-item menu-row" @click="openForm('updatePassword')">
								<text class="menu-row__label">{{ $t('nav.changePassword') }}</text>
							</view>
							<view class="menu-item menu-row menu-row--danger" @click="logout">
								<text class="menu-row__label">{{ $t('nav.logout') }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			<!-- 右下 -->
			<view class="right-bottom">
				<!-- tabs标签组 -->
				<vk-data-menu-tabs v-if="vk.getVuex('$app.inited')" ref="menuTabs"></vk-data-menu-tabs>
			</view>
		</view>
		<!-- 弹窗 - 错误日志 -->
		<errorLog v-model="formDatas.errorLog"></errorLog>
		<!-- 弹窗 - 修改密码 -->
		<updatePassword v-model="formDatas.updatePassword"></updatePassword>
	</view>
</template>

<script>
import config from "@/app.config.js";
import breadcrumb from "./components/breadcrumb";
import errorLog from "./components/errorLog";
import updatePassword from "./components/updatePassword";
import NavPrefs from "@/components/NavPrefs.vue";
export default {
	components: {
		breadcrumb,
		errorLog,
		updatePassword,
		NavPrefs
	},
	props: {
		navigationBarTitleText: {
			type: String
		},
		matchLeftWindow: {
			type: Boolean
		},
		showLeftWindow: {
			type: Boolean
		}
	},
	data() {
		return {
			debug: config.debug,
			// 主题配置
			theme: config.theme,
			// 右侧链接,只在开发模式时显示
			links: [
				{
					textKey: "nav.docsAdmin",
					url: "https://vkdoc.fsq.pub/admin/"
				},
				{
					textKey: "nav.morePlugins",
					url: "https://ext.dcloud.net.cn/search?q=vk"
				}
			],
			popupMenuOpened: false,
			tabCheck: "",
			formDatas: {}
		};
	},
	// 组件挂载完毕时
	mounted() {
		this.vk.menuTabs = this.$refs.menuTabs;
		this.checkMenuCollapse();
	},
	methods: {
		// 返回前台落地页
		goLanding() {
			let that = this;
			that.popupMenuOpened = false;
			uni.reLaunch({
				url: "/pages/landing/index"
			});
		},
		// 退出登录
		logout() {
			let that = this;
			let { vk } = that;
			vk.userCenter.logout({
				success: function(data) {
					if (typeof that.$refs.menuTabs.clear === "function") that.$refs.menuTabs.clear();
					uni.reLaunch({
						url: config.login.url
					});
				}
			});
		},
		// 左侧菜单显示和隐藏
		toggleSidebar() {
			let that = this;
			if (!that.showLeftWindow) {
				uni.showLeftWindow();
			} else {
				uni.hideLeftWindow();
			}
		},
		// 右上方菜单显示和隐藏
		togglePopupMenu() {
			let that = this;
			that.popupMenuOpened = !that.popupMenuOpened;
		},
		// 打开表单
		openForm(name) {
			let that = this;
			let { vk } = that;
			that.formDatas[name] = {
				show: true
			};
		},
		// pc状态下菜单折叠
		menuCollapse(){
			let leftCollapse = vk.getVuex('$app.leftCollapse');
			vk.setVuex('$app.leftCollapse', !leftCollapse);
			this.checkMenuCollapse();
		},
		checkMenuCollapse(){
				let leftCollapse = vk.getVuex('$app.leftCollapse');
				// 从 leftWindow 的 CSS 变量读取宽度，避免硬编码
				let sidebarStyle = getComputedStyle(document.querySelector('.sidebar'));
				let openWidth = sidebarStyle.getPropertyValue('--sidebar-width').trim() || '250px';
				let collapseWidth = sidebarStyle.getPropertyValue('--sidebar-collapse-width').trim() || '64px';
				uni.setLeftWindowStyle({
					width: leftCollapse ? collapseWidth : openWidth,
				});
			}
	},
	// 计算属性
	computed: {
		topMenuStyle(){
			// 顶栏跟全局深浅色变量，避免旧 theme 内联白底
			return {};
		},
		textColor(){
			return "var(--vk-text, #1e293b)";
		},
		avatarChar() {
			const info = this.vk.getVuex("$user.userInfo") || {};
			const name = info.nickname || info.username || "";
			return (name && String(name).charAt(0)) || "?";
		}
	}
};
</script>

<style lang="scss">
.header {
	height: 100px;
	width: 100%;
	box-sizing: border-box;
	display: flex;
	border-bottom: 1px solid var(--vk-border, #e2e8f0);
	background-color: var(--vk-card, #ffffff);
	color: var(--vk-text, #1e293b);
	/* 左侧 */
	.left {
		width: calc(var(--window-left));
	}
	/* 右侧 */
	.right {
		width: calc(100% - var(--window-left));

		.navbar {
			font-size: 13px;
			position: relative;
			height: 100%;
			padding: 0 20px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.menu-icon {
			width: 30px;
			height: 30px;
			line-height: 30px;
		}
		.menu-collapse{
			width: 30px;
			height: 30px;
			line-height: 30px;
		}

		.navbar-left,
		.navbar-middle,
		.navbar-right {
			flex: 1;
		}

		.navbar-middle,
		.username {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.navbar-middle {
			text-align: center;
		}

		.username {
			max-width: 150px;
		}

		.text-overflow {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.text-overflow {
			max-width: 150px;
		}

		.title-text {
			font-size: 13px;
			line-height: 30px;
			color: var(--vk-text);
		}

		.navbar-menu {
			display: flex;
		}

		.menu-item {
			padding: 5px;
		}

		.menu-item a {
			text-decoration: none !important;
		}

		.debug {
			display: inline-block;
			position: relative;
		}

		.debug-badge {
			position: absolute;
			top: 5px;
			right: 13px;
			transform: translateY(-50%) translateX(100%) scale(0.8);
		}

		.arrowdown {
			margin-top: 4px;
			margin-left: 3px;
		}


		.navbar-right {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 10px;
		}

		.navbar-prefs {
			display: flex;
			align-items: center;
		}

		.back-site {
			display: flex;
			align-items: center;
			gap: 6px;
			height: 34px;
			padding: 0 20px;
			margin-right: 4px;
			border-radius: 6px;
			border: none;
			background: var(--vk-primary, #3b82f6);
			color: #ffffff;
			font-size: 14px;
			font-weight: 500;
			transition: background 0.2s;

			.back-site__label {
				line-height: 1;
			}

			&:hover {
				background: var(--vk-primary-hover, #2563eb);
			}
		}

		.error-log-btn {
			display: flex;
			align-items: center;
			height: 34px;
			padding: 0 8px;
			margin-right: 8px;
			border-radius: 6px;
			transition: background 0.2s;

			&:hover {
				background: var(--vk-bg-muted, #f1f5f9);
			}
		}

		.menu-link {
			color: var(--vk-primary, #3b82f6) !important;
			text-decoration: none !important;
			font-weight: 500;
			padding: 4px 10px;
			border-radius: 6px;
			background: var(--vk-primary-soft, #ecfeff);
		}

		.user-chip {
			background: var(--vk-bg-muted, #f1f5f9) !important;
			border-radius: 16px !important;
			padding: 4px 12px !important;
			font-weight: 600;
			color: var(--vk-text, #1e293b) !important;
		}

		.action-btn {
			background: var(--vk-primary, #3b82f6) !important;
			border-radius: 6px !important;
			padding: 4px 12px !important;
			font-weight: 500;
		}

		.action-btn .text-overflow,
		.action-btn .logout,
		.action-btn text {
			color: #ffffff !important;
		}

		.action-btn--danger {
			background: #ef4444 !important;
		}

		.navbar-right .vk-mask {
			background-color: rgba(255, 255, 255, 0);
		}

		.popup-menu__arrow {
			position: absolute;
			top: -6px;
			right: 20px;
			border-width: 6px;
			margin-right: 3px;
			border-top-width: 0;
			border-bottom-color: var(--vk-border);
			filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.03));
		}

		.popup-menu__arrow::after {
			content: " ";
			position: absolute;
			display: block;
			width: 0;
			height: 0;
			border-color: transparent;
			border-style: solid;
			border-width: 6px;
			top: 1px;
			margin-left: -6px;
			border-top-width: 0;
			border-bottom-color: #fff;
		}

		/* 默认：用户入口 + 偏好；详细操作进下拉 */
		.menu-icon,
		.navbar-middle,
		.popup-menu__arrow {
			display: none;
		}

		.navbar-user--always {
			display: flex !important;
			align-items: center;
			gap: 8px;
			height: 34px;
			padding: 0 10px 0 4px;
			border-radius: 6px;
			background: var(--vk-bg-muted, #f1f5f9);
			cursor: pointer;
			transition: background 0.2s;
		}

		.navbar-user--always:hover,
		.navbar-user--always.active {
			background: var(--vk-primary-light, #eff6ff);
		}

		.avatar {
			width: 26px;
			height: 26px;
			border-radius: 50%;
			background: var(--vk-primary, #3b82f6);
			color: #fff;
			font-size: 12px;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.avatar--lg {
			width: 36px;
			height: 36px;
			font-size: 14px;
		}

		.caret {
			font-size: 10px;
			color: var(--vk-text-secondary, #64748b);
			margin-left: 2px;
		}

		.navbar-right .vk-mask {
			display: none;
		}

		.navbar-menu {
			display: none !important;
		}

		.popup-menu .navbar-menu {
			display: flex !important;
			flex-direction: column;
			align-items: stretch;
			position: absolute;
			right: 12px;
			top: 44px;
			min-width: 220px;
			background: var(--vk-card, #ffffff);
			border: 1px solid var(--vk-border, #e2e8f0);
			border-radius: 12px;
			box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
			padding: 10px;
			gap: 2px;
			z-index: 1000;
		}

		.menu-header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 8px 10px 10px;
		}

		.menu-header__meta {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		.menu-header__name {
			font-size: 14px;
			font-weight: 600;
			color: var(--vk-text, #1e293b);
		}

		.menu-header__role {
			font-size: 12px;
			color: var(--vk-text-secondary, #64748b);
			margin-top: 2px;
		}

		.menu-divider {
			height: 1px;
			background: var(--vk-border, #e2e8f0);
			margin: 4px 6px 8px;
		}

		.menu-row {
			display: flex;
			align-items: center;
			padding: 9px 12px;
			border-radius: 8px;
			cursor: pointer;
		}

		.menu-row:hover {
			background: var(--vk-bg-muted, #f1f5f9);
		}

		.menu-row__label {
			font-size: 13px;
			color: var(--vk-text, #1e293b);
		}

		.menu-row--danger .menu-row__label {
			color: #ef4444;
		}

		.menu-row--danger:hover {
			background: #fef2f2;
		}

		.popup-menu .navbar-right .vk-mask {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 999;
		}

		.popup-menu .popup-menu__arrow {
			display: none;
		}

		.navbar-menu .menu-item {
			width: 100%;
			box-sizing: border-box;
		}

		.navbar-menu .action-btn,
		.navbar-menu .user-chip,
		.navbar-menu .menu-link {
			text-align: center;
			justify-content: center;
		}

		/* 小屏，显示的内容 */
		.navbar-mini .menu-icon,
		.navbar-mini .navbar-middle {
			display: block;
		}

		.navbar-mini .navbar-user {
			display: flex;
		}

		/* 小屏时，隐藏的内容 */
		.navbar-mini .menu-collapse,
		.navbar-mini .logo,
		.navbar-mini .debug,
		.navbar-mini .navbar-menu .username,
		.navbar-mini .breadcrumb-view,
		.navbar-mini .mini-none {
			display: none;
		}

		.navbar-mini .navbar-menu {
			flex-direction: column;
			align-items: center;
			justify-content: center;
			position: fixed;
			right: 20px;
			top: 50px;
			background-color: var(--vk-card);
			z-index: 999;
			padding: 0px 15px;
			margin: 5px 0;
			background-color: var(--vk-card);
			border: 1px solid var(--vk-border);
			border-radius: 4px;
			box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
		}

		/* 小屏时，弹出下拉菜单 */
		.navbar-mini.popup-menu .navbar-menu {
			display: flex !important;
		}

		.navbar-mini.popup-menu .popup-menu__arrow,
		.navbar-mini.popup-menu .navbar-right .vk-mask {
			display: block;
		}
		.logout:hover {
			color: $menu-text-color-actived;
		}
	}
	/* 右上 */
	.right-top {
		height: 50px;
		background-color: var(--vk-card, #ffffff) !important;
		color: var(--vk-text, #1e293b);
	}
	/* 右下 */
	.right-bottom {
		padding: 0px 12px;
		height: 50px;
		background-color: var(--vk-bg-muted, #f1f5f9);
	}

	::v-deep .navbar .top-bar .item-content {
		color: var(--textColor);
	}

	/* logo模式一开始 纯图片 */
	.logo-mode-1 {
		display: flex;
		align-items: center;
		justify-content: center;
		.logo-image {
			width: 100%;
			height: 50px;
			display: block;
		}
	}
	/* logo模式一结束 */

	/* logo模式二开始 logo+文字 */
	.logo-mode-2{
		.logo-box{
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--vk-card, #ffffff);
			height: 50px;
			.logo-image{
				width: 38px;
				height: 38px;
				margin-left: 10px;
				margin-right: 10px;
				border-radius: 50%;
			}
			.app-name{
				width: 100%;
				text-align: left;
				flex:1;
				line-height: 50px;
				font-size: 20px;
				font-weight: bold;
				// 跟随主题：浅色用深色字，深色用浅色字，避免写死白字在浅色模式下不可见
				color: var(--vk-text, #1e293b);
				display: inline-block;
				white-space: nowrap;
				overflow: hidden;
				text-overflow:ellipsis;
			}
		}
	}
	/* logo模式二结束 */
}
</style>

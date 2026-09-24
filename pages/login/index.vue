<template>
	<view class="login-page">
		<!-- 顶部导航（与主页一致） -->
		<view class="nav">
			<view class="nav__inner">
				<view class="nav__left" @click="goHome">
					<image class="nav__logo" src="/static/logo.png" mode="aspectFit"></image>
					<text class="nav__brand">AI 商务定制</text>
				</view>
				<view class="nav__right">
					<text class="nav__link" @click="goHome">返回主页</text>
				</view>
			</view>
		</view>

		<view class="login-card">
			<!-- 头部 -->
			<view class="card-header">
				<image class="logo" :src="logoImage"></image>
				<view class="header-text">
					<text class="title">AI自动化商务定制化</text>
					<text class="subtitle">智能管理，高效运营</text>
				</view>
			</view>

			<!-- 标签栏 -->
			<view class="tabs">
				<view 
					v-for="tab in tabs" 
					:key="tab.key"
					:class="['tab-btn', activeTab === tab.key ? 'active' : '']"
					@click="activeTab = tab.key"
				>
					<text class="tab-text">{{ tab.label }}</text>
				</view>
			</view>

			<!-- 表单区域 -->
			<scroll-view class="form-area" scroll-y>
				<login-form 
					v-if="activeTab === 'login'"
					@success="onLoginSuccess"
					@open-agreement="openAgreement"
				/>

				<register-form 
					v-if="activeTab === 'register'"
					:invite-code="inviteCode"
					:inviter-info="inviterInfo"
					@success="onRegisterSuccess"
					@login-success="onLoginSuccess"
					@open-agreement="openAgreement"
				/>

				<forgot-form 
					v-if="activeTab === 'forgot'"
					@success="onForgotSuccess"
				/>
			</scroll-view>

			<!-- 底部链接 -->
			<view class="footer">
				<text v-if="activeTab === 'login'" class="footer-text">没有账号？</text>
				<text v-if="activeTab === 'login'" class="footer-link" @click="activeTab = 'register'">立即注册</text>
				<text v-if="activeTab === 'register'" class="footer-text">已有账号？</text>
				<text v-if="activeTab === 'register'" class="footer-link" @click="activeTab = 'login'">立即登录</text>
				<text v-if="activeTab === 'forgot'" class="footer-text">想起密码了？</text>
				<text v-if="activeTab === 'forgot'" class="footer-link" @click="activeTab = 'login'">返回登录</text>
			</view>
		</view>
	</view>
</template>

<script>
import LoginForm from './components/login-form.vue'
import RegisterForm from './components/register-form.vue'
import ForgotForm from './components/forgot-form.vue'

let vk = uni.vk;

export default {
	components: {
		LoginForm,
		RegisterForm,
		ForgotForm
	},
	data() {
		return {
			activeTab: 'login',
			tabs: [
				{ key: 'register', label: '注册' },
				{ key: 'login', label: '登录' },
				{ key: 'forgot', label: '忘记密码' }
			],
			logoImage: "/static/logo.png",
			inviteCode: "",
			inviterInfo: null,
		};
	},
	onLoad(options = {}) {
		vk = this.vk;
		this.options = options;
		this.init(options);
	},
	onShow() {
		if (!this.inviteCode) {
			const inviteCode = this.parseInviteCode({});
			if (inviteCode) {
				this.setInviteCode(inviteCode);
			}
		}
	},
	onPullDownRefresh() {
		setTimeout(() => {
			uni.stopPullDownRefresh();
		}, 1000);
	},
	methods: {
		parseInviteCode(options = {}) {
			if (options.inviteCode) {
				return options.inviteCode;
			}
			// #ifdef H5
			if (window.location && window.location.hash) {
				const hash = window.location.hash;
				const hashMatch = hash.match(/[?&]inviteCode=([^&#]+)/);
				if (hashMatch && hashMatch[1]) {
					return decodeURIComponent(hashMatch[1]);
				}
			}
			// #endif
			return null;
		},
		setInviteCode(code) {
			if (code && code !== this.inviteCode) {
				this.inviteCode = code;
				this.loadInviterInfo(code);
			}
		},
		loadInviterInfo(code) {
			vk.callFunction({
				url: 'user/pub/getUserInfoByInviteCode',
				data: { code },
				success: (data) => {
					if (data.userInfo) {
						this.inviterInfo = data.userInfo;
					}
				}
			});
		},
		init(options = {}) {
			const inviteCode = options.inviteCode || this.parseInviteCode(options);
			if (inviteCode) {
				this.setInviteCode(inviteCode);
			}
			if (options.tab === 'register') {
				this.activeTab = 'register';
			}
			if (!getApp().isAllowLoginBackground()) {
				return false;
			}
			if (vk.checkToken()) {
				vk.userCenter.checkToken({
					loading: true,
					success: data => {
						this.onLoginSuccess(data);
					}
				});
			}
		},
		onLoginSuccess(data) {
			let { userInfo = {} } = data;
			if (!getApp().isAllowLoginBackground(userInfo)) {
				vk.alert("您的账户无登陆权限");
				return;
			}
			vk.setVuex("$app.inited", false);
			vk.setVuex("$app.navMenu", []);
			getApp().init();
			
			if (this.options.uniIdRedirectUrl) {
				let url = decodeURIComponent(this.options.uniIdRedirectUrl);
				if (url) {
					vk.redirectTo(url);
					return;
				}
			}
			
			let pages = getCurrentPages();
			if (pages.length >= 2 && pages[pages.length - 2] && pages[pages.length - 2].route && pages[pages.length - 2].route.indexOf("login/") == -1) {
				vk.reLaunch("/" + pages[pages.length - 2].route);
			} else {
				vk.navigateToHome();
			}
		},
		onRegisterSuccess({ username }) {
			this.activeTab = 'login';
		},
		onForgotSuccess() {
			this.activeTab = 'login';
		},
		goHome() {
			uni.reLaunch({ url: '/pages/landing/index' });
		},
		openAgreement() {
			const url = 'https://bluerangala.feishu.cn/docx/IXoedH1Oso18iDxxjWsck9SBnfb?from=from_copylink';
			// #ifdef H5
			window.open(url, '_blank');
			// #endif
			// #ifndef H5
			uni.navigateTo({
				url: '/pages/webview/index?url=' + encodeURIComponent(url)
			});
			// #endif
		}
	}
};
</script>

<style lang="scss" scoped>
.login-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	background-color: #F1F5F9;
	padding: 20px;
	padding-top: 84px;
	box-sizing: border-box;
}

// 顶部导航（与主页一致）
.nav {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12px);
	border-bottom: 1px solid #e2e8f0;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

	&__inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	&__left {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
	}

	&__logo {
		width: 32px;
		height: 32px;
	}

	&__brand {
		font-size: 18px;
		font-weight: 700;
		color: #1e293b;
	}

	&__right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	&__link {
		font-size: 14px;
		color: #64748b;
		cursor: pointer;

		&:hover {
			color: #1e293b;
		}
	}

	&__btn {
		padding: 8px 20px;
		background: #3b82f6;
		color: #ffffff;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;

		&:hover {
			background: #2563eb;
		}
	}
}

.login-card {
	width: 100%;
	max-width: 560px;
	background-color: #FFFFFF;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	max-height: 100%;
}

.card-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 24px;
	border-bottom-width: 1px;
	border-bottom-color: #E2E8F0;
	border-bottom-style: solid;
}

.logo {
	width: 48px;
	height: 48px;
	border-radius: 8px;
	margin-right: 16px;
}

.header-text {
	display: flex;
	flex-direction: column;
}

.title {
	font-size: 18px;
	font-weight: 600;
	color: #0F172A;
	line-height: 24px;
}

.subtitle {
	font-size: 13px;
	color: #64748B;
	margin-top: 2px;
}

.tabs {
	display: flex;
	flex-direction: row;
	background-color: #F8FAFC;
	padding: 12px 24px 0;
}

.tab-btn {
	flex: 1;
	padding: 10px 16px;
	text-align: center;
	background-color: transparent;
	border-radius: 8px 8px 0 0;
}

.tab-btn.active {
	background-color: #FFFFFF;
	position: relative;
}

.tab-btn.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 20%;
	right: 20%;
	height: 2px;
	background-color: #0891B2;
}

.tab-text {
	font-size: 14px;
	color: #64748B;
}

.tab-btn.active .tab-text {
	color: #0891B2;
	font-weight: 600;
}

.form-area {
	height: calc(100vh - 240px);
	min-height: 300px;
	max-height: 420px;
	overflow: hidden;
}

.footer {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	padding: 16px 24px;
	background-color: #F8FAFC;
	border-top-width: 1px;
	border-top-color: #E2E8F0;
	border-top-style: solid;
}

.footer-text {
	font-size: 13px;
	color: #64748B;
}

.footer-link {
	font-size: 13px;
	font-weight: 500;
	color: #0891B2;
	margin-left: 4px;
}

@media screen and (max-width: 480px) {
	.login-page {
		padding: 12px;
	}
	
	.login-card {
		max-width: 100%;
	}
	
	.card-header {
		padding: 20px;
	}
	
	.tabs {
		padding: 10px 20px 0;
	}
	
	.footer {
		padding: 14px 20px;
	}
}
</style>

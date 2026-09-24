<template>
	<view class="form-content">
		<view class="field">
			<text class="label">{{ $t('login.username') }} <text class="req">*</text></text>
			<input 
				class="input" 
				v-model="form.username" 
				type="text" 
				:placeholder="$t('login.usernamePlaceholder')" 
			/>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.password') }} <text class="req">*</text></text>
			<view class="input-wrap">
				<input
					class="input"
					v-model="form.password"
					:type="showPassword ? 'text' : 'password'"
					:placeholder="$t('login.passwordPlaceholder')"
				/>
				<text class="pwd-toggle" @click="showPassword = !showPassword">{{ showPassword ? $t('login.hide') : $t('login.show') }}</text>
			</view>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.captcha') }} <text class="req">*</text></text>
			<view class="captcha-wrapper">
				<uni-captcha scene="login" v-model="form.captcha"></uni-captcha>
			</view>
		</view>

		<view class="checkbox-row">
			<view class="checkbox-item">
				<checkbox-group @change="onCheckboxChange">
					<checkbox value="remember" :checked="checked" :color="primaryColor" />
				</checkbox-group>
				<text class="checkbox-text">{{ $t('login.remember') }}</text>
			</view>
			<view class="checkbox-item">
				<checkbox-group @change="onAgreementChange">
					<checkbox value="agree" :checked="form.agreement" :color="primaryColor" />
				</checkbox-group>
				<text class="checkbox-text">{{ $t('login.agree') }}</text>
				<text class="link" @click="$emit('open-agreement')">{{ $t('login.agreement') }}</text>
			</view>
		</view>

		<view class="btn-primary" @click="handleSubmit">
			<text class="btn-text">{{ $t('login.submit') }}</text>
		</view>

		<!-- 演示账号：点击填充 -->
		<view v-if="testUsers.length" class="demo-accounts">
			<view class="demo-head">
				<text class="demo-title">{{ $t('login.demoTitle') }}</text>
				<text class="demo-hint">{{ $t('login.demoHint') }}</text>
			</view>
			<view
				v-for="user in testUsers"
				:key="user.username"
				class="demo-row"
				@click="fillTestUser(user)"
			>
				<text class="demo-account">{{ user.username }}</text>
				<text class="demo-tag">{{ user.desc }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import config from '@/app.config.js';

let vk = uni.vk;

export default {
	props: {
		needPermission: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			form: {
				username: "",
				password: "",
				captcha: "",
				agreement: true,
				needPermission: true
			},
			checked: false,
			showPassword: false
		}
	},
	computed: {
			primaryColor() {
				const b = this.$brand ? this.$brand() : null;
				return (b && b.primary) || '#3b82f6';
			},
		testUsers() {
			const testUser = config.login && config.login.testUser;
			if (!testUser || !testUser.show) return [];
			return testUser.list || [];
		}
	},
	created() {
		// 读取记住的账号密码
		let { login } = vk.getVuex("$user");
		if (login) {
			if (login.username) this.form.username = login.username;
			if (login.password) {
				this.form.password = login.password;
				this.checked = true;
			}
		}
	},
	methods: {
		onCheckboxChange(e) {
			let value = e.detail.value || [];
			this.checked = value.length > 0;
		},
		onAgreementChange(e) {
			let value = e.detail.value || [];
			this.form.agreement = value.length > 0;
		},
		fillTestUser(user) {
			this.form.username = user.username;
			this.form.password = user.password || '123456';
		},
		handleSubmit() {
			if (!this.form.agreement) {
				vk.toast('请同意用户协议', 'none');
				return;
			}
			if (!this.form.username || this.form.username.trim() === '') {
				vk.toast('请输入用户名', 'none');
				return;
			}
			if (!this.form.password || this.form.password.trim() === '') {
				vk.toast('请输入密码', 'none');
				return;
			}
			if (!this.form.captcha || this.form.captcha.trim() === '') {
				vk.toast('请输入验证码', 'none');
				return;
			}

			vk.userCenter.login({
				data: this.form,
				success: data => {
					// 保存记住的账号密码
					if (this.checked) {
						vk.setVuex("$user.login.username", this.form.username);
						vk.setVuex("$user.login.password", this.form.password);
					} else {
						vk.setVuex("$user.login.username", "");
						vk.setVuex("$user.login.password", "");
					}
					this.$emit('success', data);
				},
				fail: err => {
					vk.toast(err.msg || err.message || "登录失败", "none");
				}
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.form-content {
	padding: 20px 24px;
}

.field {
	margin-bottom: 16px;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.label {
	font-size: 14px;
	font-weight: 500;
	color: var(--vk-text-secondary);
	width: 70px;
	text-align: right;
	margin-right: 12px;
	flex-shrink: 0;
}

.req {
	color: #EF4444;
}

.input {
	flex: 1;
	height: 40px;
	padding-left: 12px;
	padding-right: 12px;
	font-size: 14px;
	color: var(--vk-text);
	background-color: var(--vk-bg-secondary);
	border-width: 1px;
	border-color: var(--vk-border);
	border-style: solid;
	border-radius: 8px;
}

.input:focus {
	border-color: var(--vk-primary);
	background-color: #ffffff;
}

.input-wrap {
	flex: 1;
	position: relative;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.input-wrap .input {
	flex: 1;
	padding-right: 48px;
}

.pwd-toggle {
	position: absolute;
	right: 10px;
	font-size: 12px;
	color: var(--vk-primary);
	z-index: 2;
	padding: 4px;
}

.captcha-wrapper {
	flex: 1;
}

.checkbox-row {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	margin-bottom: 16px;
	padding: 0 20px;
	box-sizing: border-box;
}

.checkbox-item {
	display: flex;
	flex-direction: row;
	align-items: center;
}

.checkbox-text {
	font-size: 13px;
	color: var(--vk-text-secondary);
	margin-left: 4px;
}

.link {
	font-size: 13px;
	color: var(--vk-primary);
	font-weight: 500;
}

.btn-primary {
	width: 100%;
	height: 44px;
	background-color: var(--vk-primary);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.demo-accounts {
	margin-top: 8px;
}

.demo-head {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 6px;
}

.demo-title {
	font-size: 12px;
	font-weight: 600;
	color: var(--vk-text-secondary);
}

.demo-hint {
	font-size: 11px;
	color: var(--vk-text-muted);
}

.demo-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 7px 10px;
	margin-bottom: 6px;
	background-color: var(--vk-bg-secondary);
	border: 1px solid var(--vk-border);
	border-radius: 6px;
}

.demo-row:active {
	background-color: var(--vk-primary-light);
	border-color: var(--vk-primary-border);
}

.demo-account {
	font-size: 13px;
	font-weight: 600;
	color: var(--vk-text);
	font-family: Menlo, Monaco, Consolas, monospace;
}

.demo-tag {
	font-size: 12px;
	color: var(--vk-primary);
	background-color: var(--vk-primary-soft);
	border-radius: 4px;
	padding: 2px 8px;
	line-height: 16px;
}

.btn-text {
	font-size: 15px;
	font-weight: 600;
	color: #ffffff;
}

@media screen and (max-width: 480px) {
	.form-content {
		padding: 16px 20px;
	}
	
	.field {
		flex-direction: column;
		align-items: flex-start;
	}
	
	.label {
		width: auto;
		text-align: left;
		margin-right: 0;
		margin-bottom: 6px;
	}
}
</style>

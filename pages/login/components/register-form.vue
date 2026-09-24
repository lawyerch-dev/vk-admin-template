<template>
	<view class="form-content">
		<view class="field">
			<text class="label">{{ $t('login.username') }}<text class="req">*</text></text>
			<input 
				class="input" 
				v-model="form.username" 
				type="text" 
				:placeholder="$t('login.usernamePlaceholder')" 
			/>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.email') }}<text class="req">*</text></text>
			<input 
				class="input" 
				v-model="form.email" 
				type="text" 
				:placeholder="$t('login.emailPlaceholder')" 
			/>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.password') }}<text class="req">*</text></text>
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
			<text class="label">{{ $t('login.confirmPassword') }}<text class="req">*</text></text>
			<view class="input-wrap">
				<input
					class="input"
					v-model="form.password2"
					:type="showPassword ? 'text' : 'password'"
					:placeholder="$t('login.passwordConfirmPlaceholder')"
				/>
				<text class="pwd-toggle" @click="showPassword = !showPassword">{{ showPassword ? $t('login.hide') : $t('login.show') }}</text>
			</view>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.captcha') }}<text class="req">*</text></text>
			<view class="captcha-wrapper">
				<uni-captcha scene="register" v-model="form.captcha" :placeholder="$t('login.captchaPlaceholder')"></uni-captcha>
			</view>
		</view>

		<view class="field" v-if="inviteCode || inviterInfo">
			<text class="label">{{ $t('login.inviter') }}</text>
			<view v-if="inviterInfo" class="inviter">
				<text>{{ inviterInfo.nickname || inviterInfo.username || $t('user.fallback') }}</text>
				<text class="badge">{{ $t('login.inviterBound') }}</text>
			</view>
			<text v-else class="inviter-code">{{ inviteCode }}</text>
		</view>

		<view class="checkbox-field">
			<checkbox-group @change="onAgreementChange">
				<checkbox value="agree" :checked="form.agreement" :color="primaryColor" />
			</checkbox-group>
			<text class="checkbox-text">{{ $t('login.agree') }} </text>
			<text class="link" @click="$emit('open-agreement')">{{ $t('login.agreement') }}</text>
		</view>

		<view class="btn-primary" @click="handleSubmit">
			<text class="btn-text">{{ loading ? $t('login.registering') : $t('login.registerSubmit') }}</text>
		</view>
	</view>
</template>

<script>
let vk = uni.vk;

export default {
	props: {
		inviteCode: {
			type: String,
			default: ''
		},
		inviterInfo: {
			type: Object,
			default: null
		}
	},
	computed: {
		primaryColor() {
			const b = this.$brand ? this.$brand() : null;
			return (b && b.primary) || '#3b82f6';
		}
	},
	data() {
		return {
			form: {
				username: "",
				email: "",
				password: "",
				password2: "",
				captcha: "",
				agreement: true
			},
			loading: false,
			showPassword: false
		}
	},
	methods: {
		onAgreementChange(e) {
			let value = e.detail.value || [];
			this.form.agreement = value.length > 0;
		},
		handleSubmit() {
			if (this.loading) return;

			const { agreement, username, email, password, password2, captcha } = this.form;
			
			if (!agreement) {
				vk.toast(this.$t("login.err.agree"), "none");
				return;
			}
			if (!username || username.trim() === "") {
				vk.toast(this.$t("login.err.username"), "none");
				return;
			}
			const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{3,32}$/;
			if (!usernameRegex.test(username)) {
				vk.toast(this.$t("login.err.usernameFormat"), "none");
				return;
			}
			if (!email || email.trim() === "") {
				vk.toast(this.$t("login.err.email"), "none");
				return;
			}
			const emailRegex = /^[1-9]\d{4,10}@qq\.com$/;
			if (!emailRegex.test(email)) {
				vk.toast(this.$t("login.err.emailFormat"), "none");
				return;
			}
			if (!vk.pubfn.test(password, "pwd")) {
				vk.toast(this.$t("login.err.pwdFormat"), "none");
				return;
			}
			if (!vk.pubfn.test(password2, "pwd")) {
				vk.toast(this.$t("login.err.pwdFormat"), "none");
				return;
			}
			if (password != password2) {
				vk.toast(this.$t("login.err.pwdMismatch"), "none");
				return;
			}
			if (!captcha || captcha.trim() === "") {
				vk.toast(this.$t("login.err.captcha"), "none");
				return;
			}

			this.loading = true;

			vk.userCenter.register({
				data: {
					username,
					email,
					password,
					captcha,
					inviteCode: this.inviteCode || undefined,
				},
				success: (data) => {
					this.loading = false;
					vk.toast(this.$t("login.toast.registerSuccess"), "success");
					// 注册成功后自动登录
					vk.userCenter.login({
						data: {
							username: this.form.username,
							password: this.form.password
						},
						success: (loginData) => {
							this.$emit('login-success', loginData);
						},
						fail: (err) => {
							// 自动登录失败，回退到手动登录
							this.$emit('success', { username: this.form.username });
						}
					});
				},
				fail: (err) => {
					this.loading = false;
					vk.toast(err.msg || err.message || this.$t("login.err.registerFailed"), "none");
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
	width: 88px;
	text-align: right;
	margin-right: 12px;
	flex-shrink: 0;
}

.req {
	color: #EF4444;
	margin-left: 2px;
	display: inline;
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
	background-color: var(--vk-bg-secondary);
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

.checkbox-field {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-bottom: 16px;
	padding: 0 20px;
	box-sizing: border-box;
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

.inviter {
	flex: 1;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.badge {
	font-size: 11px;
	color: #059669;
	background-color: var(--vk-primary-soft);
	padding: 2px 8px;
	border-radius: 4px;
	margin-left: 8px;
}

.inviter-code {
	flex: 1;
	font-size: 14px;
	color: var(--vk-text-secondary);
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

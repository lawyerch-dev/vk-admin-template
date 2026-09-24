<template>
	<view class="form-content">
		<view class="field">
			<text class="label">{{ $t('login.email') }}<text class="req">*</text></text>
			<input 
				class="input" 
				v-model="form.email" 
				type="text" 
				:placeholder="$t('login.emailLoginPlaceholder')" 
			/>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.captcha') }} <text class="req">*</text></text>
			<view class="code-row">
				<input 
					class="input code-input" 
					v-model="form.code" 
					type="number" 
					:placeholder="$t('login.emailCode')" 
					maxlength="6" 
				/>
				<view 
					:class="['btn-code', codeBtnDisabled ? 'disabled' : '']" 
					@click="sendCode"
				>
					<text class="btn-code-text">{{ codeBtnText }}</text>
				</view>
			</view>
		</view>

		<view class="field">
			<text class="label">{{ $t('login.newPassword') }}<text class="req">*</text></text>
			<view class="input-wrap">
				<input
					class="input"
					v-model="form.password"
					:type="showPassword ? 'text' : 'password'"
					:placeholder="$t('login.passwordNewPlaceholder')"
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

		<view class="btn-primary" @click="handleSubmit">
			<text class="btn-text">{{ $t('login.forgotSubmit') }}</text>
		</view>
	</view>
</template>

<script>
let vk = uni.vk;

export default {
	data() {
		return {
			form: {
				email: "",
				code: "",
				password: "",
				password2: ""
			},
			codeCountdown: 0,
			showPassword: false
		}
	},
	computed: {
		primaryColor() {
			const b = this.$brand ? this.$brand() : null;
			return (b && b.primary) || '#3b82f6';
		},
		codeBtnDisabled() {
			return this.codeCountdown > 0;
		},
		codeBtnText() {
			if (this.codeCountdown > 0) return this.codeCountdown + 's';
			return this.$t('login.getCode');
		}
	},
	methods: {
		sendCode() {
			let { email } = this.form;
			if (!email || email.trim() === '') {
				vk.toast(this.$t('login.err.email'), 'none');
				return;
			}
			const emailRegex = /^[1-9]\d{4,10}@qq\.com$/;
			if (!emailRegex.test(email)) {
				vk.toast(this.$t('login.err.emailFormat'), 'none');
				return;
			}
			if (this.codeBtnDisabled) return;
			vk.callFunction({
				url: 'user/pub/sendEmailCode',
				data: {
					email: email,
					type: 'reset-pwd',
					serviceType: 'qq',
					checkUserExist: 'exists'
				},
				loading: true,
				success: (res) => {
					vk.toast(this.$t('login.toast.codeSent'), 'success');
					this.startCountdown();
				},
				fail: (err) => {
					vk.toast(err.msg || err.message || this.$t("login.err.sendFailed"), "none");
				}
			});
		},
		startCountdown() {
			this.codeCountdown = 60;
			let timer = setInterval(() => {
				this.codeCountdown--;
				if (this.codeCountdown <= 0) {
					clearInterval(timer);
				}
			}, 1000);
		},
		handleSubmit() {
			let { email, code, password, password2 } = this.form;
			
			if (!email || email.trim() === '') {
				vk.toast(this.$t('login.err.email'), 'none');
				return;
			}
			const emailRegex = /^[1-9]\d{4,10}@qq\.com$/;
			if (!emailRegex.test(email)) {
				vk.toast(this.$t('login.err.emailFormat'), 'none');
				return;
			}
			if (!code || code.trim() === '') {
				vk.toast(this.$t('login.err.captcha'), 'none');
				return;
			}
			if (!password || password.trim() === '') {
				vk.toast(this.$t('login.err.newPassword'), 'none');
				return;
			}
			if (password.length < 6) {
				vk.toast(this.$t('login.err.pwdLength'), 'none');
				return;
			}
			if (password !== password2) {
				vk.toast(this.$t('login.err.pwdMismatch'), 'none');
				return;
			}

			vk.callFunction({
				url: 'user/pub/resetPasswordByEmail',
				data: {
					email,
					code,
					password
				},
				loading: true,
				success: (res) => {
					vk.toast(this.$t('login.toast.resetSuccess'), 'success');
					this.form = {
						email: "",
						code: "",
						password: "",
						password2: ""
					};
					this.$emit('success');
				},
				fail: (err) => {
					vk.toast(err.msg || err.message || this.$t("login.err.resetFailed"), "none");
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

.code-row {
	flex: 1;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.code-input {
	flex: 1;
	margin-right: 8px;
}

.btn-code {
	width: 110px;
	height: 40px;
	background-color: var(--vk-primary);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.btn-code.disabled {
	background-color: var(--vk-bg-muted);
}

.btn-code-text {
	font-size: 13px;
	color: #ffffff;
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

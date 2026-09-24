<template>
	<vk-data-dialog
		v-model="value.show"
		:title="page.title"
		:top="page.top"
		:width="page.width"
		mode="form"
	>
		<!-- 页面主体内容开始 -->
		<vk-data-form
			ref="form1"
			v-model="form1.data"
			:form-type="value.mode"
			:rules="form1.props.rules"
			:action="form1.props.action"
			:columns="form1.props.columns"
			:loading.sync="form1.props.loading"
			:labelWidth="form1.props.labelWidth"
			:before-action="form1.props.beforeAction"
			:show-cancel="page.showCancel"
			:cancel-text="page.cancelText"
			:submit-text="page.submitText"
			@success="onFormSuccess"
		></vk-data-form>
		<!-- 页面主体内容结束 -->
	</vk-data-dialog>
</template>

<script>
let that; // 当前页面对象
let vk; // vk实例
export default {
	props: {
		value: {
			type: Object,
			default: function() {
				return {
					show: false,
					mode: "",
					item: ""
				};
			}
		}
	},
	data: function() {
		// 组件创建时，进行数据初始化
		const t = this.$t.bind(this);
		const pwdRule = uni.vk.pubfn.validator("pwd");
		const pwdMsg = t("win.pwd.rule");
		return {
			page: {
				title: t("win.pwd.title"),
				submitText: t("win.pwd.submit"),
				cancelText: t("win.pwd.cancel"),
				showCancel: true,
				top: "14vh",
				width:"500px"
			},
			form1: {
				// 表单请求数据，此处可以设置默认值
				data: {

				},
				// 表单属性
				props: {
					// 表单请求地址
					action: "user/kh/updatePwd",
					// 表单字段显示规则
					columns: [
						{ key: "username", title: t("win.pwd.username"), type: "text", disabled:true },
						{ key: "oldPassword", title: t("win.pwd.oldPassword"), type: "password" },
						{ key: "newPassword", title: t("win.pwd.newPassword"), type: "password" },
						{ key: "newPassword2", title: t("win.pwd.newPassword2"), type: "password" },
					],
					// 表单验证规则
					rules: {
						oldPassword:[
							{ required:true, message: t("win.pwd.oldRequired"), trigger:'change' },
							{ validator: pwdRule, message: pwdMsg, trigger: 'change' }
						],
						newPassword:[
							{ required:true, message: t("win.pwd.newRequired"), trigger:'change' },
							{ validator: pwdRule, message: pwdMsg, trigger: 'change' }
						],
						newPassword2:[
							{ required:true, message: t("win.pwd.confirmRequired"), trigger:'change' },
							{ validator: pwdRule, message: pwdMsg, trigger: 'change' }
						],
					},
					labelWidth: "100px",
					beforeAction:(data) => {
						if(data.newPassword !== data.newPassword2){
							vk.toast(this.$t("win.pwd.mismatch"),"none");
							return false;
						}
					}
				}
			}
		};
	},
	mounted() {
		that = this;
		vk = that.vk;
		that.init();
	},
	methods: {
		// 初始化
		init() {
			let { value } = that;
			that._input(value);
		},
		_input(value){
			that.$emit("input", value);
		},
		// 监听 - 页面打开
		onOpen() {
			that = this;
			let { value={} } = that;
			let { item } = value;
			let userInfo = vk.getVuex("$user.userInfo");
			that.form1.data.username = userInfo.username;
		},
		// 监听 - 页面关闭
		onClose() {
			that.resetForm();
		},
		// 监听 - 提交成功后
		onFormSuccess() {
			that.close();
			that.$emit("success");
		},
		// 打开页面
		open() {
			let { value } = that;
			value.show = true;
			that._input(value);
		},
		// 关闭页面
		close() {
			let { value } = that;
			value.show = false;
			that._input(value);
		},
		// 表单重置
		resetForm() {
			that.$refs.form1.resetForm();
		},
		// 表单提交
		submitForm() {
			that.$refs.form1.submitForm();
		}
	},
	watch: {
		"value.show": {
			handler(newValue, oldValue) {
				let that = this;
				if (newValue) {
					that.onOpen();
				} else {
					that.onClose();
				}
			}
		}
	},
	// 过滤器
	filters: {

	},
	// 计算属性
	computed: {

	},
	watch: {
		"$i18n.locale"() {
			const t = this.$t.bind(this);
			this.page.title = t("win.pwd.title");
			this.page.submitText = t("win.pwd.submit");
			this.page.cancelText = t("win.pwd.cancel");
			this.form1.props.columns[0].title = t("win.pwd.username");
			this.form1.props.columns[1].title = t("win.pwd.oldPassword");
			this.form1.props.columns[2].title = t("win.pwd.newPassword");
			this.form1.props.columns[3].title = t("win.pwd.newPassword2");
		}
	}
};
</script>

<style lang="scss" scoped>

</style>

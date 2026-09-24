<template>
	<vk-data-dialog
		v-model="value.show"
		:title="page.title"
		:top="page.top"
		:width="page.width"
		mode="form"
	>
		<view class="page-body">
			<!-- 自定义按钮区域开始 -->
			<view class="btns-box">
				<el-row>
					<el-button size="small" icon="el-icon-delete" @click="clearErrorLog">{{ $t('win.err.clear') }}</el-button>
				</el-row>
			</view>
			<!-- 自定义按钮区域结束 -->

			<!-- 表格组件开始 -->
			<vk-data-table
				ref="table1"
				:data="vk.getVuex('$error.logs')"
				:columns="table1.columns"
				:row-no="true"
				:height="600"
				:custom-right-btns="rightBtns"
				@custom-right-btns="customRightBtns"
			></vk-data-table>
			<!-- 表格组件结束 -->
		</view>
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
		return {
			page: {
				title: t("win.err.title"),
				top: "7vh",
				width: "1250px"
			},
			table1: {
				show: false,
				columns: [
					{ key: "info", title: t("win.err.colInfo"), type: "text", width: 160 },
					{ key: "route", title: t("win.err.colRoute"), type: "text", width: 240 },
					{ key: "err", title: t("win.err.colErr"), type: "text", minWidth: 260 },
					{ key: "time", title: t("win.err.colTimeDiff"), type: "dateDiff", width: 120 },
					{ key: "timeStr", title: t("win.err.colTime"), type: "text", width: 120 }
				]
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
		_input(value) {
			that.$emit("input", value);
		},
		// 清除错误日志
		clearErrorLog() {
			let that = this;
			let { vk } = that;
			vk.vuex.dispatch("$error/clear");
			that.close();
		},
		// 错误日志表格的右侧自定义按钮点击事件
		customRightBtns(row, btn) {
			const key = btn.key || btn.title;
			if (key === "baidu" || btn.title === this.$t("win.err.baidu")) {
				window.open(`https://www.baidu.com/baidu?wd=${row.err}`);
			} else if (key === "google" || btn.title === this.$t("win.err.google")) {
				window.open(`https://www.google.com/search?q=${row.err}`);
			}
		},
		// 监听 - 页面打开
		onOpen() {
			that = this;
		},
		// 监听 - 页面关闭
		onClose() {},
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
		},
		"$i18n.locale"() {
			const t = this.$t.bind(this);
			this.page.title = t("win.err.title");
			const cols = this.table1.columns;
			cols[0].title = t("win.err.colInfo");
			cols[1].title = t("win.err.colRoute");
			cols[2].title = t("win.err.colErr");
			cols[3].title = t("win.err.colTimeDiff");
			cols[4].title = t("win.err.colTime");
		}
	},
	// 过滤器
	filters: {},
	// 计算属性
	computed: {
		rightBtns() {
			return [
				{ key: "baidu", title: this.$t("win.err.baidu"), icon: "el-icon-document" },
				{ key: "google", title: this.$t("win.err.google"), icon: "el-icon-document" }
			];
		}
	}
};
</script>

<style lang="scss" scoped></style>

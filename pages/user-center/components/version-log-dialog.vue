<template>
	<el-dialog
		:visible.sync="dialogVisible"
		:title="title"
		width="600px"
		class="version-log-dialog"
		@close="dialogVisible = false"
	>
		<view class="version-timeline">
			<view
				v-for="(log, index) in logs"
				:key="index"
				class="version-item"
				:class="{ 'is-latest': index === 0 }"
			>
				<view class="version-header">
					<view class="version-info">
						<text class="version-number">{{ log.version }}</text>
						<el-tag v-if="index === 0" type="success" size="mini" effect="dark">{{ $t('userCenter.latestVersion') }}</el-tag>
					</view>
					<text class="version-date">{{ formatDate(log.date) }}</text>
				</view>
				<view class="version-content">
					<view class="update-log" v-html="formatLog(log.log)"></view>
				</view>
				<view v-if="log.download_url" class="version-download">
					<el-button
						type="primary"
						size="small"
						icon="el-icon-download"
						@click="$emit('download', log.download_url)"
					>{{ $t('userCenter.downloadVersion', { version: log.version }) }}</el-button>
				</view>
			</view>
		</view>
	</el-dialog>
</template>

<script>
import { formatDate, formatLog } from '../user-center-config.js';

export default {
	props: {
		show: { type: Boolean, default: false },
		title: { type: String, default: '' },
		logs: { type: Array, default: () => [] }
	},
	computed: {
		dialogVisible: {
			get() { return this.show; },
			set(val) { this.$emit('update:show', val); }
		}
	},
	methods: {
		formatDate,
		formatLog
	}
};
</script>

<style lang="scss" scoped>
::v-deep .version-log-dialog {
	.el-dialog__body {
		padding: 0 20px 20px;
		max-height: 60vh;
		overflow-y: auto;
	}
}

.version-timeline {
	.version-item {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		background: var(--vk-bg-muted, #f1f5f9);
		border-radius: 8px;
		border-left: 4px solid var(--vk-border, #dcdfe6);

		&.is-latest {
			background: linear-gradient(135deg, var(--vk-bg-muted, #f1f5f9) 0%, var(--vk-primary-soft, #ecfeff) 100%);
			border-left-color: var(--vk-success, #67c23a);
		}

		.version-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 15px;
			padding-bottom: 10px;
			border-bottom: 1px solid var(--vk-border, #e2e8f0);

			.version-info {
				display: flex;
				align-items: center;
				gap: 10px;

				.version-number {
					font-size: 18px;
					font-weight: bold;
					color: var(--vk-text, #1e293b);
				}
			}

			.version-date {
				font-size: 13px;
				color: var(--vk-text-secondary, #64748b);
			}
		}

		.version-content {
			margin-bottom: 15px;

			::v-deep .update-log {
				.update-list {
					list-style: none;
					padding: 0;
					margin: 0;

					li {
						padding: 8px 0;
						line-height: 1.6;
						color: var(--vk-text-secondary, #64748b);
						font-size: 14px;

						&.feature {
							color: var(--vk-primary, #3b82f6);
						}

						&.bugfix {
							color: var(--vk-danger, #f56c6c);
						}

						&.optimization {
							color: var(--vk-warning, #e6a23c);
						}

						&.deprecated {
							color: var(--vk-text-muted, #94a3b8);
							text-decoration: line-through;
						}
					}

					p {
						margin: 8px 0;
						line-height: 1.6;
						color: var(--vk-text-secondary, #64748b);
					}
				}
			}
		}

		.version-download {
			text-align: right;
		}
	}
}
</style>

<template>
	<vk-data-table
		ref="table"
		:action="action"
		:columns="columns"
		:row-no="true"
		:pagination="true"
	>
		<!-- 卡密列 -->
		<template v-slot:card_code="{ row }">
			<view class="card-code-cell">
				<text class="code-text">{{ row.card_code }}</text>
				<el-button
					type="text"
					icon="el-icon-copy-document"
					size="mini"
					@click="$emit('copy', row.card_code)"
					style="margin-left: 8px;"
				>{{ $t('userCenter.copy') }}</el-button>
			</view>
		</template>

		<!-- 状态列 -->
		<template v-slot:status="{ row }">
			<el-tag :type="statusTypeMap[row.status] || 'info'" size="small">
				{{ statusText(row.status) }}
			</el-tag>
		</template>

		<!-- 产品类型列 -->
		<template v-slot:product_type="{ row }">
			<el-tag :type="row.product_type === 'software' ? 'primary' : 'success'" size="small">
				{{ productTypeText(row.product_type) }}
			</el-tag>
		</template>

		<!-- 下载地址列 -->
		<template v-slot:download_url="{ row }">
			<view class="download-url-cell">
				<view v-if="row.download_url" class="download-actions">
					<el-button type="text" icon="el-icon-download" size="mini" @click="$emit('download', row.download_url)">{{ $t('userCenter.download') }}</el-button>
					<el-button type="text" icon="el-icon-copy-document" size="mini" @click="$emit('copy', row.download_url)">{{ $t('userCenter.copyLink') }}</el-button>
				</view>
				<text v-else class="empty-dash">-</text>
				<view v-if="row.latest_version" class="version-row">
					<el-tag size="mini" type="success">{{ row.latest_version }}</el-tag>
					<el-button
						v-if="row.version_logs && row.version_logs.length > 0"
						type="text"
						size="mini"
						@click="$emit('show-version-logs', row)"
						style="padding: 0 5px;"
					>{{ $t('userCenter.viewUpdates') }}</el-button>
				</view>
			</view>
		</template>
	</vk-data-table>
</template>

<script>
import {
	cardsTableColumns,
	statusTypeMap,
	statusTextKeyMap,
	productTypeKeyMap
} from '../user-center-config.js';

export default {
	data() {
		return {
			action: "admin/card/kh/getMyCards",
			statusTypeMap
		};
	},
	computed: {
		columns() {
			return cardsTableColumns.map(col => ({
				...col,
				title: this.$t(col.titleKey)
			}));
		}
	},
	methods: {
		refresh() {
			this.$refs.table && this.$refs.table.refresh();
		},
		statusText(status) {
			const key = statusTextKeyMap[status];
			return key ? this.$t(key) : this.$t('userCenter.unknown');
		},
		productTypeText(type) {
			const key = productTypeKeyMap[type];
			return key ? this.$t(key) : (type || this.$t('userCenter.unknown'));
		}
	}
};
</script>

<style lang="scss" scoped>
.download-url-cell {
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.download-actions {
	display: flex;
	gap: 5px;
}

.empty-dash {
	color: var(--vk-text-secondary, #64748b);
}

.version-row {
	margin-top: 5px;
}

.card-code-cell {
	display: flex;
	align-items: center;

	.code-text {
		font-family: 'Courier New', monospace;
		color: var(--vk-text, #1e293b);
	}
}
</style>

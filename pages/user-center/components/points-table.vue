<template>
	<vk-data-table
		ref="table"
		:action="action"
		:columns="columns"
		:row-no="true"
		:pagination="true"
	>
		<!-- 类型列 -->
		<template v-slot:type="{ row }">
			<el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
				{{ row.type === 'income' ? $t('userCenter.income') : $t('userCenter.expense') }}
			</el-tag>
		</template>

		<!-- 积分数量列 -->
		<template v-slot:amount="{ row }">
			<text :style="{ color: row.amount > 0 ? 'var(--vk-success, #67c23a)' : 'var(--vk-danger, #f56c6c)' }">
				{{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
			</text>
		</template>

		<!-- 来源列 -->
		<template v-slot:source="{ row }">
			<el-tag size="small" :type="sourceTypeMap[row.source] || ''">
				{{ sourceText(row.source) }}
			</el-tag>
		</template>
	</vk-data-table>
</template>

<script>
import {
	pointsTableColumns,
	sourceTypeMap,
	sourceTextKeyMap
} from '../user-center-config.js';

export default {
	data() {
		return {
			action: "admin/points/kh/getLog",
			sourceTypeMap
		};
	},
	computed: {
		columns() {
			return pointsTableColumns.map(col => ({
				...col,
				title: this.$t(col.titleKey)
			}));
		}
	},
	methods: {
		refresh() {
			this.$refs.table && this.$refs.table.refresh();
		},
		sourceText(source) {
			const key = sourceTextKeyMap[source];
			return key ? this.$t(key) : (source || this.$t('userCenter.unknown'));
		}
	}
};
</script>

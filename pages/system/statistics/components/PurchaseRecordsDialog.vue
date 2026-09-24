<template>
  <el-dialog
    :title="$t('admin.stats.purchase.title')"
    :visible.sync="visible"
    width="1400px"
    :close-on-click-modal="false"
  >
    <!-- 查询表单 -->
    <el-form :inline="true" :model="queryForm" class="purchase-query-form">
      <el-form-item :label="$t('admin.stats.purchase.userId')">
        <el-input
          v-model="queryForm.user_id"
          :placeholder="$t('admin.stats.purchase.userIdPlaceholder')"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item :label="$t('admin.stats.purchase.productId')">
        <el-input
          v-model="queryForm.product_id"
          :placeholder="$t('admin.stats.purchase.productIdPlaceholder')"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadPurchaseRecords" :loading="loading">{{ $t('admin.common.search') }}</el-button>
        <el-button @click="resetQuery">{{ $t('admin.common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <!-- 筛选选项 -->
    <div v-if="allData && allData.length > 0" style="margin-bottom: 15px; padding: 10px; background: var(--vk-bg-muted, #f5f7fa); border-radius: 4px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <el-checkbox v-model="filterRemarkMismatch" @change="filterRecords">
            {{ $t('admin.stats.purchase.filterMismatch') }}
          </el-checkbox>
          <span v-if="filterRemarkMismatch" style="margin-left: 10px; color: #E6A23C; font-size: 12px; font-weight: 500;">
            {{ $t('admin.stats.purchase.filteredCount', { n: data.length, total: allData.length }) }}
          </span>
        </div>
        <el-button
          v-if="filterRemarkMismatch && data.length > 0"
          type="primary"
          size="small"
          :loading="fixing"
          @click="fixProductNames"
        >
          <i class="el-icon-edit"></i> {{ $t('admin.stats.purchase.fixNames') }}
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="detail-loading">
      <i class="el-icon-loading"></i> {{ $t('admin.stats.order.searching') }}
    </div>
    <div v-else-if="data && data.length > 0">
      <div class="check-summary" style="margin-bottom: 15px;">
        <div class="summary-item">
          <span class="summary-label">{{ $t('admin.stats.purchase.found') }}</span>
          <span class="summary-value">{{ $t('admin.stats.purchase.foundCount', { n: total }) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ $t('admin.stats.purchase.issues') }}</span>
          <span class="summary-value" style="color: #E6A23C;">
            {{ $t('admin.stats.purchase.issueCount', { n: data.filter(r => r.has_issue).length }) }}
          </span>
        </div>
      </div>
      <el-table
        :data="data"
        border
        stripe
        size="small"
        max-height="500"
      >
        <el-table-column prop="card_add_time_str" :label="$t('admin.stats.purchase.colBuyTime')" width="180" fixed="left"></el-table-column>
        <el-table-column prop="user_name" :label="$t('admin.stats.purchase.colUser')" width="120">
          <template slot-scope="scope">
            <div>{{ scope.row.user_name }}</div>
            <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b);">{{ scope.row.user_username }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="card_code" :label="$t('admin.stats.purchase.colCard')" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column :label="$t('admin.stats.purchase.colCardRecord')" width="180">
          <template slot-scope="scope">
            <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b);">{{ $t('admin.stats.purchase.productId') }}:</div>
            <div>{{ scope.row.card_product_id || '-' }}</div>
            <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b); margin-top: 4px;">{{ $t('admin.stats.purchase.productName') }}:</div>
            <div :style="{ color: scope.row.has_issue && scope.row.card_product_name !== scope.row.correct_product_name ? '#F56C6C' : '' }">
              {{ scope.row.card_product_name || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.stats.purchase.colLogRecord')" width="180">
          <template slot-scope="scope">
            <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b);">{{ $t('admin.stats.purchase.productId') }}:</div>
            <div :style="{ color: scope.row.has_issue && scope.row.card_product_id !== scope.row.points_log_product_id ? '#F56C6C' : '' }">
              {{ scope.row.points_log_product_id || '-' }}
            </div>
            <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b); margin-top: 4px;">{{ $t('admin.stats.purchase.productName') }}:</div>
            <div :style="{ color: scope.row.has_issue && scope.row.points_log_product_name && scope.row.points_log_product_name !== scope.row.points_log_product_name_from_table ? '#F56C6C' : '' }">
              {{ scope.row.points_log_product_name || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="correct_product_name" :label="$t('admin.stats.purchase.colCorrectName')" width="200">
          <template slot-scope="scope">
            <span style="color: #67C23A; font-weight: 500;">{{ scope.row.correct_product_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="points_log_product_name_from_remark" :label="$t('admin.stats.purchase.colRemarkName')" width="200">
          <template slot-scope="scope">
            <span :style="{ color: scope.row.has_issue && scope.row.points_log_product_name_from_remark && scope.row.points_log_product_name_from_remark !== scope.row.points_log_product_name ? '#F56C6C' : '' }">
              {{ scope.row.points_log_product_name_from_remark || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="points_log_remark" :label="$t('admin.stats.purchase.colRemark')" min-width="250" show-overflow-tooltip></el-table-column>
      </el-table>
    </div>
    <div v-else-if="!loading && searched" class="detail-empty">
      {{ $t('admin.stats.purchase.empty') }}
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ $t('admin.common.close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
let vk = uni.vk;

export default {
  name: 'PurchaseRecordsDialog',
  data() {
    return {
      visible: false,
      loading: false,
      fixing: false,
      searched: false,
      data: [],
      allData: [],
      total: 0,
      filterRemarkMismatch: false,
      queryForm: {
        user_id: '',
        product_id: '',
      },
    };
  },
  methods: {
    open(queryParams) {
      // 从外部搜索栏传入初始查询参数
      if (queryParams) {
        this.queryForm.user_id = queryParams.user_id || '';
        this.queryForm.product_id = queryParams.product_id || '';
      }
      this.visible = true;
      this.searched = false;
      if (queryParams && (queryParams.user_id || queryParams.product_id)) {
        this.loadPurchaseRecords();
      }
    },
    async loadPurchaseRecords() {
      const user_id = (this.queryForm.user_id || '').trim();
      const product_id = (this.queryForm.product_id || '').trim();
      if (!user_id && !product_id) {
        vk.toast(this.$t('admin.stats.purchase.errNeedQuery'), 'none');
        return;
      }
      this.loading = true;
      this.searched = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/getPurchaseRecords',
          data: {
            user_id: user_id || '',
            product_id: product_id || '',
            pageIndex: 1,
            pageSize: 100,
          },
        });
        if (res.code === 0) {
          this.allData = res.rows || [];
          this.total = res.total || 0;
          this.filterRecords();
          vk.toast(res.msg || this.$t('admin.stats.purchase.queryDone'), 'success');
        } else {
          vk.toast(res.msg || this.$t('admin.stats.order.queryFailed'), 'none');
        }
      } catch (err) {
        console.error('查询购买记录失败：', err);
        vk.toast(this.$t('admin.stats.order.queryFailed'), 'none');
      } finally {
        this.loading = false;
      }
    },
    filterRecords() {
      if (!this.filterRemarkMismatch) {
        this.data = this.allData;
      } else {
        this.data = this.allData.filter(record => {
          const correctName = record.points_log_product_name_from_table || record.correct_product_name || '';
          const remarkName = record.points_log_product_name_from_remark || '';
          return correctName && remarkName && correctName !== remarkName;
        });
      }
    },
    resetQuery() {
      this.queryForm = { user_id: '', product_id: '' };
      this.data = [];
      this.allData = [];
      this.total = 0;
      this.filterRemarkMismatch = false;
      this.searched = false;
    },
    async fixProductNames() {
      const recordsToFix = this.data.filter(record => {
        const correctName = record.points_log_product_name_from_table || record.correct_product_name || '';
        const remarkName = record.points_log_product_name_from_remark || '';
        return correctName && remarkName && correctName !== remarkName;
      });
      if (recordsToFix.length === 0) {
        vk.toast(this.$t('admin.stats.purchase.nothingToFix'), 'none');
        return;
      }
      try {
        await this.$confirm(
          this.$t('admin.stats.purchase.fixConfirm', { n: recordsToFix.length }),
          this.$t('admin.stats.purchase.fixTitle'),
          {
            confirmButtonText: this.$t('admin.common.ok'),
            cancelButtonText: this.$t('admin.common.cancel'),
            type: 'warning',
          }
        );
      } catch {
        return;
      }
      this.fixing = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/fixProductNames',
          data: {
            records: recordsToFix.map(record => ({
              card_id: record.card_id,
              points_log_id: record.points_log_id,
              correct_product_id: record.points_log_product_id || record.correct_product_id,
              correct_product_name: record.points_log_product_name_from_table || record.correct_product_name,
            })),
          },
        });
        if (res.code === 0) {
          vk.toast(res.msg || this.$t('admin.stats.purchase.fixSuccess'), 'success');
          await this.loadPurchaseRecords();
        } else {
          vk.toast(res.msg || this.$t('admin.stats.purchase.fixFailed'), 'none');
        }
      } catch (err) {
        console.error('修正名称失败：', err);
        vk.toast(this.$t('admin.stats.purchase.fixFailed') + '：' + (err.message || this.$t('admin.common.unknownError')), 'none');
      } finally {
        this.fixing = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.detail-loading {
  text-align: center;
  padding: 40px;
  color: var(--vk-text-secondary, #64748b);
}

.detail-empty {
  text-align: center;
  padding: 40px;
  color: var(--vk-text-secondary, #64748b);
}

.check-summary {
  display: flex;
  gap: 30px;
  padding: 15px;
  background: var(--vk-bg-muted, #f5f7fa);
  border-radius: 4px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
}

.summary-label {
  color: var(--vk-text-secondary, #64748b);
  margin-right: 8px;
}

.summary-value {
  font-weight: 500;
  color: var(--vk-text);
}

.purchase-query-form {
  padding: 15px;
  background: var(--vk-bg-muted, #f5f7fa);
  border-radius: 4px;
}
</style>

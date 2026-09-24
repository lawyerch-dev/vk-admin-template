<template>
  <el-dialog
    :title="$t('admin.stats.userDetail.title')"
    :visible.sync="visible"
    width="70%"
    :close-on-click-modal="false"
    class="detail-dialog"
    top="10vh"
  >
    <div class="detail-dialog-body" style="height: 65vh; overflow-y: auto; display: flex; flex-direction: column;">
      <div v-if="loading" class="detail-loading">
        <i class="el-icon-loading"></i> {{ $t('admin.common.loading') }}
      </div>
      <div v-else-if="detailList && detailList.length > 0">
        <!-- 重复订单号告警 -->
        <el-alert
          v-if="duplicateCount > 0"
          :title="$t('admin.stats.userDetail.duplicateAlert', { n: duplicateCount })"
          type="warning"
          show-icon
          style="margin-bottom: 15px;"
        >
          <div style="margin-top: 5px;">
            {{ $t('admin.stats.userDetail.duplicateOrders') }}{{ duplicateOrders.map(d => `${d.order_id}(${d.count})`).join('、') }}
          </div>
        </el-alert>
        <div class="detail-summary">
          <div class="summary-item">
            <span class="summary-label">{{ $t('admin.stats.userDetail.user') }}</span>
            <span class="summary-value">{{ userName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ $t('admin.stats.userDetail.userId') }}</span>
            <span class="summary-value">{{ userId }}</span>
          </div>
        </div>
        <el-table :data="detailList" border stripe size="small" style="margin-top: 20px; flex: 1;">
          <el-table-column prop="_add_time_str" :label="$t('admin.stats.userDetail.colTime')" width="180"></el-table-column>
          <el-table-column prop="type_text" :label="$t('admin.stats.userDetail.colType')" width="80">
            <template slot-scope="scope">
              <el-tag :type="scope.row.type === 'income' ? 'success' : 'danger'" size="mini">
                {{ scope.row.type_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" :label="$t('admin.stats.userDetail.colAmount')" width="100" align="right">
            <template slot-scope="scope">
              <span :style="{ color: scope.row.amount > 0 ? '#67C23A' : '#F56C6C', fontWeight: '500' }">
                {{ scope.row.amount > 0 ? '+' : '' }}{{ scope.row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balance" :label="$t('admin.stats.userDetail.colBalance')" width="120" align="right"></el-table-column>
          <el-table-column prop="source_text" :label="$t('admin.stats.userDetail.colSource')" width="120"></el-table-column>
          <el-table-column prop="order_id" :label="$t('admin.stats.userDetail.colOrderId')" width="180">
            <template slot-scope="scope">
              <span v-if="scope.row.order_id" style="color: var(--vk-primary, #409EFF); font-family: monospace;">{{ scope.row.order_id }}</span>
              <span v-else style="color: var(--vk-text-muted);">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="$t('admin.stats.userDetail.colRemark')" min-width="200"></el-table-column>
        </el-table>
      </div>
      <div v-else class="detail-empty">
        {{ $t('admin.stats.userDetail.empty') }}
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ $t('admin.common.close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
let vk = uni.vk;

export default {
  name: 'UserDetailDialog',
  data() {
    return {
      visible: false,
      loading: false,
      userId: '',
      userName: '',
      detailList: [],
      duplicateOrders: [],
      duplicateCount: 0,
    };
  },
  methods: {
    open(row) {
      this.visible = true;
      this.userId = row.user_id;
      this.userName = row.user_display_name;
      this.detailList = [];
      this.duplicateOrders = [];
      this.duplicateCount = 0;
      this.loadDetail();
    },
    async loadDetail() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/statistics/sys/getUserPointsDetail',
          data: {
            user_id: this.userId,
            pageSize: 200,
          },
        });
        if (res.code === 0) {
          this.detailList = res.rows || [];
          this.checkDuplicateOrders();
        } else {
          vk.toast(res.msg || this.$t('admin.common.loadFailed'), 'none');
          this.detailList = [];
          this.duplicateOrders = [];
          this.duplicateCount = 0;
        }
      } catch (err) {
        console.error('加载用户详情失败：', err);
        vk.toast(this.$t('admin.common.loadFailed'), 'none');
        this.detailList = [];
        this.duplicateOrders = [];
        this.duplicateCount = 0;
      } finally {
        this.loading = false;
      }
    },
    refresh() {
      if (this.userId) {
        this.loadDetail();
      }
    },
    checkDuplicateOrders() {
      const orderCount = {};
      this.detailList.forEach(item => {
        if (item.order_id) {
          orderCount[item.order_id] = (orderCount[item.order_id] || 0) + 1;
        }
      });
      const duplicates = [];
      let totalDuplicateCount = 0;
      for (const [orderId, count] of Object.entries(orderCount)) {
        if (count > 1) {
          duplicates.push({ order_id: orderId, count });
          totalDuplicateCount += count;
        }
      }
      this.duplicateOrders = duplicates;
      this.duplicateCount = totalDuplicateCount;
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

.detail-summary {
  display: flex;
  gap: 30px;
  padding: 15px;
  background: var(--vk-bg-muted, #f5f7fa);
  border-radius: 4px;
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
</style>

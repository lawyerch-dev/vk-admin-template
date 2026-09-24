<template>
  <view class="rebate-records">
    <el-card>
      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm" size="small">
          <el-form-item :label="$t('admin.records.colInviter')">
            <el-input v-model="filterForm.inviter_id" :placeholder="$t('admin.records.inviterPlaceholder')" clearable></el-input>
          </el-form-item>
          <el-form-item :label="$t('admin.records.colInvitee')">
            <el-input v-model="filterForm.invitee_id" :placeholder="$t('admin.records.inviteePlaceholder')" clearable></el-input>
          </el-form-item>
          <el-form-item :label="$t('admin.records.dateRange')">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              :range-separator="$t('admin.records.rangeTo')"
              :start-placeholder="$t('admin.records.startPlaceholder')"
              :end-placeholder="$t('admin.records.endPlaceholder')"
              value-format="timestamp"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="search">{{ $t('admin.common.search') }}</el-button>
            <el-button icon="el-icon-refresh" @click="resetFilter">{{ $t('admin.common.reset') }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="label">{{ $t('admin.records.statTotal') }}</span>
          <span class="value">{{ stats.totalCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">{{ $t('admin.records.statRebate') }}</span>
          <span class="value success">{{ stats.totalRebatePoints }}</span>
        </div>
        <div class="stat-item">
          <span class="label">{{ $t('admin.records.statPay') }}</span>
          <span class="value warning">{{ stats.totalPayAmount }}</span>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="inviter_id" :label="$t('admin.records.colInviter')" width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="invitee_id" :label="$t('admin.records.colInvitee')" width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="invitee_nickname" :label="$t('admin.records.colInviteeName')" width="120"></el-table-column>
        <el-table-column prop="order_id" :label="$t('admin.records.colOrderId')" width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="pay_amount" :label="$t('admin.records.colPayAmount')" width="120" align="right">
          <template slot-scope="{ row }">
            {{ row.pay_amount }}
          </template>
        </el-table-column>
        <el-table-column prop="rebate_tier" :label="$t('admin.rebate.colLevel')" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag size="small">Tier {{ row.rebate_tier }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rebate_rate" :label="$t('admin.rebate.colRate')" width="100" align="center">
          <template slot-scope="{ row }">
            {{ row.rebate_rate }}%
          </template>
        </el-table-column>
        <el-table-column prop="rebate_points" :label="$t('admin.records.colRebatePoints')" width="120" align="right">
          <template slot-scope="{ row }">
            <span style="color: #67C23A; font-weight: bold;">+{{ row.rebate_points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inviter_total_consume" :label="$t('admin.records.colInviterConsume')" width="120" align="right">
          <template slot-scope="{ row }">
            {{ row.inviter_total_consume || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="_add_time" :label="$t('admin.records.colCreateTime')" width="180">
          <template slot-scope="{ row }">
            {{ formatTime(row._add_time) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageIndex"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        ></el-pagination>
      </div>
    </el-card>
  </view>
</template>

<script>
let that;
let vk;

export default {
  data() {
    return {
      filterForm: {
        inviter_id: '',
        invitee_id: '',
        dateRange: null
      },
      tableData: [],
      loading: false,
      pageIndex: 1,
      pageSize: 20,
      total: 0,
      stats: {
        totalCount: 0,
        totalRebatePoints: 0,
        totalPayAmount: 0
      }
    };
  },
  onLoad() {
    that = this;
    vk = that.vk;
    that.loadData();
  },
  methods: {
    // 加载数据
    loadData() {
      that.loading = true;

      const params = {
        pageIndex: that.pageIndex,
        pageSize: that.pageSize
      };

      if (that.filterForm.inviter_id) {
        params.inviter_id = that.filterForm.inviter_id;
      }
      if (that.filterForm.invitee_id) {
        params.invitee_id = that.filterForm.invitee_id;
      }
      if (that.filterForm.dateRange && that.filterForm.dateRange.length === 2) {
        params.start_time = that.filterForm.dateRange[0];
        params.end_time = that.filterForm.dateRange[1] + 86400000 - 1; // 结束日期加一天
      }

      vk.callFunction({
        url: 'admin/rebate/sys/getRecords',
        data: params,
        success: (data) => {
          that.tableData = data.data.rows || [];
          that.total = data.data.total || 0;
          that.stats = data.data.stats || {
            totalCount: 0,
            totalRebatePoints: 0,
            totalPayAmount: 0
          };
        },
        fail: (err) => {
          console.error('加载数据失败：', err);
          vk.toast(err.msg || err.message || that.$t('admin.common.loadFailed'), 'none');
        },
        complete: () => {
          that.loading = false;
        }
      });
    },
    // 搜索
    search() {
      that.pageIndex = 1;
      that.loadData();
    },
    // 重置筛选
    resetFilter() {
      that.filterForm = {
        inviter_id: '',
        invitee_id: '',
        dateRange: null
      };
      that.search();
    },
    // 分页大小变化
    handleSizeChange(val) {
      that.pageSize = val;
      that.pageIndex = 1;
      that.loadData();
    },
    // 页码变化
    handleCurrentChange(val) {
      that.pageIndex = val;
      that.loadData();
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '-';
      return vk.pubfn.timeFormat(timestamp, 'yyyy-MM-dd hh:mm:ss');
    }
  }
};
</script>

<style lang="scss" scoped>
.rebate-records {
  padding: 20px;
}

.filter-bar {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--vk-border);
}

.stats-bar {
  display: flex;
  gap: 40px;
  padding: 15px 20px;
  background: var(--vk-bg-muted, #f5f7fa);
  border-radius: 4px;
  margin-bottom: 20px;

  .stat-item {
    display: flex;
    align-items: baseline;
    gap: 5px;

    .label {
      font-size: 14px;
      color: var(--vk-text);
    }

    .value {
      font-size: 20px;
      font-weight: bold;
      color: var(--vk-text);

      &.success {
        color: #67C23A;
      }

      &.warning {
        color: #E6A23C;
      }
    }
  }
}

.pagination-bar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

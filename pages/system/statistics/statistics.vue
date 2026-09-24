<template>
  <view class="page-body">
    <!-- 统计卡片 -->
    <StatsCards :items="statsCardItems" :stats="summaryStats" />

    <!-- 购买记录搜索区域 -->
    <el-card class="tools-card">
      <div class="tools-header">
        <span class="tools-title">{{ $t('admin.stats.queryTitle') }}</span>
        <!-- 管理员工具按钮 -->
        <template v-if="isAdmin">
          <el-button
            type="primary"
            size="small"
            style="margin-left: 20px;"
            @click="$refs.checkOrderDialog.open()"
          >
            {{ $t('admin.stats.checkOrder') }}
          </el-button>
          <el-button
            type="danger"
            size="small"
            style="margin-left: 10px;"
            @click="$refs.blacklistDialog.open()"
          >
            {{ $t('admin.stats.blacklistManage') }}
          </el-button>
          <el-dropdown
            split-button
            type="warning"
            size="small"
            style="margin-left: 10px;"
            @click="scanDuplicateRecharge"
            @command="handleDataFixCommand"
          >
            <span>{{ $t('admin.stats.dataFix') }}</span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="scanDuplicate">{{ $t('admin.stats.scanDuplicate') }}</el-dropdown-item>
              <el-dropdown-item command="checkNegative">{{ $t('admin.stats.checkNegative') }}</el-dropdown-item>
              <el-dropdown-item command="removeDuplicateCards" divided>{{ $t('admin.stats.cleanCards') }}</el-dropdown-item>
              <el-dropdown-item command="viewCardStats">{{ $t('admin.stats.cardStats') }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </div>
      <el-form :inline="true" :model="searchForm" class="purchase-query-form">
        <el-form-item :label="$t('admin.stats.userId')">
          <el-input
            v-model="searchForm.user_id"
            :placeholder="$t('admin.stats.userIdPlaceholder')"
            clearable
            style="width: 200px;"
            @keyup.enter.native="searchPurchaseRecords"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('admin.stats.productId')">
          <el-input
            v-model="searchForm.product_id"
            :placeholder="$t('admin.stats.productIdPlaceholder')"
            clearable
            style="width: 200px;"
            @keyup.enter.native="searchPurchaseRecords"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchPurchaseRecords">{{ $t('admin.common.search') }}</el-button>
          <el-button @click="resetSearchForm">{{ $t('admin.common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户积分汇总表格 -->
    <vk-data-table
      ref="table1"
      :action="table1.action"
      :columns="table1.columns"
      :row-no="true"
      :pagination="true"
      :page-size="10"
      :custom-right-btns="table1.customRightBtns"
      @success="onTableSuccess"
    >
      <!-- 用户名列 -->
      <template v-slot:user_info="{ row }">
        <div>
          <div style="font-weight: 500;">{{ row.user_display_name }}</div>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 4px;">
            ID: {{ row.user_id }}
          </div>
        </div>
      </template>
      <!-- 绑定机器数列 -->
      <template v-slot:total_machines="{ row }">
        <span style="color: #F56C6C; font-weight: 500;">{{ $t('admin.stats.machineUnit', { n: row.total_machines || 0 }) }}</span>
      </template>
    </vk-data-table>

    <!-- 弹窗组件 -->
    <UserDetailDialog ref="userDetailDialog" />
    <RechargeDialog ref="rechargeDialog" @refresh="handleRefresh" />
    <CheckOrderDialog ref="checkOrderDialog" @refresh="handleRefresh" />
    <RemoveDuplicateDialog ref="removeDuplicateDialog" />
    <PurchaseRecordsDialog ref="purchaseRecordsDialog" />
    <BlacklistDialog ref="blacklistDialog" />
  </view>
</template>

<script>
import StatsCards from '@/components/stats-cards/index.vue';
import UserDetailDialog from './components/UserDetailDialog.vue';
import RechargeDialog from './components/RechargeDialog.vue';
import CheckOrderDialog from './components/CheckOrderDialog.vue';
import RemoveDuplicateDialog from './components/RemoveDuplicateDialog.vue';
import PurchaseRecordsDialog from './components/PurchaseRecordsDialog.vue';
import BlacklistDialog from './components/BlacklistDialog.vue';
import { formatDateTime } from './utils/format.js';

let that;
let vk = uni.vk;

export default {
  components: {
    StatsCards,
    UserDetailDialog,
    RechargeDialog,
    CheckOrderDialog,
    RemoveDuplicateDialog,
    PurchaseRecordsDialog,
    BlacklistDialog,
  },
  data() {
    return {
      isAdmin: false,
      fixLoading: false,
      // 搜索栏表单
      searchForm: {
        user_id: '',
        product_id: '',
      },
      // 统计卡片配置
      statsCardItems: [
        { key: 'totalUsers', label: this.$t('admin.stats.cardUsers'), color: '' },
        { key: 'totalPoints', label: this.$t('admin.stats.cardPoints'), color: '#67C23A', suffix: ' ' + this.$t('admin.common.points') },
        { key: 'totalConsumed', label: this.$t('admin.stats.cardConsumed'), color: '#E6A23C', suffix: ' ' + this.$t('admin.common.points') },
        { key: 'totalAvailable', label: this.$t('admin.stats.cardAvailable'), color: '#409EFF', suffix: ' ' + this.$t('admin.common.points') },
        { key: 'totalMachines', label: this.$t('admin.stats.cardMachines'), color: '#F56C6C', suffix: ' ' + this.$t('admin.stats.machineSuffix') },
      ],
      summaryStats: {
        totalUsers: 0,
        totalPoints: 0,
        totalConsumed: 0,
        totalAvailable: 0,
        totalMachines: 0,
      },
      table1: {
        action: 'admin/statistics/sys/getUserPointsSummary',
        columns: [
          { key: 'user_info', title: this.$t('admin.stats.colUser'), type: 'text', width: 200, slot: true },
          { key: 'total_points', title: this.$t('admin.stats.colTotalPoints'), type: 'text', width: 120, align: 'right' },
          { key: 'consumed_points', title: this.$t('admin.stats.colConsumed'), type: 'text', width: 120, align: 'right' },
          { key: 'available_points', title: this.$t('admin.stats.colAvailable'), type: 'text', width: 120, align: 'right' },
          { key: 'frozen_points', title: this.$t('admin.stats.colFrozen'), type: 'text', width: 100, align: 'right' },
          { key: 'total_machines', title: this.$t('admin.stats.colMachines'), type: 'text', width: 120, align: 'right', slot: true },
          { key: '_update_time_str', title: this.$t('admin.stats.colUpdateTime'), type: 'text', width: 180 },
        ],
        customRightBtns: [
          {
            title: this.$t('admin.stats.btnRecharge'),
            icon: 'el-icon-plus',
            type: 'success',
            onClick: (item) => that.$refs.rechargeDialog.open(item),
          },
          {
            title: this.$t('admin.stats.btnDetail'),
            icon: 'el-icon-view',
            type: 'primary',
            onClick: (item) => that.$refs.userDetailDialog.open(item),
          },
        ],
      },
    };
  },
  onLoad() {
    that = this;
    vk = that.vk;
    that.init();
    that.checkAdmin();
  },
  methods: {
    // ==================== 初始化 ====================
    async init() {
      // 统计数据由表格 @success 事件自动获取，无需单独请求
    },
    async checkAdmin() {
      try {
        const userInfo = vk.getVuex('$user.userInfo') || {};
        that.isAdmin = userInfo.role && Array.isArray(userInfo.role) && userInfo.role.includes('admin');
      } catch (e) {
        that.isAdmin = false;
      }
    },

    // ==================== 统计数据（表格加载成功时自动获取） ====================
    onTableSuccess({ data }) {
      if (data && data.summary) {
        Object.assign(that.summaryStats, data.summary);
      }
    },

    // ==================== 刷新回调 ====================
    handleRefresh() {
      // refresh 会触发 @success 事件，自动更新统计
      that.$refs.table1.refresh();
    },

    // ==================== 搜索栏 ====================
    searchPurchaseRecords() {
      const user_id = (that.searchForm.user_id || '').trim();
      const product_id = (that.searchForm.product_id || '').trim();
      if (!user_id && !product_id) {
        vk.toast(that.$t('admin.stats.purchase.errNeedQuery'), 'none');
        return;
      }
      that.$refs.purchaseRecordsDialog.open({ user_id, product_id });
    },
    resetSearchForm() {
      that.searchForm = { user_id: '', product_id: '' };
    },

    // ==================== 数据修复命令 ====================
    handleDataFixCommand(command) {
      if (command === 'scanDuplicate') {
        that.scanDuplicateRecharge();
      } else if (command === 'checkNegative') {
        that.checkNegativePoints();
      } else if (command === 'removeDuplicateCards') {
        that.$refs.removeDuplicateDialog.open();
      } else if (command === 'viewCardStats') {
        that.viewCardStats();
      }
    },
    async scanDuplicateRecharge() {
      that.fixLoading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/fixDuplicateRecharge',
          data: { action: 'scan' },
        });
        if (res.code === 0 && res.data && res.data.users && res.data.users.length > 0) {
          const users = res.data.users;
          let message = that.$t('admin.stats.scanFound', { n: users.length }) + '\n\n';
          users.forEach((u, i) => {
            message += that.$t('admin.stats.scanUserLine', {
              index: i + 1,
              name: u.user_name,
              records: u.extra_records,
              points: u.extra_points,
            }) + '\n';
          });
          message += '\n' + that.$t('admin.stats.scanFixAsk');
          try {
            await that.$confirm(message, that.$t('admin.stats.scanResultTitle'), {
              confirmButtonText: that.$t('admin.stats.scanFixOk'),
              cancelButtonText: that.$t('admin.common.cancel'),
              type: 'warning',
            });
            await that.fixDuplicateRecharge();
          } catch (e) {
            // 用户取消
          }
        } else {
          vk.toast(res.msg || that.$t('admin.stats.noDuplicate'), 'none');
        }
      } catch (err) {
        vk.toast(that.$t('admin.stats.scanFailed') + '：' + (err.message || that.$t('admin.common.unknownError')), 'none');
      } finally {
        that.fixLoading = false;
      }
    },
    async fixDuplicateRecharge() {
      that.fixLoading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/fixDuplicateRecharge',
          data: { action: 'fix' },
        });
        if (res.code === 0) {
          vk.toast(res.msg, 'success');
          that.handleRefresh();
        } else {
          vk.toast(res.msg || that.$t('admin.stats.fixFailed'), 'none');
        }
      } catch (err) {
        vk.toast(that.$t('admin.stats.fixFailed') + '：' + (err.message || that.$t('admin.common.unknownError')), 'none');
      } finally {
        that.fixLoading = false;
      }
    },
    async checkNegativePoints() {
      that.fixLoading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/checkNegativePoints',
        });
        if (res.code === 0 && res.data) {
          const users = res.data.users || [];
          if (users.length === 0) {
            vk.toast(that.$t('admin.stats.pointsNormal'), 'none');
            return;
          }
          let message = `<div style="max-height: 400px; overflow-y: auto;">`;
          message += `<p style="margin-bottom: 10px;">${that.$t('admin.stats.negativeFound', { n: users.length })}</p>`;
          message += `<table style="width: 100%; border-collapse: collapse; font-size: 13px;">`;
          message += `<tr style="background: var(--vk-bg-muted);"><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.negativeUser')}</th><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.negativeCurrent')}</th><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.negativeShould')}</th><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.negativeNeed')}</th></tr>`;
          users.slice(0, 50).forEach(u => {
            message += `<tr>`;
            message += `<td style="padding: 6px; border: 1px solid var(--vk-border);">${u.user_name}</td>`;
            message += `<td style="padding: 6px; border: 1px solid var(--vk-border); text-align: right;">${u.current_points}</td>`;
            message += `<td style="padding: 6px; border: 1px solid var(--vk-border); text-align: right; color: #F56C6C;">${u.calculated_points}</td>`;
            message += `<td style="padding: 6px; border: 1px solid var(--vk-border); text-align: right; color: #E6A23C; font-weight: bold;">${u.should_pay}</td>`;
            message += `</tr>`;
          });
          message += `</table>`;
          message += `<p style="margin-top: 15px; font-weight: bold; color: #F56C6C;">${that.$t('admin.stats.negativeTotal', { n: res.data.total_should_pay })}</p>`;
          message += `</div>`;
          that.$alert(message, that.$t('admin.stats.negativeTitle'), {
            dangerouslyUseHTMLString: true,
            confirmButtonText: that.$t('admin.common.ok'),
          });
        } else {
          vk.toast(res.msg || that.$t('admin.stats.checkFailed'), 'none');
        }
      } catch (err) {
        vk.toast(that.$t('admin.stats.checkFailed') + '：' + (err.message || that.$t('admin.common.unknownError')), 'none');
      } finally {
        that.fixLoading = false;
      }
    },
    async viewCardStats() {
      try {
        const res = await vk.callFunction({
          url: 'admin/card/sys/getCardStats',
          data: {},
        });
        if (res.code === 0 && res.data) {
          const data = res.data;
          let message = `<div style="max-height: 500px; overflow-y: auto;">`;
          message += `<h4 style="margin: 15px 0 10px;">${that.$t('admin.stats.cardTotal', { n: data.total })}</h4>`;
          if (data.type_distribution && data.type_distribution.length > 0) {
            message += `<h4 style="margin: 15px 0 10px;">${that.$t('admin.stats.cardTypeDist')}</h4>`;
            message += `<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">`;
            message += `<tr style="background: var(--vk-bg-muted);"><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardType')}</th><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardCount')}</th></tr>`;
            data.type_distribution.forEach(item => {
              message += `<tr><td style="padding: 6px; border: 1px solid var(--vk-border);">${item._id || that.$t('admin.stats.cardUncategorized')}</td><td style="padding: 6px; border: 1px solid var(--vk-border); text-align: right;">${item.count}</td></tr>`;
            });
            message += `</table>`;
          }
          if (data.length_distribution && Object.keys(data.length_distribution).length > 0) {
            message += `<h4 style="margin: 15px 0 10px;">${that.$t('admin.stats.cardLenDist')}</h4>`;
            message += `<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">`;
            message += `<tr style="background: var(--vk-bg-muted);"><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardLen')}</th><th style="padding: 8px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardCount')}</th></tr>`;
            Object.entries(data.length_distribution).sort((a, b) => a[0] - b[0]).forEach(([len, count]) => {
              message += `<tr><td style="padding: 6px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardLenUnit', { n: len })}</td><td style="padding: 6px; border: 1px solid var(--vk-border); text-align: right;">${count}</td></tr>`;
            });
            message += `</table>`;
          }
          if (data.recent_cards && data.recent_cards.length > 0) {
            message += `<h4 style="margin: 15px 0 10px;">${that.$t('admin.stats.cardRecent')}</h4>`;
            message += `<table style="width: 100%; border-collapse: collapse; font-size: 12px;">`;
            message += `<tr style="background: var(--vk-bg-muted);"><th style="padding: 6px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardCode')}</th><th style="padding: 6px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardType')}</th><th style="padding: 6px; border: 1px solid var(--vk-border);">${that.$t('admin.stats.cardTime')}</th></tr>`;
            data.recent_cards.forEach(card => {
              const timeStr = formatDateTime(card._add_time);
              message += `<tr><td style="padding: 4px; border: 1px solid var(--vk-border); font-family: monospace;">${card.card_code}</td><td style="padding: 4px; border: 1px solid var(--vk-border);">${card.card_type || '-'}</td><td style="padding: 4px; border: 1px solid var(--vk-border); color: var(--vk-text-secondary);">${timeStr}</td></tr>`;
            });
            message += `</table>`;
          }
          message += `</div>`;
          that.$alert(message, that.$t('admin.stats.cardStatsTitle'), {
            dangerouslyUseHTMLString: true,
            confirmButtonText: that.$t('admin.common.ok'),
            customClass: 'card-stats-dialog',
          });
        } else {
          vk.toast(res.msg || that.$t('admin.stats.getStatsFailed'), 'none');
        }
      } catch (err) {
        console.error('获取卡密统计失败：', err);
        vk.toast(that.$t('admin.stats.getStatsFailed') + '：' + (err.message || that.$t('admin.common.unknownError')), 'none');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.page-body {
  padding: 20px;
}

.tools-card {
  ::v-deep .el-card__body {
    padding: 15px 20px;
  }
}

.tools-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.tools-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--vk-text);
}

.purchase-query-form {
  padding: 15px;
  background: var(--vk-bg-muted, #f5f7fa);
  border-radius: 4px;
}
</style>

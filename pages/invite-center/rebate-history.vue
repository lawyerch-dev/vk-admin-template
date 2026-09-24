<template>
  <view class="rebate-history">
    <el-card>
      <div class="page-header">
        <div class="title">
          <i class="el-icon-document"></i>
          <span>{{ $t('invite.historyTitle') }}</span>
        </div>
        <el-button type="text" icon="el-icon-refresh" @click="refresh">{{ $t('invite.refresh') }}</el-button>
      </div>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="label">{{ $t('invite.totalRebate') }}</span>
          <span class="value success">{{ totalRebatePoints }}</span>
          <span class="unit">{{ $t('invite.points') }}</span>
        </div>
      </div>

      <!-- 返利记录列表 -->
      <div v-if="loading" class="loading-state">
        <i class="el-icon-loading"></i>
        <span>{{ $t('invite.loading') }}</span>
      </div>

      <div v-else-if="rebateList.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>{{ $t('invite.empty') }}</p>
      </div>

      <div v-else class="rebate-list">
        <div v-for="item in rebateList" :key="item._id" class="rebate-item">
          <div class="item-left">
            <div class="invitee-info">
              <span class="nickname">{{ item.invitee_nickname || $t('invite.user') }}</span>
              <el-tag size="mini" type="info">{{ $t('invite.tierName', { n: item.rebate_tier }) }}</el-tag>
            </div>
            <div class="item-meta">
              <span class="time">{{ formatTime(item._add_time) }}</span>
              <span class="rate">{{ $t('invite.rateValue', { rate: item.rebate_rate }) }}</span>
            </div>
          </div>
          <div class="item-right">
            <div class="pay-amount">{{ $t('invite.payMoney', { n: (item.pay_amount / 100).toFixed(2) }) }}</div>
            <div class="rebate-points">{{ $t('invite.gainPoints', { n: item.rebate_points }) }}</div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div class="load-more" v-if="hasMore">
          <el-button type="text" :loading="loadingMore" @click="loadMore">
            {{ loadingMore ? $t('invite.loading') : $t('invite.loadMore') }}
          </el-button>
        </div>
        <div class="no-more" v-else-if="rebateList.length > 0">
          {{ $t('invite.noMore') }}
        </div>
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
      rebateList: [],
      totalRebatePoints: 0,
      pageIndex: 1,
      pageSize: 20,
      hasMore: false,
      loading: false,
      loadingMore: false
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
      that.pageIndex = 1;

      vk.callFunction({
        url: 'user/pub/getRebateHistory',
        needLogin: true,
        data: {
          pageIndex: that.pageIndex,
          pageSize: that.pageSize
        },
        success: (data) => {
          that.rebateList = data.data.rows || [];
          that.hasMore = data.data.hasMore || false;
          that.calculateTotal();
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || that.$t('invite.loadFail'), 'none');
        },
        complete: () => {
          that.loading = false;
        }
      });
    },
    // 加载更多
    loadMore() {
      if (that.loadingMore || !that.hasMore) return;

      that.loadingMore = true;
      that.pageIndex++;

      vk.callFunction({
        url: 'user/pub/getRebateHistory',
        needLogin: true,
        data: {
          pageIndex: that.pageIndex,
          pageSize: that.pageSize
        },
        success: (data) => {
          const newRows = data.data.rows || [];
          that.rebateList = [...that.rebateList, ...newRows];
          that.hasMore = data.data.hasMore || false;
        },
        fail: (err) => {
          that.pageIndex--;
          vk.toast(err.msg || err.message || that.$t('invite.loadMoreFail'), 'none');
        },
        complete: () => {
          that.loadingMore = false;
        }
      });
    },
    // 刷新
    refresh() {
      that.loadData();
      vk.toast(that.$t('invite.refreshSuccess'));
    },
    // 计算累计返利
    calculateTotal() {
      that.totalRebatePoints = that.rebateList.reduce((sum, item) => {
        return sum + (item.rebate_points || 0);
      }, 0);

      // 如果有更多数据，从统计接口获取准确的累计值
      vk.callFunction({
        url: 'user/pub/getInviteStatistics',
        needLogin: true,
        success: (data) => {
          that.totalRebatePoints = data.data.totalRebatePoints || 0;
        }
      });
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
.rebate-history {
  padding: 20px;
  min-height: 100vh;
  background: var(--vk-bg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: bold;
    color: var(--vk-text, #1e293b);

    i {
      color: var(--vk-primary);
      font-size: 22px;
    }
  }
}

.stats-bar {
  display: flex;
  padding: 15px 20px;
  background: var(--vk-bg-secondary, #f1f5f9);
  border-radius: 8px;
  margin-bottom: 20px;

  .stat-item {
    display: flex;
    align-items: baseline;
    gap: 5px;

    .label {
      font-size: 14px;
      color: var(--vk-text, #1e293b);
    }

    .value {
      font-size: 24px;
      font-weight: bold;

      &.success {
        color: #67C23A;
      }
    }

    .unit {
      font-size: 14px;
      color: var(--vk-text-secondary, #64748b);
    }
  }
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--vk-text-secondary, #64748b);

  i {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--vk-text-secondary, #64748b);

  i {
    font-size: 64px;
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.rebate-list {
  .rebate-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--vk-border, #e2e8f0);

    &:last-child {
      border-bottom: none;
    }

    .item-left {
      .invitee-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .nickname {
          font-size: 15px;
          font-weight: 500;
          color: var(--vk-text, #1e293b);
        }
      }

      .item-meta {
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: var(--vk-text-secondary, #64748b);

        .rate {
          color: #E6A23C;
        }
      }
    }

    .item-right {
      text-align: right;

      .pay-amount {
        font-size: 13px;
        color: var(--vk-text, #1e293b);
        margin-bottom: 4px;
      }

      .rebate-points {
        font-size: 18px;
        font-weight: bold;
        color: #67C23A;
      }
    }
  }

  .load-more {
    text-align: center;
    padding: 20px 0;
  }

  .no-more {
    text-align: center;
    padding: 20px 0;
    font-size: 13px;
    color: var(--vk-text-secondary, #64748b);
  }
}
</style>

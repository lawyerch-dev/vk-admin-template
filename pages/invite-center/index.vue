<template>
  <view class="invite-center">
    <!-- 邀请信息卡片 -->
    <el-card class="invite-card">
      <div class="invite-header">
        <div class="invite-title">
          <i class="el-icon-share"></i>
          <span>{{ $t('invite.title') }}</span>
        </div>
        <el-button type="text" icon="el-icon-refresh" @click="loadInviteInfo">{{ $t('invite.refresh') }}</el-button>
      </div>

      <!-- 邀请链接 -->
      <div class="invite-link-section">
        <div class="section-label">{{ $t('invite.link') }}</div>
        <div class="invite-link-box">
          <el-input v-model="fullInviteLink" readonly size="small">
            <template slot="prepend">
              <i class="el-icon-link"></i>
            </template>
            <el-button slot="append" icon="el-icon-copy-document" @click="copyInviteLink">
              {{ $t('invite.copy') }}
            </el-button>
          </el-input>
        </div>
        <div class="invite-code-tip">
          {{ $t('invite.code') }}<span class="code">{{ inviteInfo.inviteCode || '-' }}</span>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-value primary">{{ inviteInfo.inviteeCount || 0 }}</div>
          <div class="stat-label">{{ $t('invite.inviteeCount') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ inviteInfo.totalConsumePoints || 0 }}</div>
          <div class="stat-label">{{ $t('invite.friendPoints') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ currentTierRate }}%</div>
          <div class="stat-label">{{ $t('invite.currentRate') }}</div>
        </div>
      </div>

      <!-- 阶梯进度 -->
      <div class="tier-progress-section" v-if="inviteInfo.nextTier && !inviteInfo.currentTier">
        <!-- 未达到最低门槛 -->
        <div class="progress-header unlock-tip">
          <span><i class="el-icon-lock"></i> {{ $t('invite.unlockTip', { threshold: inviteInfo.nextTier.threshold, rate: inviteInfo.nextTier.rate }) }}</span>
        </div>
        <el-progress
          :percentage="tierProgress"
          :stroke-width="12"
          :show-text="false"
          color="#E6A23C"
        ></el-progress>
        <div class="progress-tip">{{ $t('invite.needPoints', { n: inviteInfo.nextTier.remaining }) }}</div>
      </div>
      <div class="tier-progress-section" v-else-if="inviteInfo.nextTier">
        <!-- 已达到某个阶梯，显示下一阶梯进度 -->
        <div class="progress-header">
          <span>{{ $t('invite.nextTierTip', { n: inviteInfo.nextTier.remaining }) }}</span>
          <span class="next-rate">{{ $t('invite.nextTierRate', { rate: inviteInfo.nextTier.rate }) }}</span>
        </div>
        <el-progress
          :percentage="tierProgress"
          :stroke-width="12"
          :show-text="false"
          color="var(--vk-primary)"
        ></el-progress>
      </div>
      <div class="tier-max-tip" v-else-if="inviteInfo.currentTier">
        <i class="el-icon-trophy"></i>
        {{ $t('invite.maxTier') }}
      </div>
    </el-card>

    <!-- 返利阶梯说明 - 始终展示 -->
    <el-card class="tier-card highlight-card">
      <div class="card-header">
        <div class="header-left">
          <i class="el-icon-medal"></i>
          <span>{{ $t('invite.tierPromo') }}</span>
        </div>
        <el-tag type="warning" size="small" effect="dark">
          <i class="el-icon-star-on"></i> {{ $t('invite.tierPromoTag') }}
        </el-tag>
      </div>
      <div class="tier-description">
        <p>{{ $t('invite.tierDesc') }}</p>
      </div>
      <el-table :data="displayTierList" style="width: 100%" size="small" :row-class-name="tableRowClassName">
        <el-table-column prop="level" :label="$t('invite.level')" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="isCurrentTier(row) ? 'success' : 'info'" size="small" :effect="isCurrentTier(row) ? 'dark' : 'light'">
              {{ isCurrentTier(row) ? '★ ' : '' }}{{ $t('invite.tierName', { n: row.level }) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" :label="$t('invite.threshold')" align="center">
          <template slot-scope="{ row }">
            <span :class="{ 'highlight-text': isCurrentTier(row) }">
              {{ formatThreshold(row.threshold) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="rate" :label="$t('invite.rate')" align="center">
          <template slot-scope="{ row }">
            <span class="rate-value" :class="{ 'current-rate': isCurrentTier(row) }">
              {{ row.rate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('invite.status')" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="isCurrentTier(row)" type="success" size="mini" effect="dark">{{ $t('invite.statusCurrent') }}</el-tag>
            <el-tag v-else-if="canReachTier(row)" type="warning" size="mini">{{ $t('invite.statusLocked') }}</el-tag>
            <el-tag v-else type="info" size="mini">{{ $t('invite.statusReached') }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 最近返利记录 -->
    <el-card class="recent-card">
      <div class="card-header">
        <div>
          <i class="el-icon-document"></i>
          <span>{{ $t('invite.recentRebates') }}</span>
        </div>
        <el-button type="text" size="small" @click="goToHistory">
          {{ $t('invite.viewAll') }} <i class="el-icon-arrow-right"></i>
        </el-button>
      </div>
      <div v-if="recentRebates.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>{{ $t('invite.empty') }}</p>
      </div>
      <div v-else class="rebate-list">
        <div v-for="item in recentRebates" :key="item._id" class="rebate-item">
          <div class="rebate-info">
            <div class="invitee-name">{{ item.invitee_nickname || $t('invite.user') }}</div>
            <div class="rebate-time">{{ formatTime(item._add_time) }}</div>
          </div>
          <div class="rebate-detail">
            <div class="pay-amount">{{ $t('invite.payPoints', { n: item.pay_amount }) }}</div>
            <div class="rebate-points">{{ $t('invite.gainPoints', { n: item.rebate_points }) }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </view>
</template>

<script>
import * as rebateService from '@/common/services/rebate.js';

let that;
let vk;

export default {
  data() {
    return {
      inviteInfo: {
        inviteCode: '',
        inviteLink: '',
        inviteeCount: 0,
        currentTier: null,
        nextTier: null
      },
      statistics: {
        totalRebatePoints: 0
      },
      tierList: [],
      recentRebates: [],
      // 默认阶梯配置（按累计消费积分）
      defaultTiers: [
        { level: 1, threshold: 1000, rate: 10 },      // 1000积分起，10%
        { level: 2, threshold: 3000, rate: 20 },      // 3000积分起，20%
        { level: 3, threshold: 5000, rate: 30 },      // 5000积分起，30%
        { level: 4, threshold: 8000, rate: 50 }       // 8000积分起，50%
      ]
    };
  },
  computed: {
    // 完整邀请链接
    fullInviteLink() {
      if (!this.inviteInfo.inviteLink) return '';

      // #ifdef H5
      // H5环境下，始终生成完整的URL（包含协议和域名）
      // 这样无论在哪里复制链接，都能正确访问
      const { origin, pathname } = window.location;

      // 提取基础路径（到 /admin/ 之前的部分）
      let basePath;
      if (pathname.includes('/admin/')) {
        // 如果当前路径包含 /admin/，提取基础路径并拼接 /admin/index.html
        const adminIndex = pathname.indexOf('/admin/');
        const baseDir = pathname.substring(0, adminIndex);
        basePath = origin + baseDir + '/admin/index.html';
      } else {
        // 否则直接使用 /admin/index.html
        basePath = origin + '/admin/index.html';
      }

      // 后端返回的 inviteLink 形如：#/pages/login/index?inviteCode=XXXX&tab=register
      // 拼接完整URL并返回
      return basePath + this.inviteInfo.inviteLink;
      // #endif

      // #ifndef H5
      // 非H5环境，返回相对路径
      return '/admin/index.html' + this.inviteInfo.inviteLink;
      // #endif
    },
    // 当前阶梯返利比例
    currentTierRate() {
      return this.inviteInfo.currentTier ? this.inviteInfo.currentTier.rate : 0;
    },
    // 阶梯进度百分比（按累计消费金额）
    tierProgress() {
      if (!this.inviteInfo.nextTier || !this.inviteInfo.currentTier) return 100;
      const current = this.inviteInfo.totalConsumePoints || 0;
      const currentThreshold = this.inviteInfo.currentTier.threshold;
      const nextThreshold = this.inviteInfo.nextTier.threshold;
      const progress = ((current - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      return Math.min(100, Math.max(0, progress));
    },
    // 展示用的阶梯列表，确保始终有内容
    displayTierList() {
      return this.tierList.length > 0 ? this.tierList : this.defaultTiers;
    }
  },
  onLoad() {
    that = this;
    vk = that.vk;
    that.init();
  },
  methods: {
    init() {
      that.loadInviteInfo();
      that.loadStatistics();
      that.loadTierConfig();
    },
    // 加载邀请信息
    async loadInviteInfo() {
      that.inviteInfo = await rebateService.loadInviteInfo();
    },
    // 加载统计信息
    async loadStatistics() {
      const { statistics, recentRebates } = await rebateService.loadInviteStatistics();
      that.statistics = statistics;
      that.recentRebates = recentRebates;
    },
    // 加载阶梯配置
    async loadTierConfig() {
      that.tierList = await rebateService.loadTierConfig();
    },
    // 复制邀请链接
    copyInviteLink() {
      if (!that.fullInviteLink) {
        vk.toast(that.$t('invite.copyEmpty'));
        return;
      }
      uni.setClipboardData({
        data: that.fullInviteLink,
        success: () => vk.toast(that.$t('invite.copySuccess'))
      });
    },
    // 判断是否是当前阶梯
    isCurrentTier(tier) {
      return that.inviteInfo.currentTier &&
             that.inviteInfo.currentTier.level === tier.level;
    },
    // 判断是否可以达到该阶梯（待解锁）
    canReachTier(tier) {
      const totalConsume = that.inviteInfo.totalConsumePoints || 0;
      return totalConsume < tier.threshold;
    },
    // 格式化阶梯门槛
    formatThreshold(threshold) {
      return that.$t('invite.formatThreshold', { n: threshold });
    },
    // 表格行样式
    tableRowClassName({ row }) {
      if (that.isCurrentTier(row)) {
        return 'current-tier-row';
      }
      return '';
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '-';
      return vk.pubfn.timeFormat(timestamp, 'yyyy-MM-dd hh:mm');
    },
    // 跳转到返利历史页面
    goToHistory() {
      uni.navigateTo({
        url: '/pages/invite-center/rebate-history'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.invite-center {
  padding: 20px;

  .el-card {
    margin-bottom: 20px;
  }
}

.invite-card {
  .invite-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .invite-title {
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

  .invite-link-section {
    margin-bottom: 24px;

    .section-label {
      font-size: 14px;
      color: var(--vk-text, #1e293b);
      margin-bottom: 8px;
    }

    .invite-link-box {
      margin-bottom: 8px;
    }

    .invite-code-tip {
      font-size: 13px;
      color: var(--vk-text-secondary, #64748b);

      .code {
        color: var(--vk-primary);
        font-weight: bold;
        font-family: monospace;
      }
    }
  }

  .stats-section {
    display: flex;
    justify-content: space-around;
    padding: 20px 0;
    background: var(--vk-bg-muted, #f1f5f9);
    border-radius: 8px;
    margin-bottom: 20px;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 8px;

        &.primary { color: var(--vk-primary); }
        &.success { color: #67C23A; }
        &.warning { color: #E6A23C; }
      }

      .stat-label {
        font-size: 13px;
        color: var(--vk-text-secondary, #64748b);
      }
    }
  }

  .tier-progress-section {
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 13px;
      color: var(--vk-text, #1e293b);

      strong {
        color: var(--vk-primary);
      }

      .next-rate {
        color: #67C23A;
      }

      &.unlock-tip {
        justify-content: center;
        color: #E6A23C;
        font-size: 14px;

        i {
          margin-right: 5px;
        }

        strong {
          color: #E6A23C;
        }
      }
    }

    .progress-tip {
      text-align: center;
      margin-top: 8px;
      font-size: 12px;
      color: var(--vk-text-secondary, #64748b);
    }
  }

  .tier-max-tip {
    text-align: center;
    padding: 15px;
    background: var(--vk-bg-secondary, #f1f5f9);
    border-radius: 8px;
    color: #67C23A;
    font-weight: bold;

    i {
      margin-right: 8px;
      font-size: 18px;
    }
  }
}

.tier-card, .recent-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: bold;
    color: var(--vk-text, #1e293b);

    i {
      margin-right: 8px;
      color: var(--vk-primary);
    }

    .header-left {
      display: flex;
      align-items: center;
    }
  }

  .current-rate {
    color: #67C23A;
    font-weight: bold;
  }
}

/* 高亮卡片样式 */
.highlight-card {
  border: 2px solid #E6A23C;
  background-color: var(--vk-card, #ffffff);
  background-image: linear-gradient(135deg, rgba(230, 162, 60, 0.12) 0%, rgba(230, 162, 60, 0.04) 100%);

  .tier-description {
    padding: 12px 16px;
    background: rgba(230, 162, 60, 0.1);
    border-radius: 6px;
    margin-bottom: 16px;

    p {
      margin: 0;
      color: var(--vk-text, #1e293b);
      font-size: 14px;
      line-height: 1.6;
    }
  }

  .highlight-text {
    color: #67C23A;
    font-weight: 500;
  }

  .rate-value {
    font-size: 16px;
    font-weight: bold;
    color: #E6A23C;
  }

  ::v-deep .current-tier-row {
    background-color: rgba(103, 194, 58, 0.1) !important;
  }
}

.recent-card {
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--vk-text-secondary, #64748b);

    i {
      font-size: 48px;
      margin-bottom: 12px;
    }

    p {
      margin: 0;
    }
  }

  .rebate-list {
    .rebate-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--vk-border, #e2e8f0);

      &:last-child {
        border-bottom: none;
      }

      .rebate-info {
        .invitee-name {
          font-size: 14px;
          color: var(--vk-text, #1e293b);
          margin-bottom: 4px;
        }

        .rebate-time {
          font-size: 12px;
          color: var(--vk-text-secondary, #64748b);
        }
      }

      .rebate-detail {
        text-align: right;

        .pay-amount {
          font-size: 13px;
          color: var(--vk-text, #1e293b);
          margin-bottom: 4px;
        }

        .rebate-points {
          font-size: 16px;
          font-weight: bold;
          color: #67C23A;
        }
      }
    }
  }
}
</style>

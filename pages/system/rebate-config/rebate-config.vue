<template>
  <view class="rebate-config">
    <el-card>
      <div slot="header" class="card-header">
        <span>{{ $t('admin.rebate.title') }}</span>
        <el-switch v-model="config.enabled" :active-text="$t('admin.common.enable')" :inactive-text="$t('admin.common.disable')" @change="saveConfig"></el-switch>
      </div>

      <!-- 阶梯配置表格 -->
      <el-table :data="config.tiers" style="width: 100%" border>
        <el-table-column prop="level" :label="$t('admin.rebate.colLevel')" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag type="primary">Tier {{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" :label="$t('admin.rebate.colThreshold')" width="220" align="center">
          <template slot-scope="{ row }">
            <el-input-number
              v-model="row.threshold"
              :min="0"
              :max="999999"
              :step="100"
              size="small"
              @change="onTierChange"
            ></el-input-number>
            <span style="margin-left: 5px;">{{ $t('admin.common.points') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rate" :label="$t('admin.rebate.colRate')" width="200" align="center">
          <template slot-scope="{ row }">
            <el-input-number
              v-model="row.rate"
              :min="0"
              :max="100"
              size="small"
              @change="onTierChange"
            ></el-input-number>
            <span style="margin-left: 5px;">%</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.common.action')" width="120" align="center">
          <template slot-scope="{ $index }">
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="mini"
              circle
              @click="removeTier($index)"
              :disabled="config.tiers.length <= 1"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="addTier">
          {{ $t('admin.rebate.addTier') }}
        </el-button>
        <el-button type="success" icon="el-icon-check" size="small" @click="saveConfig" :loading="saving">
          {{ $t('admin.rebate.saveConfig') }}
        </el-button>
        <el-button type="info" icon="el-icon-refresh" size="small" @click="resetConfig">
          {{ $t('admin.rebate.resetDefault') }}
        </el-button>
      </div>

      <!-- 配置说明 -->
      <div class="config-tips">
        <el-alert :title="$t('admin.common.configTips')" type="info" :closable="false" show-icon>
          <ul>
            <li>{{ $t('admin.rebate.tipThreshold') }}</li>
            <li>{{ $t('admin.rebate.tipRate') }}</li>
            <li>{{ $t('admin.rebate.tipRule') }}</li>
            <li>{{ $t('admin.rebate.tipAntiFraud') }}</li>
          </ul>
        </el-alert>
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
      config: {
        enabled: true,
        tiers: []
      },
      saving: false,
      // 默认阶梯配置（threshold 单位为积分）
      defaultTiers: [
        { level: 1, threshold: 1000, rate: 10 },
        { level: 2, threshold: 3000, rate: 20 },
        { level: 3, threshold: 5000, rate: 30 },
        { level: 4, threshold: 8000, rate: 50 }
      ]
    };
  },
  onLoad() {
    that = this;
    vk = that.vk;
    that.loadConfig();
  },
  methods: {
    // 加载配置
    loadConfig() {
      vk.callFunction({
        url: 'admin/rebate/sys/getConfig',
        success: (data) => {
          that.config = {
            enabled: data.data.enabled !== false,
            tiers: data.data.tiers || [...that.defaultTiers]
          };
        },
        fail: (err) => {
          console.error('加载配置失败：', err);
          vk.toast(err.msg || err.message || that.$t('admin.common.loadFailed'), 'none');
        }
      });
    },
    // 添加阶梯
    addTier() {
      const lastTier = that.config.tiers[that.config.tiers.length - 1];
      const newTier = {
        level: that.config.tiers.length + 1,
        threshold: lastTier ? lastTier.threshold + 1000 : 1000,
        rate: lastTier ? Math.min(100, lastTier.rate + 10) : 10
      };
      that.config.tiers.push(newTier);
    },
    // 删除阶梯
    removeTier(index) {
      if (that.config.tiers.length <= 1) {
        vk.toast(that.$t('admin.rebate.keepOneTier'));
        return;
      }
      that.config.tiers.splice(index, 1);
      // 重新编号
      that.config.tiers.forEach((tier, i) => {
        tier.level = i + 1;
      });
    },
    // 阶梯变更
    onTierChange() {
      // 按 threshold 排序并重新编号
      that.config.tiers.sort((a, b) => a.threshold - b.threshold);
      that.config.tiers.forEach((tier, i) => {
        tier.level = i + 1;
      });
    },
    // 保存配置
    saveConfig() {
      // 验证配置
      const thresholds = new Set();
      for (const tier of that.config.tiers) {
        if (tier.threshold < 0) {
          vk.toast(that.$t('admin.rebate.thresholdNegative'));
          return;
        }
        if (tier.rate < 0 || tier.rate > 100) {
          vk.toast(that.$t('admin.rebate.rateRange'));
          return;
        }
        if (thresholds.has(tier.threshold)) {
          vk.toast(that.$t('admin.rebate.thresholdDuplicate'));
          return;
        }
        thresholds.add(tier.threshold);
      }

      // 检查返利比例是否递增
      const sortedTiers = [...that.config.tiers].sort((a, b) => a.threshold - b.threshold);
      for (let i = 1; i < sortedTiers.length; i++) {
        if (sortedTiers[i].rate < sortedTiers[i - 1].rate) {
          vk.toast(that.$t('admin.rebate.rateIncrease'));
          return;
        }
      }

      that.saving = true;
      vk.callFunction({
        url: 'admin/rebate/sys/updateConfig',
        data: {
          enabled: that.config.enabled,
          tiers: that.config.tiers
        },
        success: () => {
          vk.toast(that.$t('admin.common.saved'));
          that.loadConfig();
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || that.$t('admin.common.saveFailed'), 'none');
        },
        complete: () => {
          that.saving = false;
        }
      });
    },
    // 恢复默认配置
    resetConfig() {
      that.$confirm(that.$t('admin.rebate.resetConfirm'), that.$t('admin.common.confirm'), {
        confirmButtonText: that.$t('admin.common.ok'),
        cancelButtonText: that.$t('admin.common.cancel'),
        type: 'warning'
      }).then(() => {
        that.config.tiers = [...that.defaultTiers];
        that.saveConfig();
      }).catch(() => {});
    }
  }
};
</script>

<style lang="scss" scoped>
.rebate-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.config-tips {
  margin-top: 20px;

  ul {
    margin: 10px 0 0 0;
    padding-left: 20px;

    li {
      line-height: 1.8;
      color: var(--vk-text);
    }
  }
}
</style>

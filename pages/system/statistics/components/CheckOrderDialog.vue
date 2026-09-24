<template>
  <el-dialog
    :title="$t('admin.stats.order.title')"
    :visible.sync="visible"
    width="900px"
    :close-on-click-modal="false"
  >
    <el-form :inline="true" :model="form">
      <el-form-item :label="$t('admin.stats.order.tradeNo')">
        <el-input
          v-model="form.trade_no"
          :placeholder="$t('admin.stats.order.tradeNoPlaceholder')"
          clearable
          style="width: 300px;"
          @keyup.enter.native="checkOrderStatus"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="checkOrderStatus" :loading="loading">{{ $t('admin.common.search') }}</el-button>
      </el-form-item>
    </el-form>

    <div v-if="loading" class="detail-loading">
      <i class="el-icon-loading"></i> {{ $t('admin.stats.order.searching') }}
    </div>
    <div v-else-if="result">
      <!-- 诊断结果 -->
      <el-alert
        :title="result.diagnosis"
        :type="result.canManualRecharge ? 'warning' : (result.order.status === 'success' ? 'success' : 'error')"
        show-icon
        style="margin-bottom: 20px;"
      ></el-alert>

      <!-- 订单信息 -->
      <el-card shadow="never" style="margin-bottom: 15px;">
        <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.order.orderInfo') }}</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item :label="$t('admin.stats.order.tradeNo')">{{ result.order.trade_no }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.status')">
            <el-tag
              :type="result.order.status === 'success' ? 'success' : (result.order.status === 'failed' ? 'danger' : 'warning')"
              size="small"
            >
              {{ result.order.status === 'pending' ? $t('admin.stats.order.statusPending') :
                 result.order.status === 'paid' ? $t('admin.stats.order.statusPaid') :
                 result.order.status === 'success' ? $t('admin.stats.order.statusSuccess') : $t('admin.stats.order.statusFailed') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.packageName')">{{ result.order.package_name || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.basePoints')">{{ result.order.points || 0 }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.bonusPoints')">{{ result.order.bonus || 0 }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.totalPoints')">
            <span style="color: #67C23A; font-weight: 500;">{{ (result.order.points || 0) + (result.order.bonus || 0) }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.createTime')">{{ result.order._add_time_str }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.updateTime')">{{ result.order._update_time_str }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.failReason')" v-if="result.order.fail_reason" :span="2">
            <span style="color: #F56C6C;">{{ result.order.fail_reason }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 用户信息 -->
      <el-card shadow="never" style="margin-bottom: 15px;" v-if="result.userInfo">
        <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.order.userInfo') }}</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item :label="$t('admin.stats.order.userId')">{{ result.order.user_id }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.username')">{{ result.userInfo.username || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.nickname')">{{ result.userInfo.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.mobile')">{{ result.userInfo.mobile || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 积分账户 -->
      <el-card shadow="never" style="margin-bottom: 15px;" v-if="result.userPoints">
        <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.order.pointsAccount') }}</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item :label="$t('admin.stats.order.availablePoints')">
            <span style="color: var(--vk-primary, #409EFF); font-weight: 500;">{{ result.userPoints.available_points || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.totalPoints')">{{ result.userPoints.total_points || 0 }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.consumedPoints')">{{ result.userPoints.consumed_points || 0 }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.order.frozenPoints')">{{ result.userPoints.frozen_points || 0 }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 积分流水 -->
      <el-card shadow="never" v-if="result.pointsLog">
        <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.order.pointsLog') }}</div>
        <el-table :data="result.pointsLog" border stripe size="small">
          <el-table-column prop="_add_time_str" :label="$t('admin.stats.userDetail.colTime')" width="180"></el-table-column>
          <el-table-column prop="amount" :label="$t('admin.stats.userDetail.colAmount')" width="100" align="right">
            <template slot-scope="scope">
              <span style="color: #67C23A; font-weight: 500;">+{{ scope.row.amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="balance" :label="$t('admin.stats.userDetail.colBalance')" width="120" align="right"></el-table-column>
          <el-table-column prop="remark" :label="$t('admin.stats.userDetail.colRemark')" min-width="200"></el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never" v-else>
        <div style="text-align: center; padding: 20px; color: var(--vk-text-secondary, #64748b);">
          <i class="el-icon-warning" style="font-size: 48px; margin-bottom: 10px;"></i>
          <div>{{ $t('admin.stats.order.noPointsLog') }}</div>
        </div>
      </el-card>

      <!-- 手动补发按钮 -->
      <div v-if="result.canManualRecharge" style="margin-top: 20px; text-align: center;">
        <el-button
          type="danger"
          @click="manualRechargeFromOrder"
          :loading="recharging"
        >
          {{ $t('admin.stats.order.manualRecharge') }}
        </el-button>
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
  name: 'CheckOrderDialog',
  data() {
    return {
      visible: false,
      loading: false,
      recharging: false,
      form: {
        trade_no: '',
      },
      result: null,
    };
  },
  methods: {
    open() {
      this.visible = true;
      this.form.trade_no = '';
      this.result = null;
    },
    async checkOrderStatus() {
      const trade_no = (this.form.trade_no || '').trim();
      if (!trade_no) {
        vk.toast(this.$t('admin.stats.order.errTradeRequired'), 'none');
        return;
      }
      this.loading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/checkOrderStatus',
          data: { trade_no },
        });
        if (res.code === 0) {
          this.result = res.data;
        } else {
          vk.toast(res.msg || this.$t('admin.stats.order.queryFailed'), 'none');
          this.result = null;
        }
      } catch (err) {
        console.error('查询订单状态失败：', err);
        vk.toast(this.$t('admin.stats.order.queryFailed') + '：' + (err.message || this.$t('admin.common.unknownError')), 'none');
        this.result = null;
      } finally {
        this.loading = false;
      }
    },
    async manualRechargeFromOrder() {
      const result = this.result;
      if (!result || !result.order) return;
      const order = result.order;
      const totalPoints = (order.points || 0) + (order.bonus || 0);
      try {
        await this.$confirm(
          this.$t('admin.stats.order.manualConfirm', {
            orderId: order.trade_no,
            amount: totalPoints,
          }),
          this.$t('admin.stats.order.manualTitle'),
          {
            confirmButtonText: this.$t('admin.common.ok'),
            cancelButtonText: this.$t('admin.common.cancel'),
            type: 'warning',
          }
        );
      } catch {
        return;
      }
      this.recharging = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/recharge',
          data: {
            user_id: order.user_id,
            order_id: order.trade_no,
            amount: totalPoints,
            remark: this.$t('admin.stats.order.manualRemark', { name: order.package_name }),
          },
        });
        if (res.code === 0) {
          vk.toast(this.$t('admin.stats.order.manualSuccess'), 'success');
          await this.checkOrderStatus();
          this.$emit('refresh');
        } else {
          vk.toast(res.msg || this.$t('admin.stats.order.manualFailed'), 'none');
        }
      } catch (err) {
        console.error('补发失败：', err);
        vk.toast(this.$t('admin.stats.order.manualFailed') + '：' + (err.message || this.$t('admin.common.unknownError')), 'none');
      } finally {
        this.recharging = false;
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
</style>

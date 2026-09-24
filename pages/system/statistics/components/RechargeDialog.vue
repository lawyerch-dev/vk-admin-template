<template>
  <el-dialog
    :title="$t('admin.stats.recharge.title')"
    :visible.sync="visible"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item :label="$t('admin.stats.recharge.user')">
        <span style="font-weight: 500;">{{ userName }}</span>
        <span style="color: var(--vk-text-secondary, #64748b); margin-left: 10px;">ID: {{ userId }}</span>
      </el-form-item>
      <el-form-item :label="$t('admin.stats.recharge.balance')">
        <span style="color: var(--vk-primary, #409EFF); font-weight: 500;">{{ currentBalance }} {{ $t('admin.common.points') }}</span>
      </el-form-item>
      <el-form-item :label="$t('admin.stats.recharge.orderId')" required>
        <el-input
          v-model="form.order_id"
          :placeholder="$t('admin.stats.recharge.orderIdPlaceholder')"
          maxlength="50"
          style="width: 300px;"
        ></el-input>
        <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b); margin-top: 4px;">{{ $t('admin.stats.recharge.orderIdTip') }}</div>
      </el-form-item>
      <el-form-item :label="$t('admin.stats.recharge.amount')" required>
        <el-input-number
          v-model="form.amount"
          :min="1"
          :max="999999"
          style="width: 200px;"
        ></el-input-number>
      </el-form-item>
      <el-form-item :label="$t('admin.stats.recharge.remark')">
        <el-input
          v-model="form.remark"
          :placeholder="$t('admin.stats.recharge.remarkPlaceholder')"
          maxlength="200"
        ></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ $t('admin.common.cancel') }}</el-button>
      <el-button type="primary" @click="submitRecharge" :loading="loading">{{ $t('admin.stats.recharge.confirm') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
let vk = uni.vk;

export default {
  name: 'RechargeDialog',
  data() {
    return {
      visible: false,
      loading: false,
      userId: '',
      userName: '',
      currentBalance: 0,
      form: {
        order_id: '',
        amount: 100,
        remark: '',
      },
    };
  },
  methods: {
    open(row) {
      this.userId = row.user_id;
      this.userName = row.user_display_name;
      this.currentBalance = row.available_points || 0;
      this.form = { order_id: '', amount: 100, remark: '' };
      this.visible = true;
    },
    async submitRecharge() {
      const orderId = (this.form.order_id || '').trim();
      if (!orderId) {
        vk.toast(this.$t('admin.stats.recharge.errOrderRequired'), 'none');
        return;
      }
      if (!this.form.amount || this.form.amount <= 0) {
        vk.toast(this.$t('admin.stats.recharge.errAmount'), 'none');
        return;
      }
      try {
        await this.$confirm(
          this.$t('admin.stats.recharge.confirmMsg', {
            name: this.userName,
            amount: this.form.amount,
            orderId,
          }),
          this.$t('admin.stats.recharge.confirmTitle'),
          {
            confirmButtonText: this.$t('admin.common.ok'),
            cancelButtonText: this.$t('admin.common.cancel'),
            type: 'warning',
          }
        );
      } catch {
        return;
      }
      this.loading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/points/sys/recharge',
          data: {
            user_id: this.userId,
            order_id: orderId,
            amount: this.form.amount,
            remark: this.form.remark || '',
          },
        });
        if (res.code === 0) {
          vk.toast(this.$t('admin.stats.recharge.success'), 'success');
          this.visible = false;
          this.$emit('refresh');
        } else {
          vk.toast(res.msg || this.$t('admin.stats.recharge.failed'), 'none');
        }
      } catch (err) {
        console.error('充值失败：', err);
        vk.toast(this.$t('admin.stats.recharge.failed') + '：' + (err.message || this.$t('admin.common.unknownError')), 'none');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

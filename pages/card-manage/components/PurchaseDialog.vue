<template>
  <vk-data-dialog
    :value="show"
    @input="$emit('update:show', $event)"
    :title="title"
    width="1100px"
    mode="form"
  >
    <div class="dialog-layout">
      <!-- 左侧：表单区域 -->
      <div class="form-area">
        <vk-data-form
          ref="form1"
          v-model="formData"
          :rules="formRules"
          :action="action"
          :form-type="formType"
          :columns="formColumns"
          label-width="130px"
          @success="handleSuccess"
          @before-submit="handleBeforeSubmit"
        >
          <template v-slot:max_machine_count-tips>
            <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; line-height: 1.5">
              {{ $t('card.calc.monthlyFormula') }}
            </div>
          </template>
        </vk-data-form>
      </div>

      <!-- 右侧：积分扣费预览（仅购买模式） -->
      <div v-if="formType === 'add'" class="pricing-area">
        <div v-if="selectedProduct" class="points-cost-box">
          <div class="cost-header">
            <i class="el-icon-wallet"></i>
            <span>{{ $t('card.calc.previewTitle') }}</span>
          </div>
          <div class="cost-content">
            <div class="cost-info-single">
              <div class="cost-line">
                <span class="cost-label">{{ $t('card.calc.product') }}</span>
                <strong>{{ selectedProduct.product_name }}</strong>
              </div>
              <div class="cost-line">
                <span class="cost-label">{{ $t('card.calc.machineCount') }}</span>
                <strong class="cost-scale">&nbsp;{{ pointsCalculation.machineCount }}</strong> &nbsp;{{ $t('card.calc.unitMachine') }}
              </div>
              <div class="cost-line">
                <span class="cost-label">{{ $t('card.calc.duration') }}</span>
                <strong>&nbsp;{{ formData.limit_days || 30 }}</strong> &nbsp;{{ $t('card.calc.unitDays') }}
                <span class="cost-detail">&nbsp;{{ $t('card.calc.monthsFmt', { months: pointsCalculation.months }) }}</span>
              </div>
              <div class="cost-line">
                <span class="cost-label">{{ $t('card.calc.monthlyPrice') }}</span>
                <strong class="cost-monthly">{{ pointsCalculation.monthlyPrice }}</strong> &nbsp;{{ $t('card.calc.pointsPerMonth') }}
              </div>
              <div class="cost-line">
                <span class="cost-label">{{ $t('card.calc.unitPrice') }}</span>
                <strong class="cost-unit">&nbsp;{{ pointsCalculation.unitPrice }}</strong> &nbsp;{{ $t('card.calc.pointsPerCard') }}
                <span class="cost-detail">（{{ pointsCalculation.monthlyPrice }} × {{ pointsCalculation.months }}）</span>
              </div>
              <div class="cost-line cost-line-total">
                <span class="cost-label">{{ $t('card.calc.total') }}</span>
                <strong class="cost-total">&nbsp;{{ pointsCalculation.totalCost }}&nbsp;</strong> {{ $t('card.calc.unitPoints') }}
                <span class="cost-detail">{{ $t('card.calc.cardsFmt', { count: pointsCalculation.count }) }}</span>
              </div>
            </div>

            <div class="cost-balance-info">
              <div class="balance-row">
                <span class="balance-label">{{ $t('card.calc.before') }}</span>
                <strong class="available">{{ pointsCalculation.available }}</strong>
                <span class="balance-unit">{{ $t('card.calc.unitPoints') }}</span>
              </div>
              <div class="balance-arrow">→</div>
              <div class="balance-row">
                <span class="balance-label">{{ $t('card.calc.after') }}</span>
                <strong :class="pointsCalculation.afterBalance < 0 ? 'insufficient' : 'balance'">
                  {{ pointsCalculation.afterBalance }}
                </strong>
                <span class="balance-unit">{{ $t('card.calc.unitPoints') }}</span>
              </div>
            </div>

            <div v-if="pointsCalculation.afterBalance < 0" class="cost-warning">
              <i class="el-icon-warning"></i>
              <span>{{ $t('card.pointsInsufficient', { points: Math.abs(pointsCalculation.afterBalance) }) }}</span>
              <el-button type="text" @click="$emit('go-to-points-shop')" class="buy-btn">{{ $t('card.goBuy') }}</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </vk-data-dialog>
</template>

<script>
let that;
let vk = uni.vk;

// 默认续费天数选项（label 走 i18n）
const DEFAULT_RENEW_DAYS_OPTIONS = [
  { days: 30, labelKey: 'card.days.month30', discount: 1 },
  { days: 90, labelKey: 'card.days.quarter90', discount: 1 },
  { days: 180, labelKey: 'card.days.halfYear180', discount: 1 },
  { days: 365, labelKey: 'card.days.year365', discount: 1 },
];

export default {
  name: 'PurchaseDialog',
  props: {
    show: { type: Boolean, default: false },
    productList: { type: Array, default: () => [] },
    userPoints: {
      type: Object,
      default: () => ({ available_points: 0, total_points: 0 }),
    },
    machineStats: {
      type: Object,
      default: () => ({ total_machines: 0 }),
    },
  },
  data() {
    return {
      action: '',
      formType: '', // 'add' | 'renew'
      title: '',
      formData: {},
      formRules: {},
      formColumns: [],
    };
  },
  computed: {
    selectedProduct() {
      if (!this.formData.product_id || !this.productList.length) return null;
      let productId, productName;
      try {
        const parsed = JSON.parse(this.formData.product_id);
        productId = parsed.product_id;
        productName = parsed.product_name;
      } catch (e) {
        productId = this.formData.product_id;
        productName = null;
      }
      return this.productList.find(
        (p) => p.product_id === productId && (!productName || p.product_name === productName)
      );
    },
    pointsCalculation() {
      const defaultResult = {
        months: 0, scaleLevel: '', monthlyPrice: 0, machineCount: 0,
        unitPrice: 0, count: 0, timeDiscount: 1, discountText: '',
        totalCost: 0,
        available: this.userPoints.available_points || 0,
        afterBalance: this.userPoints.available_points || 0,
      };
      if (!this.selectedProduct) return defaultResult;

      const isRenewMode = this.formType === 'renew';
      const limitDays = isRenewMode
        ? (this.formData.renew_days || 30)
        : (this.formData.limit_days || 30);
      const count = isRenewMode ? 1 : (this.formData.numKeys || 1);
      const machineCount = isRenewMode
        ? (this.formData.renew_machine_count || 1)
        : (this.formData.max_machine_count || 1);

      let productBasePrice = this.selectedProduct.base_price || 5;

      // 特殊价格逻辑
      const userInfo = vk.getVuex('$user.userInfo');
      const userId = userInfo?._id;
      const specialPriceUserIds = this.selectedProduct.special_price_user_ids || [];
      const isSpecialPriceUser = userId && Array.isArray(specialPriceUserIds) && specialPriceUserIds.includes(userId);
      const totalMachines = this.machineStats?.total_machines || 0;
      if (isSpecialPriceUser && totalMachines <= 1000) {
        productBasePrice = this.selectedProduct.special_price || 1;
      }

      const scaleInfo = this.getMachineScaleInfo(machineCount, productBasePrice);
      const priceInfo = this.calculatePrice(scaleInfo.monthlyPrice, limitDays, 1);
      const unitPrice = priceInfo.unitPrice;
      const totalCost = unitPrice * count;
      const available = this.userPoints.available_points || 0;

      return {
        months: priceInfo.months,
        scaleLevel: scaleInfo.level,
        monthlyPrice: scaleInfo.monthlyPrice,
        machineCount,
        unitPrice,
        count,
        timeDiscount: 1,
        discountText: '',
        totalCost,
        available,
        afterBalance: available - totalCost,
      };
    },
  },
  watch: {
    '$i18n.locale'() {
      this.applyI18n();
    },
  },
  created() {
    that = this;
    this.applyI18n();
  },
  methods: {
    // 初始化多语言文案（校验规则、表单列）
    applyI18n() {
      const t = (key, values) => that.$t(key, values);
      const prevData = {};
      (that.formColumns || []).forEach((c) => {
        if (c.data) prevData[c.key] = c.data;
      });

      that.formRules = {
        product_id: [{ required: true, message: t('card.rule.selectProduct'), trigger: 'change' }],
        limit_days: [{ required: true, message: t('card.rule.selectBuyType'), trigger: 'change' }],
        renew_days: [{ required: true, message: t('card.rule.selectRenewDays'), trigger: 'change' }],
        max_machine_count: [
          { required: true, message: t('card.rule.inputMachines'), trigger: 'blur' },
          { type: 'number', min: 1, max: 999, message: t('card.rule.machinesRange'), trigger: 'blur' },
        ],
        numKeys: [
          { required: true, message: t('card.rule.inputCount'), trigger: 'blur' },
          { type: 'number', min: 1, max: 100, message: t('card.rule.countRange'), trigger: 'blur' },
        ],
        keyLength: [
          { required: true, message: t('card.rule.inputKeyLength'), trigger: 'blur' },
          { type: 'number', min: 10, max: 64, message: t('card.rule.keyLengthRange'), trigger: 'blur' },
        ],
      };

      that.formColumns = [
        { key: 'card_key', title: t('card.table.cardCode'), type: 'text', placeholder: '', disabled: true, show: ['renew'] },
        { key: 'current_expire_time', title: t('card.currentExpire'), type: 'text', placeholder: '', disabled: true, show: ['renew'] },
        {
          key: 'product_id', title: t('card.selectProduct'), type: 'select', data: prevData.product_id || [],
          placeholder: t('card.rule.selectProduct'), defaultValue: '',
          disabled: () => that.formType === 'renew',
          change: (val) => { that.onProductChange(val); that.$forceUpdate(); },
        },
        {
          key: 'limit_days', title: t('card.buyType'), type: 'select', data: prevData.limit_days || [],
          placeholder: t('card.rule.selectBuyType'), defaultValue: 30, show: ['add'],
          change: () => that.$forceUpdate(),
        },
        {
          key: 'renew_days', title: t('card.renewDays'), type: 'select', data: prevData.renew_days || [],
          placeholder: t('card.rule.selectRenewDays'), defaultValue: 30, show: ['renew'],
          change: () => that.$forceUpdate(),
        },
        {
          key: 'max_machine_count', title: t('card.machines'), type: 'number',
          placeholder: t('card.machinesPlaceholder'), defaultValue: 1, min: 1, max: 999, show: ['add'],
          change: () => that.$forceUpdate(),
        },
        {
          key: 'numKeys', title: t('card.buyCount'), type: 'number',
          placeholder: t('card.rule.inputCount'), tips: t('card.buyCountTip'),
          defaultValue: 1, min: 1, max: 100, show: ['add'],
          change: () => that.$forceUpdate(),
        },
        {
          key: 'keyPrefix', title: t('card.field.prefix'), type: 'text',
          placeholder: t('card.field.prefixPlaceholderShort'), tips: t('card.field.prefixTipShort'),
          defaultValue: '', maxlength: 20, show: ['add'],
        },
        {
          key: 'keySuffix', title: t('card.field.suffix'), type: 'text',
          placeholder: t('card.field.suffixPlaceholderShort'), tips: t('card.field.suffixTipShort'),
          defaultValue: '', maxlength: 20, show: ['add'],
        },
        {
          key: 'keyLength', title: t('card.keyLength'), type: 'number',
          placeholder: t('card.keyLengthPlaceholder'), tips: t('card.keyLengthTip'),
          defaultValue: 32, min: 10, max: 64, show: [],
        },
        { key: 'remark', title: t('card.table.remark'), type: 'textarea', placeholder: t('card.remarkPlaceholder') },
      ].map((c) => {
        if (prevData[c.key]) c.data = prevData[c.key];
        return c;
      });
    },
    getMachineScaleInfo(maxUseCount, productBasePrice = 5) {
      return {
        level: that.$t('card.calc.machineLevel', { count: maxUseCount }),
        monthlyPrice: productBasePrice * maxUseCount,
        machineCount: maxUseCount,
        unitPrice: productBasePrice,
        basePrice: productBasePrice,
      };
    },
    calculatePrice(baseMonthlyPrice, validDays, timeDiscount = 1) {
      const months = validDays === 365 ? 12 : Math.ceil(validDays / 30);
      return { unitPrice: Math.ceil(baseMonthlyPrice * months), months };
    },
    onProductChange(productValue) {
      let productId, productName;
      try {
        const parsed = JSON.parse(productValue);
        productId = parsed.product_id;
        productName = parsed.product_name;
      } catch (e) {
        productId = productValue;
        productName = null;
      }
      const product = that.productList.find(
        (p) => p.product_id === productId && (!productName || p.product_name === productName)
      );
      if (!product) return;

      if (product.valid_days_options && product.valid_days_options.length > 0) {
        const options = product.valid_days_options
          .filter((opt) => opt.days > 7)
          .map((opt) => ({ value: opt.days, label: opt.label }));
        if (options.length > 0) {
          that.updateFieldOptions('limit_days', options);
          that.$set(that.formData, 'limit_days', options[0].value);
          that.$set(that.formData, 'max_machine_count', 1);
        }
      }
    },
    updateFieldOptions(fieldKey, options) {
      const col = this.formColumns.find((c) => c.key === fieldKey);
      if (col) this.$set(col, 'data', options);
    },
    updateFormProductOptions(formOptions, queryOptions) {
      const formCol = this.formColumns.find((c) => c.key === 'product_id');
      if (formCol) this.$set(formCol, 'data', formOptions);
      // 同时更新查询的产品选项（通过事件通知父组件）
      this.$emit('update-query-options', queryOptions || formOptions);
    },

    // === 公开方法，供父组件通过 $refs 调用 ===

    openAdd(defaultProduct, validDaysOptions) {
      that.action = 'admin/card/kh/add';
      that.formType = 'add';
      that.title = that.$t('card.buy');

      const defaultProductValue = JSON.stringify({
        product_id: defaultProduct.product_id,
        product_name: defaultProduct.product_name,
      });

      if (validDaysOptions && validDaysOptions.length > 0) {
        that.updateFieldOptions('limit_days', validDaysOptions);
      }

      const limitDaysCol = that.formColumns.find((c) => c.key === 'limit_days');
      if (limitDaysCol) {
        limitDaysCol.title = that.$t('card.buyType');
        limitDaysCol.placeholder = that.$t('card.rule.selectBuyType');
      }

      const validOpts = validDaysOptions || [];
      const defaultDays = validOpts.length > 0 ? validOpts[0].value : 30;

      that.formData = {
        product_id: defaultProductValue,
        product_name: defaultProduct.product_name,
        limit_days: defaultDays,
        max_machine_count: 1,
        numKeys: 1,
        keyPrefix: '',
        keySuffix: '',
        keyLength: 32,
        remark: '',
      };

      that.$emit('update:show', true);
    },

    openRenew(item, product, renewOptions) {
      if (item.activate_time === 0) {
        return vk.toast(that.$t('card.cannotRenewInactive'));
      }
      if (item.limit_days === -1) {
        return vk.toast(that.$t('card.cannotRenewPermanent'));
      }
      if (!product) {
        return vk.toast(that.$t('card.productNotFound'));
      }

      that.action = 'admin/card/kh/renew';
      that.formType = 'renew';
      that.title = that.$t('card.renewTitle');

      let options = renewOptions;
      if (!options || options.length === 0) {
        options = DEFAULT_RENEW_DAYS_OPTIONS.map((opt) => ({
          value: opt.days,
          label: that.$t(opt.labelKey),
        }));
      }
      that.updateFieldOptions('renew_days', options);

      that.formData = {
        card_id: item._id,
        card_key: item.card_code,
        current_expire_time: vk.pubfn.timeFormat(item.expire_time, 'yyyy-MM-dd hh:mm:ss'),
        product_id: item.product_id,
        product_name: item.product_name || product.product_name,
        renew_days: (product.valid_days_options?.filter((opt) => opt.days > 7)?.[0]?.days) || 30,
        renew_machine_count: item.max_machine_count,
        remark: '',
      };

      that.$emit('update:show', true);
    },

    handleBeforeSubmit(formData) {
      if (formData.product_id) {
        try {
          const parsed = JSON.parse(formData.product_id);
          if (parsed.product_id && parsed.product_name) {
            formData.product_id = parsed.product_id;
            formData.product_name = parsed.product_name;
          }
        } catch (e) {
          if (that.productList && that.productList.length > 0) {
            const product = that.productList.find((p) => p.product_id === formData.product_id);
            if (product) formData.product_name = product.product_name;
          }
        }
      }
      return true;
    },

    handleSuccess() {
      that.$emit('update:show', false);
      that.$emit('success', that.formType);
    },
  },
};
</script>

<style lang="scss" scoped>
.dialog-layout {
  display: flex;
  gap: 20px;
  margin: -20px;
  padding: 20px;

  .form-area {
    flex: 1;
    min-width: 0;

    ::v-deep {
      $form-font-size: 15px;
      $form-height: 38px;
      $tip-font-size: 13px;

      .el-form-item {
        margin-bottom: 18px;
        &__label { font-size: $form-font-size; font-weight: 500; line-height: $form-height; }
        &__content { font-size: $form-font-size; line-height: $form-height; }
        &__error { font-size: $tip-font-size; padding-top: 4px; }
      }
      .el-input__inner, .el-input-number .el-input__inner, .el-select .el-input__inner {
        font-size: $form-font-size; height: $form-height; line-height: $form-height;
      }
      .el-textarea__inner { font-size: $form-font-size; padding: 8px 12px; }
      .el-input-number, .el-select { width: 100%; }
      .vk-data-input-item-tips { font-size: $tip-font-size; margin-top: 4px; line-height: 1.5; }
    }
  }

  .pricing-area {
    width: 350px;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--vk-bg-muted, #f1f5f9) 0%, var(--vk-card, #ffffff) 100%);
    border: 1px solid var(--vk-border, #e2e8f0);
    border-radius: 8px;
    padding: 10px;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb {
      background: var(--vk-border, #e2e8f0);
      border-radius: 3px;
      &:hover { background: var(--vk-text-muted, #94a3b8); }
    }
  }
}

.points-cost-box {
  $warning-color: #E6A23C;
  $danger-color: #F56C6C;
  $success-color: #67C23A;

  background: var(--vk-card, #ffffff);
  border: 1px solid var(--vk-border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;

  .cost-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: bold;
    color: var(--vk-text, #1e293b);
    padding: 10px 14px;
    border-bottom: 2px solid var(--vk-primary, #409eff);
    background: linear-gradient(135deg, var(--vk-primary-light, #ecf5ff) 0%, var(--vk-card, #ffffff) 100%);
    i { color: var(--vk-primary, #409eff); font-size: 15px; }
  }

  .cost-content {
    padding: 14px 16px;

    .cost-info-single { display: flex; flex-direction: column; gap: 10px; }

    .cost-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      line-height: 24px;
      font-size: 14px;
      padding: 6px 0;
      border-bottom: 1px solid var(--vk-bg-muted, #f1f5f9);
      &:last-child { border-bottom: none; }
      &.cost-line-total { margin-top: 6px; padding-top: 12px; border-top: 2px solid var(--vk-border, #e2e8f0); border-bottom: none; }

      .cost-label { color: var(--vk-text, #1e293b); min-width: 60px; flex-shrink: 0; font-weight: 500; }
      .cost-scale, .cost-monthly, .cost-unit { color: var(--vk-primary, #409eff); font-size: 15px; }
      .cost-total { color: $warning-color; font-size: 18px; font-weight: bold; }
      .cost-detail { color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-left: 4px; }
      .cost-discount { color: $danger-color; font-weight: bold; margin-left: 6px; font-size: 12px; }
    }

    .cost-balance-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--vk-primary-light, #f0f9ff);
      border-radius: 6px;
      border: 1px solid var(--vk-primary-border, #b3d8ff);

      .balance-row {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 12px;
        flex: 1;
        min-width: 0;
        .balance-label { color: var(--vk-text, #1e293b); white-space: nowrap; flex-shrink: 0; }
        &:last-child {
          justify-content: flex-end;
          .balance-label, .balance-unit, strong { color: #F56C6C; }
        }
        .balance-unit { color: var(--vk-text-secondary, #64748b); white-space: nowrap; flex-shrink: 0; }
        strong { font-size: 14px; font-weight: 600; color: $success-color; min-width: 60px; text-align: right; }
      }
      .balance-arrow { color: var(--vk-primary, #409eff); font-size: 16px; font-weight: bold; flex-shrink: 0; margin: 0 4px; }
    }

    .cost-warning {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(245, 108, 108, 0.12);
      border: 1px solid $danger-color;
      border-radius: 4px;
      color: $danger-color;
      font-size: 13px;
      i { font-size: 14px; margin-right: 6px; }
      .buy-btn { color: $danger-color; font-size: 13px; padding: 0; &:hover { color: #f78989; } }
    }
  }
}
</style>

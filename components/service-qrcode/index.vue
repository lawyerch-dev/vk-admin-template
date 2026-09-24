<template>
  <vk-data-dialog
    v-model="visible"
    :title="$t('comp.serviceTitle')"
    width="400px"
    :close-on-click-modal="true"
  >
    <view class="service-dialog-content">
      <view class="qrcode-container">
        <image :src="qrcodeImg" class="qrcode-img" mode="aspectFit"></image>
      </view>
      <view class="service-tips">
        <i class="el-icon-info"></i>
        <text>{{ tipsText }}</text>
      </view>
      <text class="service-time">{{ $t('comp.serviceTime', { n: workTime }) }}</text>
    </view>
    <template v-slot:footer="{ close }">
      <el-button @click="close">{{ $t('comp.close') }}</el-button>
    </template>
  </vk-data-dialog>
</template>

<script>
// 用 require 引入图片，这是 uni-app 自定义组件中引用本地图片的正确方式
const defaultQrcode = require('@/static/service-qrcode.png');

export default {
  name: 'ServiceQrcode',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    qrcodeSrc: {
      type: String,
      default: '',
    },
    tips: {
      type: String,
      default: '',
    },
    workTime: {
      type: String,
      default: '9:00 - 18:00',
    },
  },
  computed: {
    visible: {
      get() {
        return this.show;
      },
      set(val) {
        this.$emit('update:show', val);
      },
    },
    qrcodeImg() {
      return this.qrcodeSrc || defaultQrcode;
    },
    tipsText() {
      return this.tips || this.$t('comp.serviceTips');
    },
  },
};
</script>

<style lang="scss" scoped>
.service-dialog-content {
  text-align: center;
  padding: 20px 0;

  .qrcode-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    .qrcode-img {
      width: 200px;
      height: 200px;
      border: 1px solid var(--vk-border, #e2e8f0);
      border-radius: 8px;
      padding: 10px;
      background: var(--vk-card, #ffffff);
    }
  }

  .service-tips {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--vk-text, #1e293b);
    margin: 15px 0 10px;

    i {
      color: var(--vk-primary);
      margin-right: 5px;
    }
  }

  .service-time {
    font-size: 13px;
    color: var(--vk-text-secondary, #64748b);
    margin: 5px 0;
  }
}
</style>

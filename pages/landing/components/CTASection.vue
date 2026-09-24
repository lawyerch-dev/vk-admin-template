<template>
  <view class="cta">
    <view class="cta__inner">
      <text class="cta__title">{{ trText(data.title, 'cta.title') }}</text>
      <text class="cta__sub">{{ data.subtitle || '' }}</text>
      <text class="btn btn--primary btn--lg" @click="handleClick">{{ trText(data.btn_text, 'cta.register') }}</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    data: { type: Object, default: () => ({}) }
  },
  methods: {
    // 英文模式下覆盖后台配置的中文文案
    trText(text, key) {
      const locale = this.$getLocale ? this.$getLocale() : 'zh-Hans';
      if (locale === 'en' && this.$t) return this.$t(key);
      return text;
    },

    handleClick() {
      this.$emit('navigate', '/pages/login/index?tab=register');
    }
  }
};
</script>

<style lang="scss" scoped>
.cta {
  padding: 80px 24px;
  text-align: center;

  &__inner {
    max-width: 600px;
    margin: 0 auto;
  }

  &__title {
    display: block;
    font-size: 32px;
    font-weight: 700;
    color: var(--vk-text);
    margin-bottom: 12px;
  }

  &__sub {
    display: block;
    font-size: 16px;
    color: var(--vk-text-secondary);
    margin-bottom: 36px;
  }
}

.btn {
  display: inline-block;
  padding: 14px 36px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &--primary {
    background: var(--vk-primary);
    color: #ffffff;
  }

  &--lg {
    padding: 16px 48px;
    font-size: 18px;
  }
}
</style>

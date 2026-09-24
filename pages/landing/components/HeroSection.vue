<template>
  <view class="hero">
    <view class="hero__inner">
      <text class="hero__title">{{ trText(data.title, 'login.title') }}</text>
      <text class="hero__sub">{{ trText(data.subtitle, 'login.subtitle') }}</text>
      <view class="hero__actions">
        <text class="btn btn--primary" @click="handlePrimary">{{ trText((data.btn_primary || {}).text, 'hero.more') }}</text>
        <text class="btn btn--outline" @click="handleGhost">{{ trText((data.btn_ghost || {}).text, 'hero.console') }}</text>
      </view>
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
      if (locale === 'en' && this.$t) {
        const translated = this.$t(key);
        if (translated && translated !== key) return translated;
      }
      return text;
    },

    handlePrimary() {
      const { windowHeight } = uni.getSystemInfoSync();
      uni.pageScrollTo({ scrollTop: windowHeight, duration: 300 });
    },
    handleGhost() {
      const action = (this.data.btn_ghost || {}).action;
      if (action === 'login') {
        this.$emit('navigate', '/pages/login/index');
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.hero {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: var(--vk-bg);

  &__inner {
    max-width: 800px;
  }

  &__title {
    display: block;
    font-size: 48px;
    font-weight: 800;
    color: var(--vk-text);
    line-height: 1.2;
    letter-spacing: -1px;
    white-space: pre-line;
    margin-bottom: 24px;
  }

  &__sub {
    display: block;
    font-size: 18px;
    color: var(--vk-text-secondary);
    line-height: 1.6;
    white-space: pre-line;
    margin-bottom: 48px;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }
}

.btn {
  display: inline-block;
  padding: 14px 36px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &--primary {
    background: var(--vk-primary);
    color: #ffffff;

    &:hover {
      background: var(--vk-primary-hover);
    }
  }

  &--outline {
    background: transparent;
    color: var(--vk-primary);
    border: 1px solid var(--vk-primary);

    &:hover {
      background: var(--vk-primary);
      color: #ffffff;
    }
  }
}
</style>

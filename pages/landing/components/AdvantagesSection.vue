<template>
  <view class="advantages">
    <view class="advantages__inner">
      <text class="section__title">{{ trText(data.title, 'advantages.title') }}</text>
      <text class="section__subtitle">{{ trText(data.subtitle, 'advantages.subtitle') }}</text>
      <view class="advantages__list">
        <view class="adv-item" v-for="(item, i) in data.items" :key="i">
          <text class="adv-item__num">{{ String(i + 1).padStart(2, '0') }}</text>
          <view class="adv-item__content">
            <text class="adv-item__title">{{ trText(item.title, `advantages.item${i}.title`) }}</text>
            <text class="adv-item__desc">{{ trText(item.desc, `advantages.item${i}.desc`) }}</text>
          </view>
        </view>
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
    }
  }
};
</script>

<style lang="scss" scoped>
.advantages {
  padding: 80px 24px;
  background: var(--vk-bg-secondary);

  &__inner {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }

  &__list {
    margin-top: 48px;
    text-align: left;
  }
}

.section {
  &__title {
    display: block;
    font-size: 32px;
    font-weight: 700;
    color: var(--vk-text);
    margin-bottom: 12px;
  }

  &__subtitle {
    display: block;
    font-size: 16px;
    color: var(--vk-text-secondary);
  }
}

.adv-item {
  display: flex;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--vk-border);

  &:last-child {
    border-bottom: none;
  }

  &__num {
    font-size: 24px;
    font-weight: 700;
    color: var(--vk-primary);
    min-width: 40px;
  }

  &__content {
    flex: 1;
  }

  &__title {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: var(--vk-text);
    margin-bottom: 6px;
  }

  &__desc {
    display: block;
    font-size: 14px;
    color: var(--vk-text-secondary);
    line-height: 1.6;
  }
}
</style>

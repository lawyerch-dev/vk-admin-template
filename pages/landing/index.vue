<template>
  <view class="landing">
    <!-- 导航栏 -->
    <view class="nav" :class="{ 'nav--scrolled': scrolled }">
      <view class="nav__inner">
        <view class="nav__left">
          <image class="nav__logo" src="/static/logo.png" mode="aspectFit"></image>
          <text class="nav__brand">{{ $t('nav.brand') }}</text>
        </view>
        <view class="nav__right">
          <nav-prefs />
          <template v-if="isLoggedIn">
            <text class="nav__btn" @click="goAdmin">{{ $t('nav.admin') }}</text>
            <text class="nav__user">{{ userInfo.nickname || userInfo.username || $t('user.fallback') }}</text>
          </template>
          <template v-else>
            <text class="nav__btn nav__btn--ghost" @click="goLogin">{{ $t('nav.login') }}</text>
            <text class="nav__btn" @click="goRegister">{{ $t('nav.register') }}</text>
          </template>
        </view>
      </view>
    </view>

    <!-- 动态渲染区块 -->
    <view v-for="(section, i) in sections" :key="i">
      <HeroSection
        v-if="section.type === 'hero' && section.enable"
        :data="section.data"
        @navigate="navigateTo"
      />
      <StatsSection
        v-if="section.type === 'stats' && section.enable"
        :data="section.data"
      />
      <FeaturesSection
        v-if="section.type === 'features' && section.enable"
        :data="section.data"
      />
      <AdvantagesSection
        v-if="section.type === 'advantages' && section.enable"
        :data="section.data"
      />
      <ProductsSection
        v-if="section.type === 'products' && section.enable"
        :data="section.data"
      />
      <CTASection
        v-if="section.type === 'cta' && section.enable"
        :data="section.data"
        @navigate="navigateTo"
      />
    </view>

    <!-- Footer -->
    <view class="footer">
      <view class="footer__inner">
        <text class="footer__text">{{ $t('landing.footer') }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import HeroSection from './components/HeroSection.vue';
import StatsSection from './components/StatsSection.vue';
import FeaturesSection from './components/FeaturesSection.vue';
import AdvantagesSection from './components/AdvantagesSection.vue';
import CTASection from './components/CTASection.vue';
import ProductsSection from './components/ProductsSection.vue';
import NavPrefs from '@/components/NavPrefs.vue';

let vk = uni.vk;

export default {
  components: { HeroSection, StatsSection, FeaturesSection, AdvantagesSection, CTASection, ProductsSection, NavPrefs },
  data() {
    return {
      scrolled: false,
      sections: []
    };
  },
  computed: {
    isLoggedIn() {
      return this.vk.checkToken();
    },
    userInfo() {
      return this.vk.getVuex('$user.userInfo') || {};
    }
  },
  onLoad() {
    vk = this.vk;
    this.loadPageConfig();
  },
  onPageScroll(e) {
    this.scrolled = e.scrollTop > 20;
  },
  methods: {
    // 加载落地页配置
    loadPageConfig() {
      vk.callFunction({
        url: 'admin/landing-page/pub/get',
        data: {},
        success: (res) => {
          if (res.data && res.data.sections) {
            this.sections = res.data.sections;
          }
        },
        fail: () => {
          // 静默失败，使用默认空数据
        }
      });
    },

    // 页面跳转（公开页自由浏览；进入后台才要求登录）
    navigateTo(url) {
      if (!url) return;
      if (url.indexOf('/pages/index') === 0 || url.indexOf('/pages_plugs') === 0) {
        // 后台相关页面：未登录先去登录
        if (this.isLoggedIn) {
          vk.reLaunch({ url: '/pages/index/index' });
        } else {
          vk.navigateTo({ url: '/pages/login/index' });
        }
        return;
      }
      vk.navigateTo({ url });
    },

    goLogin() {
      if (this.isLoggedIn) {
        vk.reLaunch({ url: '/pages/index/index' });
      } else {
        vk.navigateTo({ url: '/pages/login/index' });
      }
    },

    goRegister() {
      vk.navigateTo({ url: '/pages/login/index?tab=register' });
    },

    goAdmin() {
      if (!this.isLoggedIn) {
        vk.navigateTo({ url: '/pages/login/index' });
        return;
      }
      vk.reLaunch({ url: '/pages/index/index' });
    }
  }
};
</script>

<style lang="scss" scoped>
.landing {
  min-height: 100vh;
  background: var(--vk-bg);
}

// 导航栏
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--vk-nav, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s;

  &--scrolled {
    border-bottom-color: var(--vk-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo {
    width: 32px;
    height: 32px;
  }

  &__brand {
    font-size: 18px;
    font-weight: 700;
    color: var(--vk-text);
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__user {
    font-size: 14px;
    color: var(--vk-text-secondary);
  }

  &__link {
    font-size: 14px;
    color: var(--vk-text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--vk-text);
    }
  }

  &__btn {
    padding: 8px 20px;
    background: var(--vk-primary);
    color: #ffffff;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: var(--vk-primary-hover);
    }

    &--ghost {
      background: var(--vk-bg);
      color: var(--vk-primary);
      border: 1px solid var(--vk-primary);

      &:hover {
        background: var(--vk-primary-light);
      }
    }
  }
}

// Footer
.footer {
  padding: 32px 24px;
  background: var(--vk-bg-secondary);
  text-align: center;

  &__text {
    font-size: 13px;
    color: var(--vk-text-muted);
  }
}
</style>

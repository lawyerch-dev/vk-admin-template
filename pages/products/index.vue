<template>
  <view class="products-page">
    <!-- 顶部导航 -->
    <view class="nav">
      <view class="nav__inner">
        <view class="nav__left" @click="goHome">
          <image class="nav__logo" src="/static/logo.png" mode="aspectFit"></image>
          <text class="nav__brand">{{ $t('nav.brand') }}</text>
        </view>
        <view class="nav__right">
          <text class="nav__btn nav__btn--ghost" @click="goHome">{{ $t('nav.home') }}</text>
          <text v-if="isLoggedIn" class="nav__btn" @click="goAdmin">{{ $t('nav.admin') }}</text>
          <text v-else class="nav__btn" @click="goLogin">{{ $t('nav.login') }}</text>
        </view>
      </view>
    </view>

    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-header__title">{{ $t('products.title') }}</text>
      <text class="page-header__sub">{{ $t('products.pageSubtitle') }}</text>
    </view>

    <!-- 产品分类筛选 -->
    <view v-if="categories.length > 0" class="filter-bar">
      <view class="filter-bar__inner">
        <view
          class="filter-tag"
          :class="{ 'filter-tag--active': activeCategory === '' }"
          @click="activeCategory = ''"
        >
          {{ $t('products.all') }}
        </view>
        <view
          v-for="cat in categories"
          :key="cat.value"
          class="filter-tag"
          :class="{ 'filter-tag--active': activeCategory === cat.value }"
          @click="activeCategory = cat.value"
        >
          {{ cat.label }}
        </view>
      </view>
    </view>

    <!-- 产品列表 -->
    <view class="products-section">
      <view v-if="loading" class="loading-state">
        <i class="el-icon-loading"></i>
        <text>{{ $t('products.loading') }}</text>
      </view>

      <view v-else-if="filteredProducts.length === 0" class="empty-state">
        <i class="el-icon-goods"></i>
        <text class="empty-state__text">{{ $t('products.empty') }}</text>
        <text class="empty-state__tip">{{ $t('products.emptyTip') }}</text>
      </view>

      <view v-else class="product-grid">
        <view
          v-for="product in filteredProducts"
          :key="product._id"
          class="product-card"
        >
          <!-- 封面区域 -->
          <view class="product-card__visual">
            <image
              v-if="getImageUrl(product.product_image)"
              :src="getImageUrl(product.product_image)"
              class="product-card__image"
              mode="aspectFill"
              @error="onImageError($event, product)"
            ></image>
            <view v-else class="product-card__placeholder">
              <i class="el-icon-picture-outline"></i>
              <text class="product-card__placeholder-name">{{ product.product_name }}</text>
            </view>
            <!-- 浮动标签 -->
            <view class="product-card__badges">
              <text class="type-badge" :class="product.product_type">
                {{ getTypeLabel(product.product_type) }}
              </text>
              <text v-if="product.buy_price > 0" class="hot-badge">
                <i class="el-icon-trophy"></i>
              </text>
            </view>
          </view>

          <!-- 产品信息 -->
          <view class="product-card__body">
            <text class="product-card__name">{{ product.product_name }}</text>
            <text v-if="product.description" class="product-card__desc">{{ product.description }}</text>

            <!-- 定价栏 -->
            <view class="product-card__pricing">
              <view class="pricing-item">
                <text class="pricing-value">{{ product.price_points }}</text>
                <text class="pricing-label">{{ $t('products.points') }}</text>
              </view>
              <text class="pricing-sep">×</text>
              <view class="pricing-item">
                <text class="pricing-value">{{ product.price_months }}</text>
                <text class="pricing-label">{{ $t('products.month') }}</text>
              </view>
              <text class="pricing-sep">×</text>
              <view class="pricing-item">
                <text class="pricing-value">{{ product.price_machines }}</text>
                <text class="pricing-label">{{ $t('products.machine') }}</text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="product-card__actions">
              <view
                v-if="product.detail_url"
                class="action-btn action-btn--detail"
                @click="openDetail(product.detail_url)"
              >
                <i class="el-icon-document"></i>
                <text>{{ $t('products.viewDetail') }}</text>
              </view>
              <view
                class="action-btn action-btn--buy"
                @click="handleBuy(product)"
              >
                <i class="el-icon-shopping-cart-2"></i>
                <text>{{ product.buy_price > 0 ? $t('products.buy') : $t('products.detail') }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <text class="footer__text">{{ $t('products.footer') }}</text>
    </view>
  </view>
</template>

<script>
let vk;

export default {
  data() {
    return {
      loading: true,
      products: [],
      categories: [],
      activeCategory: '',
    };
  },
  computed: {
    isLoggedIn() {
      return this.vk.checkToken();
    },
    filteredProducts() {
      if (!this.activeCategory) return this.products;
      return this.products.filter(p => p.product_type === this.activeCategory);
    },
  },
  onLoad() {
    vk = this.vk;
    this.loadData();
  },
  methods: {
    // 加载数据
    async loadData() {
      this.loading = true;
      await Promise.all([
        this.loadProducts(),
        this.loadCategories(),
      ]);
      this.loading = false;
    },

    // 加载公开产品列表
    loadProducts() {
      return new Promise((resolve) => {
        vk.callFunction({
          url: 'admin/product/pub/getPublicList',
          data: {},
          success: (res) => {
            this.products = res.data || [];
            resolve();
          },
          fail: (err) => {
            this.products = [];
            vk.toast((err && (err.msg || err.message)) || this.$t('products.empty'), 'none');
            resolve();
          },
        });
      });
    },

    // 加载产品分类
    loadCategories() {
      return new Promise((resolve) => {
        vk.callFunction({
          url: 'admin/product-category/pub/getAll',
          data: {},
          success: (res) => {
            this.categories = res.data || [];
            resolve();
          },
          fail: (err) => {
            this.categories = [];
            vk.toast((err && (err.msg || err.message)) || this.$t('products.empty'), 'none');
            resolve();
          },
        });
      });
    },

    // 获取图片URL
    getImageUrl(image) {
      if (!image) return '';
      if (typeof image === 'string') return image;
      if (typeof image === 'object') {
        if (image.url) return image.url;
        if (image[0] && typeof image[0] === 'string') return image[0];
        if (image[0] && image[0].url) return image[0].url;
      }
      return '';
    },

    // 获取类型标签
    getTypeLabel(type) {
      const TYPE_KEYS = {
        software: 'comp.type.software',
        plugin: 'comp.type.plugin',
        normal: 'comp.type.normal',
      };
      const key = TYPE_KEYS[type];
      if (key) return this.$t(key);
      const found = this.categories.find(c => c.value === type);
      return found ? found.label : type || this.$t('products.fallback');
    },

    // 打开详情文档
    openDetail(url) {
      if (!url) return;
      // #ifdef H5
      window.open(url, '_blank');
      // #endif
      // #ifndef H5
      uni.navigateTo({
        url: `/pages/webview/index?url=${encodeURIComponent(url)}`,
      });
      // #endif
    },

    // 处理购买/了解更多
    handleBuy(product) {
      if (this.isLoggedIn) {
        // 已登录，跳转到我的产品页
        uni.navigateTo({ url: '/pages/my-products/index' });
      } else {
        // 未登录，跳转到登录页
        uni.navigateTo({ url: '/pages/login/index' });
      }
    },

    // 图片加载失败
    onImageError(e, product) {
      // 静默处理
    },

    // 导航
    goHome() {
      uni.reLaunch({ url: '/pages/landing/index' });
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/index' });
    },
    goAdmin() {
      if (!this.isLoggedIn) {
        uni.navigateTo({ url: '/pages/login/index' });
        return;
      }
      uni.reLaunch({ url: '/pages/index/index' });
    },
  },
};
</script>

<style lang="scss" scoped>
.products-page {
  min-height: 100vh;
  background: var(--vk-bg-secondary);
}

/* 导航栏 */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--vk-nav);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--vk-border);

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
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

  &__link {
    font-size: 14px;
    color: var(--vk-text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--vk-primary);
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

/* 页面标题 */
.page-header {
  text-align: center;
  padding: 48px 24px 24px;

  &__title {
    display: block;
    font-size: 36px;
    font-weight: 800;
    color: var(--vk-text);
    margin-bottom: 12px;
  }

  &__sub {
    display: block;
    font-size: 16px;
    color: var(--vk-text-secondary);
  }
}

/* 分类筛选 */
.filter-bar {
  padding: 0 24px 24px;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }
}

.filter-tag {
  padding: 8px 20px;
  background: var(--vk-bg);
  border: 1px solid var(--vk-border);
  border-radius: 20px;
  font-size: 14px;
  color: var(--vk-text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--vk-primary);
    color: var(--vk-primary);
  }

  &--active {
    background: var(--vk-primary);
    border-color: var(--vk-primary);
    color: #ffffff;

    &:hover {
      background: var(--vk-primary-hover);
      color: #ffffff;
    }
  }
}

/* 产品区域 */
.products-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 80px 0;
  color: var(--vk-text-muted);
  font-size: 16px;

  i {
    font-size: 32px;
    display: block;
    margin-bottom: 12px;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 0;

  i {
    font-size: 48px;
    color: var(--vk-border);
    display: block;
    margin-bottom: 16px;
  }

  &__text {
    display: block;
    font-size: 18px;
    color: var(--vk-text-secondary);
    margin-bottom: 8px;
  }

  &__tip {
    display: block;
    font-size: 14px;
    color: var(--vk-text-muted);
  }
}

/* 产品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* 产品卡片 — 与 components/product-card 视觉对齐 */
.product-card {
  background: var(--vk-card, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--vk-border, #e2e8f0);
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &__visual {
    position: relative;
    height: 160px;
    background: var(--vk-bg-muted);
    overflow: hidden;
    flex-shrink: 0;
  }

  &__image {
    width: 100%;
    height: 100%;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;

    i {
      font-size: 40px;
      opacity: 0.7;
      margin-bottom: 8px;
    }
  }

  &__placeholder-name {
    font-size: 14px;
    opacity: 0.85;
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badges {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 6px;
    z-index: 2;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
  }

  &__name {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--vk-text, #1e293b);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--vk-text-secondary, #64748b);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__pricing {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: var(--vk-bg-muted);
    border-radius: 8px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--vk-border, #e2e8f0);
  }
}

.type-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);

  &.software { background: #2563eb; }
  &.plugin   { background: #059669; }
  &.normal   { background: #6b7280; }
}

.hot-badge {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #ea580c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.pricing-item {
  text-align: center;
}

.pricing-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--vk-text, #1e293b);
}

.pricing-label {
  font-size: 11px;
  color: var(--vk-text-secondary, #64748b);
}

.pricing-sep {
  color: var(--vk-border, #e2e8f0);
  font-size: 14px;
}

/* 操作按钮 */
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }

  i {
    font-size: 16px;
  }

  &--detail {
    background: var(--vk-primary-soft);
    color: var(--vk-primary);
    border: 1px solid var(--vk-primary-border);

    &:hover {
      background: var(--vk-primary-light);
    }
  }

  &--buy {
    background: var(--vk-primary);
    color: #ffffff;

    &:hover {
      background: var(--vk-primary-hover);
    }
  }
}

/* 底部 */
.footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid var(--vk-border);
  background: var(--vk-bg);

  &__text {
    font-size: 14px;
    color: var(--vk-text-muted);
  }
}
</style>

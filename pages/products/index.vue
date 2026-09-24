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
      <text class="page-header__title">产品中心</text>
      <text class="page-header__sub">选择适合您的产品，提升工作效率</text>
    </view>

    <!-- 产品分类筛选 -->
    <view v-if="categories.length > 0" class="filter-bar">
      <view class="filter-bar__inner">
        <view
          class="filter-tag"
          :class="{ 'filter-tag--active': activeCategory === '' }"
          @click="activeCategory = ''"
        >
          全部
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
        <text>加载中...</text>
      </view>

      <view v-else-if="filteredProducts.length === 0" class="empty-state">
        <i class="el-icon-goods"></i>
        <text class="empty-state__text">暂无产品</text>
        <text class="empty-state__tip">敬请期待</text>
      </view>

      <view v-else class="product-grid">
        <view
          v-for="product in filteredProducts"
          :key="product._id"
          class="product-card"
        >
          <!-- 产品图片 -->
          <view class="product-card__visual">
            <image
              v-if="product.product_image"
              :src="getImageUrl(product.product_image)"
              class="product-card__image"
              mode="aspectFill"
              @error="onImageError($event, product)"
            ></image>
            <view v-else class="product-card__placeholder">
              <i class="el-icon-goods"></i>
            </view>
            <!-- 类型标签 -->
            <view class="product-card__type-badge">
              {{ getTypeLabel(product.product_type) }}
            </view>
          </view>

          <!-- 产品信息 -->
          <view class="product-card__body">
            <text class="product-card__name">{{ product.product_name }}</text>
            <text v-if="product.description" class="product-card__desc">{{ product.description }}</text>

            <!-- 定价 -->
            <view class="product-card__pricing">
              <view class="pricing-item">
                <text class="pricing-value">{{ product.price_points }}</text>
                <text class="pricing-label">积分</text>
              </view>
              <text class="pricing-sep">×</text>
              <view class="pricing-item">
                <text class="pricing-value">{{ product.price_months }}</text>
                <text class="pricing-label">月</text>
              </view>
              <text class="pricing-sep">×</text>
              <view class="pricing-item">
                <text class="pricing-value">{{ product.price_machines }}</text>
                <text class="pricing-label">机器</text>
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
                <text>查看详情</text>
              </view>
              <view
                class="action-btn action-btn--buy"
                @click="handleBuy(product)"
              >
                <i class="el-icon-shopping-cart-2"></i>
                <text>{{ product.buy_price > 0 ? '立即购买' : '了解详情' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <text class="footer__text">© 2024 AI 商务定制化平台</text>
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
          fail: () => {
            this.products = [];
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
          fail: () => {
            this.categories = [];
            resolve();
          },
        });
      });
    },

    // 获取图片URL
    getImageUrl(image) {
      if (!image) return '';
      if (image.startsWith('http')) return image;
      if (image.startsWith('/')) return image;
      return image;
    },

    // 获取类型标签
    getTypeLabel(type) {
      const found = this.categories.find(c => c.value === type);
      return found ? found.label : type || '产品';
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
  background: #f8fafc;
}

/* 导航栏 */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;

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
    color: #1e293b;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__link {
    font-size: 14px;
    color: #64748b;
    cursor: pointer;

    &:hover {
      color: var(--vk-primary);
    }
  }

  &__btn {
    padding: 8px 20px;
    background: var(--vk-primary);
    color: #fff;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: var(--vk-primary-hover);
    }

    &--ghost {
      background: #ffffff;
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
    color: #1e293b;
    margin-bottom: 12px;
  }

  &__sub {
    display: block;
    font-size: 16px;
    color: #64748b;
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
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--vk-primary);
    color: var(--vk-primary);
  }

  &--active {
    background: var(--vk-primary);
    border-color: var(--vk-primary);
    color: #fff;

    &:hover {
      background: var(--vk-primary-hover);
      color: #fff;
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
  color: #94a3b8;
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
    color: #cbd5e1;
    display: block;
    margin-bottom: 16px;
  }

  &__text {
    display: block;
    font-size: 18px;
    color: #64748b;
    margin-bottom: 8px;
  }

  &__tip {
    display: block;
    font-size: 14px;
    color: #94a3b8;
  }
}

/* 产品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* 产品卡片 */
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }

  &__visual {
    position: relative;
    height: 200px;
    background: #f1f5f9;
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 48px;
      color: #cbd5e1;
    }
  }

  &__type-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 4px 12px;
    background: rgba(59, 130, 246, 0.9);
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  &__body {
    padding: 20px;
  }

  &__name {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  &__pricing {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
  }

  &__actions {
    display: flex;
    gap: 10px;
  }
}

.pricing-item {
  text-align: center;
}

.pricing-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--vk-primary);
}

.pricing-label {
  font-size: 12px;
  color: #94a3b8;
}

.pricing-sep {
  color: #cbd5e1;
  font-size: 14px;
}

/* 操作按钮 */
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  i {
    font-size: 16px;
  }

  &--detail {
    background: #f0f9ff;
    color: var(--vk-primary);
    border: 1px solid #bfdbfe;

    &:hover {
      background: #dbeafe;
    }
  }

  &--buy {
    background: var(--vk-primary);
    color: #fff;

    &:hover {
      background: var(--vk-primary-hover);
    }
  }
}

/* 底部 */
.footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  background: #fff;

  &__text {
    font-size: 14px;
    color: #94a3b8;
  }
}
</style>

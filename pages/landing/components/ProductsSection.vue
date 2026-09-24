<template>
  <view class="products-section">
    <view class="products-section__inner">
      <text class="products-section__title">{{ trText(data.title, 'products.title') }}</text>
      <text class="products-section__sub">{{ trText(data.subtitle, 'products.subtitle') }}</text>

      <!-- 产品网格 -->
      <view v-if="loading" class="products-section__loading">
        <i class="el-icon-loading"></i>
        <text>{{ $t('landing.loading') }}</text>
      </view>

      <view v-else-if="products.length === 0" class="products-section__empty">
        <text>{{ $t('landing.empty') }}</text>
      </view>

      <view v-else class="products-section__grid">
        <view
          v-for="product in displayProducts"
          :key="product._id"
          class="product-item"
        >
          <!-- 封面区域 -->
          <view class="product-item__visual">
            <image
              v-if="imageUrl(product)"
              :src="imageUrl(product)"
              class="product-item__image"
              mode="aspectFill"
            ></image>
            <view v-else class="product-item__placeholder">
              <i class="el-icon-picture-outline"></i>
              <text class="product-item__placeholder-name">{{ product.product_name }}</text>
            </view>
            <view class="product-item__badges">
              <text class="type-badge" :class="product.product_type">
                {{ typeLabel(product.product_type) }}
              </text>
              <text v-if="product.buy_price > 0" class="hot-badge">
                <i class="el-icon-trophy"></i>
              </text>
            </view>
          </view>

          <!-- 产品信息 -->
          <view class="product-item__body">
            <text class="product-item__name">{{ product.product_name }}</text>
            <text v-if="product.description" class="product-item__desc">{{ product.description }}</text>

            <!-- 定价栏 -->
            <view class="product-item__pricing">
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

            <!-- 操作 -->
            <view class="product-item__actions">
              <text
                v-if="product.detail_url"
                class="action-btn action-btn--detail"
                @click="openDetail(product.detail_url)"
              >{{ $t('products.viewDetail') }}</text>
              <text class="action-btn action-btn--buy" @click="showService">{{ $t('landing.consult') }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 查看更多 -->
      <view v-if="products.length > maxShow" class="products-section__more">
        <text class="more-btn" @click="goProducts">{{ $t('landing.viewAll') }}</text>
      </view>
    </view>

    <!-- 客服弹窗 -->
    <service-qrcode :show.sync="serviceDialog.show" />
  </view>
</template>

<script>
import ServiceQrcode from '@/components/service-qrcode/index.vue';

const TYPE_KEYS = {
  software: 'comp.type.software',
  plugin: 'comp.type.plugin',
  normal: 'comp.type.normal',
};

export default {
  components: { ServiceQrcode },
  props: {
    data: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      loading: true,
      products: [],
      serviceDialog: { show: false },
    };
  },
  computed: {
    maxShow() {
      return this.data.max_show || 6;
    },
    displayProducts() {
      return this.products.slice(0, this.maxShow);
    },
  },
  created() {
    this.loadProducts();
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

    loadProducts() {
      const vk = uni.vk;
      vk.callFunction({
        url: 'admin/product/pub/getPublicList',
        data: {},
        success: (res) => {
          this.products = res.data || [];
        },
        fail: (err) => {
          this.products = [];
          uni.vk.toast((err && (err.msg || err.message)) || this.$t('landing.empty'), 'none');
        },
        complete: () => {
          this.loading = false;
        },
      });
    },
    imageUrl(product) {
      const img = product.product_image;
      if (!img) return '';
      if (typeof img === 'string') return img;
      if (typeof img === 'object') {
        if (img.url) return img.url;
        if (img[0] && typeof img[0] === 'string') return img[0];
        if (img[0] && img[0].url) return img[0].url;
      }
      return '';
    },
    typeLabel(type) {
      const key = TYPE_KEYS[type];
      return key ? this.$t(key) : (type || this.$t('products.fallback'));
    },
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
    showService() {
      this.serviceDialog.show = true;
    },
    goProducts() {
      uni.navigateTo({ url: '/pages/products/index' });
    },
  },
};
</script>

<style lang="scss" scoped>
.products-section {
  padding: 80px 24px;
  background: var(--vk-bg-secondary);

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

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
    margin-bottom: 48px;
  }

  &__loading,
  &__empty {
    padding: 40px 0;
    color: var(--vk-text-muted);
    font-size: 16px;

    i {
      font-size: 24px;
      display: block;
      margin-bottom: 8px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    text-align: left;
  }

  &__more {
    margin-top: 40px;
  }
}

.more-btn {
  display: inline-block;
  padding: 12px 32px;
  background: var(--vk-primary);
  color: #ffffff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: var(--vk-primary-hover);
  }
}

.product-item {
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
    overflow: hidden;
    background: var(--vk-bg-muted);
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
    overflow: hidden;
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
  font-size: 14px;
  color: var(--vk-border, #e2e8f0);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }

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
</style>

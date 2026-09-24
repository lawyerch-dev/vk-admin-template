<template>
  <view class="products-section">
    <view class="products-section__inner">
      <text class="products-section__title">{{ data.title || '产品中心' }}</text>
      <text class="products-section__sub">{{ data.subtitle || '选择适合您的产品' }}</text>

      <!-- 产品网格 -->
      <view v-if="loading" class="products-section__loading">
        <i class="el-icon-loading"></i>
        <text>加载中...</text>
      </view>

      <view v-else-if="products.length === 0" class="products-section__empty">
        <text>暂无产品</text>
      </view>

      <view v-else class="products-section__grid">
        <view
          v-for="product in displayProducts"
          :key="product._id"
          class="product-item"
        >
          <!-- 产品图片 -->
          <view class="product-item__visual">
            <image
              v-if="product.product_image"
              :src="product.product_image"
              class="product-item__image"
              mode="aspectFill"
            ></image>
            <view v-else class="product-item__placeholder">
              <i class="el-icon-goods"></i>
            </view>
          </view>

          <!-- 产品信息 -->
          <view class="product-item__body">
            <text class="product-item__name">{{ product.product_name }}</text>
            <text v-if="product.description" class="product-item__desc">{{ product.description }}</text>

            <!-- 定价 -->
            <view class="product-item__pricing">
              <text class="pricing-value">{{ product.price_points }}</text>
              <text class="pricing-label">积分/</text>
              <text class="pricing-value">{{ product.price_months }}</text>
              <text class="pricing-label">月/</text>
              <text class="pricing-value">{{ product.price_machines }}</text>
              <text class="pricing-label">机器</text>
            </view>

            <!-- 操作 -->
            <view class="product-item__actions">
              <text
                v-if="product.detail_url"
                class="action-btn action-btn--detail"
                @click="openDetail(product.detail_url)"
              >查看详情</text>
              <text class="action-btn action-btn--buy" @click="showService">立即咨询</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 查看更多 -->
      <view v-if="products.length > maxShow" class="products-section__more">
        <text class="more-btn" @click="goProducts">查看全部产品 →</text>
      </view>
    </view>

    <!-- 客服弹窗 -->
    <service-qrcode :show.sync="serviceDialog.show" />
  </view>
</template>

<script>
import ServiceQrcode from '@/components/service-qrcode/index.vue';

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
    loadProducts() {
      const vk = uni.vk;
      vk.callFunction({
        url: 'admin/product/pub/getPublicList',
        data: {},
        success: (res) => {
          this.products = res.data || [];
        },
        fail: () => {
          this.products = [];
        },
        complete: () => {
          this.loading = false;
        },
      });
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
  background: #f8fafc;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

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
    margin-bottom: 48px;
  }

  &__loading,
  &__empty {
    padding: 40px 0;
    color: #94a3b8;
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
  background: #3b82f6;
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }
}

.product-item {
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
    height: 180px;
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
    align-items: baseline;
    gap: 2px;
    margin-bottom: 16px;
    padding: 10px;
    background: #f8fafc;
    border-radius: 6px;
  }

  &__actions {
    display: flex;
    gap: 10px;
  }
}

.pricing-value {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
}

.pricing-label {
  font-size: 12px;
  color: #94a3b8;
}

.action-btn {
  flex: 1;
  display: block;
  text-align: center;
  padding: 10px 0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &--detail {
    background: #f0f9ff;
    color: #3b82f6;
    border: 1px solid #bfdbfe;

    &:hover {
      background: #dbeafe;
    }
  }

  &--buy {
    background: #3b82f6;
    color: #fff;

    &:hover {
      background: #2563eb;
    }
  }
}
</style>

<template>
  <view
    class="product-card-wrapper"
    :class="{
      'is-flipped': isFlipped,
      'mode-purchased': mode === 'purchased',
      'mode-unpurchased': mode === 'unpurchased'
    }"
    @click="mode === 'purchased' && toggleFlip()"
  >
    <!-- ==================== 正面 ==================== -->
    <view class="card-face card-front">
      <!-- 图片区域 -->
      <view class="card-visual">
        <image
          v-if="imageUrl"
          :src="imageUrl"
          class="product-image"
          mode="aspectFill"
        ></image>
        <view v-else class="image-placeholder">
          <i class="el-icon-picture-outline"></i>
          <text class="image-placeholder__name">{{ product.product_name }}</text>
        </view>

        <!-- 浮动标签 -->
        <view class="floating-badges">
          <text class="type-badge" :class="product.product_type">
            {{ typeLabel }}
          </text>
          <text v-if="isCustom" class="custom-badge">
            <i class="el-icon-star-on"></i> {{ $t('comp.custom') }}
          </text>
          <text
            v-if="mode === 'unpurchased' && product.buy_price > 0"
            class="hot-badge"
          >
            <i class="el-icon-trophy"></i>
          </text>
        </view>
      </view>

      <!-- 内容区域 -->
      <view class="card-body">
        <text class="product-name">{{ product.product_name }}</text>
        <text v-if="product.description" class="product-desc">{{ product.description }}</text>

        <!-- 定价栏 -->
        <view class="pricing-bar">
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

        <!-- 未购买：购买操作区 -->
        <view v-if="mode === 'unpurchased'" class="card-action">
          <view v-if="product.is_purchased" class="purchased-block" @click.stop="$emit('go-purchased', product)">
            <i class="el-icon-circle-check"></i>
            <text>{{ $t('comp.purchased') }}</text>
            <i class="el-icon-arrow-right"></i>
          </view>
          <view v-else-if="product.user_buy_price > 0 || product.buy_price > 0" class="purchase-block">
            <view class="price-tag">
              <text class="price-amount">{{ product.user_buy_price || product.buy_price }}</text>
              <text class="price-unit">{{ $t('products.points') }}</text>
            </view>
            <el-button
              type="primary"
              class="action-btn primary-btn"
              @click.stop="$emit('buy', product)"
            >
              <i class="el-icon-shopping-cart-full"></i>
              {{ $t('comp.buyNow') }}
            </el-button>
          </view>
          <view v-else class="unavailable-block">
            <i class="el-icon-lock"></i>
            <text>{{ $t('comp.unavailable') }}</text>
          </view>
        </view>

        <!-- 已购买：翻转提示 -->
        <view v-if="mode === 'purchased'" class="card-footer">
          <view class="flip-hint">
            <i class="el-icon-refresh-left"></i>
            <text>{{ $t('comp.flipMore') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================== 背面（仅 purchased 模式） ==================== -->
    <view v-if="mode === 'purchased'" class="card-face card-back">
      <view class="back-header">
        <text class="back-header__title">{{ product.product_name }}</text>
        <view class="flip-hint-back" @click.stop="toggleFlip()">
          <i class="el-icon-refresh-right"></i>
          <text>{{ $t('comp.flipBack') }}</text>
        </view>
      </view>

      <view class="back-body">
        <!-- 版本更新日志 -->
        <view v-if="hasVersionLogs" class="back-section">
          <view class="section-title">
            <i class="el-icon-document"></i>
            <text>{{ $t('comp.versionLogs') }}</text>
          </view>
          <view class="version-list">
            <view
              v-for="(log, index) in product.version_logs.slice(0, 3)"
              :key="index"
              class="version-item"
            >
              <view class="version-head">
                <el-tag size="mini" :type="index === 0 ? 'success' : ''">{{ log.version }}</el-tag>
                <text class="version-date">{{ formatDate(log.date) }}</text>
              </view>
              <view class="version-log" v-html="formatLogPreview(log.log)"></view>
            </view>
            <el-button
              v-if="product.version_logs.length > 3"
              type="text"
              size="small"
              @click.stop="$emit('show-version-logs', product)"
              style="margin-top: 10px;"
            >{{ $t('comp.viewAllVersions', { n: product.version_logs.length }) }}</el-button>
          </view>
        </view>

        <!-- 下载地址 -->
        <view v-if="product.download_url" class="back-section">
          <view class="section-title">
            <i class="el-icon-download"></i>
            <text>{{ $t('comp.downloadUrl') }}</text>
          </view>
          <view class="download-area">
            <el-input
              :value="product.download_url"
              readonly
              size="small"
              @click.native.stop
            >
              <el-button
                slot="append"
                icon="el-icon-copy-document"
                @click.stop="$emit('copy', product.download_url)"
              >{{ $t('comp.copy') }}</el-button>
            </el-input>
            <el-button
              type="primary"
              size="small"
              icon="el-icon-download"
              @click.stop="$emit('download', product.download_url)"
              style="margin-top: 10px; width: 100%;"
            >{{ $t('comp.downloadNow') }}</el-button>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!hasVersionLogs && !product.download_url" class="back-empty">
          <i class="el-icon-info"></i>
          <text class="back-empty__text">{{ $t('comp.emptyBack') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatDate, formatLogPreview } from '@/pages/user-center/user-center-config.js';

const TYPE_KEYS = {
  software: 'comp.type.software',
  plugin: 'comp.type.plugin',
  normal: 'comp.type.normal',
};

export default {
  name: 'ProductCard',

  props: {
    product: { type: Object, required: true },
    mode: { type: String, default: 'purchased' }, // 'purchased' | 'unpurchased'
    userInfo: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      isFlipped: false,
    };
  },

  computed: {
    imageUrl() {
      const img = this.product.product_image;
      if (!img) return '';
      if (typeof img === 'string') return img;
      if (typeof img === 'object') {
        if (img.url) return img.url;
        if (img[0] && typeof img[0] === 'string') return img[0];
        if (img[0] && img[0].url) return img[0].url;
      }
      return '';
    },

    typeLabel() {
      const key = TYPE_KEYS[this.product.product_type];
      return key ? this.$t(key) : this.product.product_type;
    },

    isCustom() {
      const ids = this.product.custom_user_ids;
      if (!ids || !Array.isArray(ids)) return false;
      if (ids.includes('all')) return false;
      return ids.includes(this.userInfo._id);
    },

    hasVersionLogs() {
      return this.product.version_logs && this.product.version_logs.length > 0;
    },
  },

  methods: {
    formatDate,
    formatLogPreview,

    toggleFlip() {
      this.isFlipped = !this.isFlipped;
    },
  },
};
</script>

<style lang="scss" scoped>
/* ========== 容器 ========== */
.product-card-wrapper {
  position: relative;
  height: 400px;
  perspective: 1000px;
  cursor: pointer;

  &.mode-unpurchased {
    height: auto;
    cursor: default;
  }
}

/* ========== 正反面基础 ========== */
.card-face {
  position: absolute;
  inset: 0;
  background: var(--vk-card, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--vk-border, #e2e8f0);
  overflow: hidden;
  backface-visibility: hidden;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.card-front {
  transform: rotateY(0deg);
  z-index: 2;
}

.card-back {
  transform: rotateY(180deg);
  z-index: 1;
}

.is-flipped {
  .card-front {
    transform: rotateY(-180deg);
    z-index: 1;
  }
  .card-back {
    transform: rotateY(0deg);
    z-index: 2;
  }
}

/* unpurchased 模式：正面不绝对定位 */
.mode-unpurchased .card-front {
  position: relative;
}

/* hover 整体上浮 */
.product-card-wrapper:hover {
  .card-front:not(.is-flipped *) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: var(--vk-border, #e2e8f0);
  }
}

/* ========== 正面 — 图片 ========== */
.card-visual {
  position: relative;
  height: 160px;
  overflow: hidden;
  background: var(--vk-bg-muted);
  flex-shrink: 0;

  .product-image {
    width: 100%;
    height: 100%;
  }

  .image-placeholder {
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

    .image-placeholder__name {
      font-size: 14px;
      opacity: 0.85;
    }
  }
}

.floating-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
  z-index: 2;

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

  .custom-badge {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    background: #f59e0b;
    color: #fff;
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
}

/* ========== 正面 — 内容 ========== */
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.product-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--vk-text, #1e293b);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--vk-text-secondary, #64748b);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 定价栏 */
.pricing-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: var(--vk-bg-muted);
  border-radius: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;

  .pricing-item {
    text-align: center;

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
  }

  .pricing-sep {
    font-size: 14px;
    color: var(--vk-border, #e2e8f0);
  }
}

/* ========== 正面 — 未购买操作区 ========== */
.card-action {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--vk-border, #e2e8f0);

  .purchase-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .price-tag {
      display: flex;
      align-items: baseline;
      gap: 4px;

      .price-amount {
        font-size: 24px;
        font-weight: 700;
        color: var(--vk-text, #1e293b);
      }

      .price-unit {
        font-size: 13px;
        color: var(--vk-text-secondary, #64748b);
      }
    }
  }

  .purchased-block {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px;
    background: var(--vk-primary-soft);
    border-radius: 8px;
    color: var(--vk-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--vk-primary-light);
    }

    i {
      font-size: 16px;
    }

    .el-icon-arrow-right {
      margin-left: auto;
      font-size: 14px;
    }
  }

  .unavailable-block {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px;
    background: var(--vk-bg-muted);
    border-radius: 8px;
    color: var(--vk-text-secondary, #64748b);
    font-size: 13px;
  }
}

.action-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }
}

.primary-btn {
  background: var(--vk-primary) !important;
  border-color: var(--vk-primary) !important;
  color: #fff !important;

  &:hover {
    background: var(--vk-primary-hover) !important;
    border-color: var(--vk-primary-hover) !important;
  }
}

/* ========== 正面 — 已购买底部 ========== */
.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--vk-border, #e2e8f0);
  display: flex;
  justify-content: center;
}

.flip-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--vk-text-secondary, #64748b);
  font-size: 13px;

  i { font-size: 16px; }
}

/* ========== 背面 ========== */
.card-back {
  display: flex;
  flex-direction: column;
}

.back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  flex-shrink: 0;

  .back-header__title {
    font-size: 18px;
    font-weight: bold;
  }
}

.flip-hint-back {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  opacity: 0.9;

  i { font-size: 16px; }
}

.back-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.back-section {
  margin-bottom: 20px;

  &:last-child { margin-bottom: 0; }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: var(--vk-text, #1e293b);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--vk-primary);

  i {
    color: var(--vk-primary);
    font-size: 16px;
  }
}

/* 版本日志 */
.version-list {
  .version-item {
    padding: 12px;
    margin-bottom: 10px;
    background: var(--vk-bg-muted);
    border-radius: 6px;
    border-left: 3px solid var(--vk-primary);

    &:last-child { margin-bottom: 0; }
  }

  .version-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .version-date {
      font-size: 12px;
      color: var(--vk-text-secondary, #64748b);
    }
  }

  .version-log {
    font-size: 13px;
    color: var(--vk-text, #1e293b);
    line-height: 1.6;
  }
}

/* 下载区域 */
.download-area {
  padding-left: 4px;
}

/* 背面空状态 */
.back-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--vk-text-secondary, #64748b);

  i {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .back-empty__text {
    font-size: 14px;
  }
}
</style>

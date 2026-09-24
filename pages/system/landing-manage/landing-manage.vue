<template>
  <view class="page-body">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="top-bar__left">
        <text class="top-bar__title">{{ $t('admin.landing.title') }}</text>
        <text class="top-bar__desc">{{ $t('admin.landing.desc') }}</text>
      </view>
      <view class="top-bar__right">
        <el-button size="small" icon="el-icon-view" @click="previewPage">{{ $t('admin.landing.preview') }}</el-button>
        <el-button size="small" icon="el-icon-download" @click="loadPresets" :loading="presetLoading">{{ $t('admin.landing.loadPresets') }}</el-button>
        <el-button type="primary" size="small" icon="el-icon-check" @click="saveConfig" :loading="saving">{{ $t('admin.landing.saveConfig') }}</el-button>
      </view>
    </view>

    <!-- 区块列表 -->
    <view class="section-list" v-loading="loading">
      <view
        class="section-card"
        :class="{ 'section-card--disabled': !section.enable }"
        v-for="(section, index) in sections"
        :key="index"
      >
        <!-- 卡片头部 -->
        <view class="section-card__header" @click="toggleExpand(index)">
          <view class="section-card__left">
            <view class="section-card__icon" :style="{ background: sectionColors[section.type] }">
              {{ sectionIcons[section.type] }}
            </view>
            <view class="section-card__info">
              <text class="section-card__name">{{ $t('admin.landing.type.' + section.type) }}</text>
              <text class="section-card__tag">{{ section.type }}</text>
            </view>
          </view>
          <view class="section-card__right" @click.stop>
            <el-switch v-model="section.enable" size="small" />
            <view class="section-card__sort">
              <el-button class="sort-btn" size="mini" icon="el-icon-top" :disabled="index === 0" @click="moveUp(index)" circle />
              <el-button class="sort-btn" size="mini" icon="el-icon-bottom" :disabled="index === sections.length - 1" @click="moveDown(index)" circle />
            </view>
            <i class="expand-icon" :class="expandedIndex === index ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
          </view>
        </view>

        <!-- 卡片内容（可折叠） -->
        <view class="section-card__body" v-show="expandedIndex === index && section.enable">
          <!-- Hero -->
          <div v-if="section.type === 'hero'" class="editor-grid">
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldTitle') }}</label>
              <el-input v-model="section.data.title" type="textarea" :rows="2" :placeholder="$t('admin.landing.titlePlaceholder')" />
            </div>
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldSubtitle') }}</label>
              <el-input v-model="section.data.subtitle" type="textarea" :rows="2" :placeholder="$t('admin.landing.titlePlaceholder')" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldBgColor') }}</label>
              <div class="color-input">
                <el-color-picker v-model="section.data.bg_color" size="small" />
                <el-input v-model="section.data.bg_color" size="small" placeholder="#0a1628" />
              </div>
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldBtnPrimary') }}</label>
              <el-input v-model="section.data.btn_primary.text" size="small" :placeholder="$t('admin.landing.btnPlaceholder')" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldBtnGhost') }}</label>
              <el-input v-model="section.data.btn_ghost.text" size="small" :placeholder="$t('admin.landing.btnPlaceholder')" />
            </div>
          </div>

          <!-- 统计 -->
          <div v-if="section.type === 'stats'" class="editor-grid">
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldStats') }} <el-button size="mini" icon="el-icon-plus" @click="section.data.items.push({ num: '', label: '' })">{{ $t('admin.landing.add') }}</el-button></label>
              <div class="stat-items">
                <div class="stat-item" v-for="(item, i) in section.data.items" :key="i">
                  <el-input v-model="item.num" size="small" :placeholder="$t('admin.landing.numPlaceholder')" style="width: 100px;" />
                  <el-input v-model="item.label" size="small" :placeholder="$t('admin.landing.labelPlaceholder')" style="width: 140px;" />
                  <el-button size="mini" type="text" icon="el-icon-delete" @click="section.data.items.splice(i, 1)" />
                </div>
              </div>
            </div>
          </div>

          <!-- 功能卡片 -->
          <div v-if="section.type === 'features'" class="editor-grid">
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldTitle') }}</label>
              <el-input v-model="section.data.title" size="small" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldSubtitle') }}</label>
              <el-input v-model="section.data.subtitle" size="small" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldColumns') }}</label>
              <el-radio-group v-model="section.data.columns" size="small">
                <el-radio-button :label="2">2</el-radio-button>
                <el-radio-button :label="3">3</el-radio-button>
                <el-radio-button :label="4">4</el-radio-button>
              </el-radio-group>
            </div>
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldFeatures') }} <el-button size="mini" icon="el-icon-plus" @click="section.data.items.push({ icon: '', title: '', desc: '' })">{{ $t('admin.landing.add') }}</el-button></label>
              <div class="feature-items">
                <div class="feature-item" v-for="(item, i) in section.data.items" :key="i">
                  <el-input v-model="item.icon" size="small" :placeholder="$t('admin.landing.iconPlaceholder')" style="width: 56px;" />
                  <el-input v-model="item.title" size="small" :placeholder="$t('admin.landing.fieldTitle')" style="width: 120px;" />
                  <el-input v-model="item.desc" size="small" :placeholder="$t('admin.landing.fieldDesc')" style="flex: 1;" />
                  <el-button size="mini" type="text" icon="el-icon-delete" @click="section.data.items.splice(i, 1)" />
                </div>
              </div>
            </div>
          </div>

          <!-- 优势 -->
          <div v-if="section.type === 'advantages'" class="editor-grid">
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldTitle') }}</label>
              <el-input v-model="section.data.title" size="small" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldSubtitle') }}</label>
              <el-input v-model="section.data.subtitle" size="small" />
            </div>
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldAdvantages') }} <el-button size="mini" icon="el-icon-plus" @click="section.data.items.push({ title: '', desc: '' })">{{ $t('admin.landing.add') }}</el-button></label>
              <div class="advantage-items">
                <div class="advantage-item" v-for="(item, i) in section.data.items" :key="i">
                  <span class="advantage-num">{{ String(i + 1).padStart(2, '0') }}</span>
                  <el-input v-model="item.title" size="small" :placeholder="$t('admin.landing.fieldTitle')" style="width: 200px;" />
                  <el-input v-model="item.desc" size="small" :placeholder="$t('admin.landing.fieldDesc')" style="flex: 1;" />
                  <el-button size="mini" type="text" icon="el-icon-delete" @click="section.data.items.splice(i, 1)" />
                </div>
              </div>
            </div>
          </div>

          <!-- 产品展示 -->
          <div v-if="section.type === 'products'" class="editor-grid">
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldTitle') }}</label>
              <el-input v-model="section.data.title" size="small" :placeholder="$t('admin.landing.productsTitlePlaceholder')" />
            </div>
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldSubtitle') }}</label>
              <el-input v-model="section.data.subtitle" size="small" :placeholder="$t('admin.landing.productsSubtitlePlaceholder')" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldMaxShow') }}</label>
              <el-input-number v-model="section.data.max_show" :min="1" :max="12" size="small" />
            </div>
          </div>

          <!-- CTA -->
          <div v-if="section.type === 'cta'" class="editor-grid">
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldTitle') }}</label>
              <el-input v-model="section.data.title" size="small" />
            </div>
            <div class="editor-field editor-field--full">
              <label>{{ $t('admin.landing.fieldSubtitle') }}</label>
              <el-input v-model="section.data.subtitle" size="small" />
            </div>
            <div class="editor-field">
              <label>{{ $t('admin.landing.fieldBtnText') }}</label>
              <el-input v-model="section.data.btn_text" size="small" />
            </div>
          </div>
        </view>

        <!-- 禁用遮罩 -->
        <view class="section-card__mask" v-if="!section.enable">
          <text class="section-card__mask-text">{{ $t('admin.landing.disabled') }}</text>
        </view>
      </view>

      <el-empty v-if="!loading && sections.length === 0" :description="$t('admin.landing.empty')">
        <el-button type="primary" icon="el-icon-download" @click="loadPresets">{{ $t('admin.landing.loadPresets') }}</el-button>
      </el-empty>
    </view>
  </view>
</template>

<script>
let vk = uni.vk;

export default {
  data() {
    return {
      loading: false,
      saving: false,
      presetLoading: false,
      configId: '',
      sections: [],
      expandedIndex: 0,
      sectionIcons: {
        hero: '🎯',
        stats: '📊',
        features: '✨',
        advantages: '💎',
        products: '📦',
        cta: '🚀'
      },
      sectionColors: {
        hero: '#1e293b',
        stats: '#0ea5e9',
        features: '#8b5cf6',
        advantages: '#f59e0b',
        products: '#f97316',
        cta: '#10b981'
      }
    };
  },
  onLoad() {
    vk = this.vk;
    this.loadConfig();
  },
  methods: {
    // 加载配置
    loadConfig() {
      this.loading = true;
      vk.callFunction({
        url: 'admin/landing-page/sys/get',
        data: {},
        success: (res) => {
          if (res.data) {
            this.configId = res.data._id || '';
            this.sections = res.data.sections || [];
          }
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || this.$t('admin.common.loadFailed'), 'none');
        },
        complete: () => {
          this.loading = false;
        }
      });
    },

    // 保存配置
    saveConfig() {
      this.saving = true;
      vk.callFunction({
        url: 'admin/landing-page/sys/save',
        data: {
          _id: this.configId,
          sections: this.sections
        },
        success: (res) => {
          if (res.code === 0) {
            vk.toast(this.$t('admin.common.saved'));
            if (res.data && res.data._id) {
              this.configId = res.data._id;
            }
          } else {
            vk.toast(res.msg || this.$t('admin.common.saveFailed'), 'none');
          }
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || this.$t('admin.common.saveFailed'), 'none');
        },
        complete: () => {
          this.saving = false;
        }
      });
    },

    // 加载预设
    loadPresets() {
      this.$confirm(this.$t('admin.landing.presetConfirm'), this.$t('admin.common.confirm'), {
        confirmButtonText: this.$t('admin.common.ok'),
        cancelButtonText: this.$t('admin.common.cancel'),
        type: 'warning'
      }).then(() => {
        this.presetLoading = true;
        vk.callFunction({
          url: 'admin/landing-page/sys/initPresets',
          data: {},
          success: (res) => {
            if (res.code === 0) {
              vk.toast(res.msg || this.$t('admin.common.loadSuccess'));
              this.loadConfig();
            } else {
              vk.toast(res.msg || this.$t('admin.common.loadFailed'), 'none');
            }
          },
          fail: (err) => {
            vk.toast(err.msg || err.message || this.$t('admin.common.loadFailed'), 'none');
          },
          complete: () => {
            this.presetLoading = false;
          }
        });
      }).catch(() => {});
    },

    // 展开/折叠
    toggleExpand(index) {
      this.expandedIndex = this.expandedIndex === index ? -1 : index;
    },

    // 上移
    moveUp(index) {
      if (index <= 0) return;
      const temp = this.sections[index];
      this.$set(this.sections, index, this.sections[index - 1]);
      this.$set(this.sections, index - 1, temp);
      if (this.expandedIndex === index) this.expandedIndex = index - 1;
    },

    // 下移
    moveDown(index) {
      if (index >= this.sections.length - 1) return;
      const temp = this.sections[index];
      this.$set(this.sections, index, this.sections[index + 1]);
      this.$set(this.sections, index + 1, temp);
      if (this.expandedIndex === index) this.expandedIndex = index + 1;
    },

    // 预览落地页
    previewPage() {
      uni.navigateTo({ url: '/pages/landing/index' });
    }
  }
};
</script>

<style lang="scss" scoped>
.page-body {
  padding: 24px;
  background: var(--vk-bg);
  min-height: 100vh;
}

// 顶部操作栏
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  &__title {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: var(--vk-text);
  }

  &__desc {
    display: block;
    font-size: 13px;
    color: var(--vk-text-secondary, #64748b);
    margin-top: 4px;
  }

  &__right {
    display: flex;
    gap: 8px;
  }
}

// 区块卡片
.section-list {
  min-height: 200px;
}

.section-card {
  position: relative;
  background: var(--vk-card, #ffffff);
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--vk-border);
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: var(--vk-border);
  }

  &--disabled {
    opacity: 0.6;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--vk-bg-secondary);
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--vk-text);
  }

  &__tag {
    font-size: 12px;
    color: var(--vk-text-secondary, #64748b);
    background: var(--vk-bg-muted, #f1f5f9);
    padding: 2px 8px;
    border-radius: 4px;
    font-family: monospace;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__sort {
    display: flex;
    gap: 2px;
  }

  &__body {
    padding: 20px;
    border-top: 1px solid var(--vk-border);
    background: var(--vk-bg-secondary);
  }

  &__mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    border-radius: 12px;
  }

  &__mask-text {
    font-size: 13px;
    color: var(--vk-text-secondary, #64748b);
    background: var(--vk-bg-muted, #f1f5f9);
    padding: 4px 12px;
    border-radius: 4px;
  }
}

.sort-btn {
  padding: 4px !important;
  font-size: 12px !important;
}

.expand-icon {
  font-size: 14px;
  color: var(--vk-text-secondary, #64748b);
  margin-left: 4px;
}

// 编辑器网格
.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--vk-text-secondary, #64748b);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &--full {
    grid-column: 1 / -1;
  }
}

.color-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

// 统计项
.stat-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--vk-card, #ffffff);
  border: 1px solid var(--vk-border);
  border-radius: 8px;
}

// 功能卡片项
.feature-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--vk-card, #ffffff);
  border: 1px solid var(--vk-border);
  border-radius: 8px;
}

// 优势项
.advantage-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advantage-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--vk-card, #ffffff);
  border: 1px solid var(--vk-border);
  border-radius: 8px;
}

.advantage-num {
  font-size: 14px;
  font-weight: 700;
  color: var(--vk-primary, #3b82f6);
  min-width: 28px;
}
</style>

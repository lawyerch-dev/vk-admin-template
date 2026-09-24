<template>
  <view class="page-body">
    <!-- 公告管理 -->
    <el-card class="announcement-card">
      <div slot="header" class="card-header">
        <span>📢 {{ $t('admin.announce.title') }}</span>
        <el-button type="primary" size="small" @click="saveAnnouncement" :loading="loading">
          {{ $t('admin.announce.save') }}
        </el-button>
      </div>

      <el-form label-width="100px">
        <el-form-item :label="$t('admin.announce.fieldTitle')">
          <el-input v-model="form.title" :placeholder="$t('admin.announce.fieldTitlePlaceholder')"></el-input>
        </el-form-item>
        <el-form-item :label="$t('admin.announce.fieldSubtitle')">
          <el-input v-model="form.subtitle" :placeholder="$t('admin.announce.fieldSubtitlePlaceholder')"></el-input>
        </el-form-item>
        <el-form-item :label="$t('admin.announce.fieldEnabled')">
          <el-switch v-model="form.enabled" :active-text="$t('admin.common.enable')" :inactive-text="$t('admin.common.disable')"></el-switch>
        </el-form-item>
      </el-form>

      <el-divider>{{ $t('admin.announce.changelogDivider') }}</el-divider>

      <div class="changelog-editor">
        <div v-for="(log, index) in form.changelog" :key="index" class="changelog-item">
          <el-row :gutter="10" style="margin-bottom: 10px">
            <el-col :span="8">
              <el-input v-model="log.product_name" :placeholder="$t('admin.announce.logProductPlaceholder')"></el-input>
            </el-col>
            <el-col :span="5">
              <el-input v-model="log.version" :placeholder="$t('admin.announce.logVersionPlaceholder')"></el-input>
            </el-col>
            <el-col :span="6">
              <el-date-picker v-model="log.date" type="date" :placeholder="$t('admin.announce.logDate')" value-format="yyyy-MM-dd" style="width: 100%"></el-date-picker>
            </el-col>
            <el-col :span="5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="removeLog(index)">{{ $t('admin.common.delete') }}</el-button>
            </el-col>
          </el-row>
          <el-input v-model="log.items" type="textarea" :rows="4" :placeholder="$t('admin.announce.logItemsPlaceholder')"></el-input>
        </div>

        <el-button type="primary" icon="el-icon-plus" @click="addLog" style="margin-top: 15px">
          {{ $t('admin.announce.addLog') }}
        </el-button>
      </div>

      <!-- 预览区域 -->
      <el-divider>{{ $t('admin.announce.previewDivider') }}</el-divider>
      <div class="preview-section">
        <div class="preview-popup">
          <div class="preview-header">🎉 {{ $t('admin.announce.previewHeader') }}</div>
          <div class="preview-body">
            <p class="preview-title">{{ form.title || $t('admin.announce.previewTitleFallback') }}</p>
            <p class="preview-subtitle">{{ form.subtitle || $t('admin.announce.previewSubtitleFallback') }}</p>
            <div v-for="(log, index) in form.changelog" :key="index" class="preview-log-item">
              <div class="preview-log-header">
                <span class="preview-product">{{ log.product_name || $t('admin.announce.previewProductFallback') }}</span>
                <span class="preview-version" v-if="log.version">v{{ log.version }}</span>
                <span class="preview-date">{{ log.date }}</span>
              </div>
              <ul class="preview-log-content">
                <li v-for="(item, i) in (log.items || '').split('\n').filter(x => x.trim())" :key="i">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </view>
</template>

<script>
let vk = uni.vk;

export default {
  data() {
    return {
      loading: false,
      form: {
        enabled: true,
        title: '',
        subtitle: '',
        changelog: []
      }
    };
  },
  onLoad() {
    vk = this.vk;
    this.loadAnnouncement();
  },
  methods: {
    // 加载公告数据
    loadAnnouncement() {
      vk.callFunction({
        url: 'client/pub/getAnnouncement',
        title: this.$t('admin.common.loading'),
        success: (res) => {
          if (res.data) {
            this.form = res.data;
            if (!Array.isArray(this.form.changelog)) {
              this.form.changelog = [];
            }
          }
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || this.$t('admin.common.loadFailed'), 'none');
        }
      });
    },
    // 保存公告
    saveAnnouncement() {
      this.loading = true;
      vk.callFunction({
        url: 'admin/system_uni/global-data/sys/set',
        data: {
          key: 'announcement',
          value: this.form
        },
        success: () => {
          vk.toast(this.$t('admin.common.saved'));
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || this.$t('admin.common.saveFailed'), 'none');
        },
        complete: () => {
          this.loading = false;
        }
      });
    },
    // 添加更新日志
    addLog() {
      this.form.changelog.unshift({
        product_name: '',
        version: '',
        date: new Date().toISOString().split('T')[0],
        items: ''
      });
    },
    // 删除更新日志
    removeLog(index) {
      this.form.changelog.splice(index, 1);
    }
  }
};
</script>

<style lang="scss" scoped>
.page-body {
  padding: 20px;
}
.announcement-card {
  max-width: 1000px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.changelog-item {
  background: var(--vk-bg-muted, #f5f7fa);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 3px solid var(--vk-primary, #409eff);
}

/* 预览区域样式 */
.preview-section {
  display: flex;
  justify-content: flex-end;
}
.preview-popup {
  width: 400px;
  background: var(--vk-card, #ffffff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.preview-header {
  padding: 14px 18px;
  background: linear-gradient(135deg, #4facfe 55%, var(--vk-bg-secondary, #e1e8f2) 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
.preview-body {
  padding: 16px 18px;
  max-height: 300px;
  overflow-y: auto;
}
.preview-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vk-text);
  margin: 0 0 8px 0;
  line-height: 1.4;
}
.preview-subtitle {
  font-size: 13px;
  color: var(--vk-text-secondary, #64748b);
  margin: 0 0 16px 0;
}
.preview-log-item {
  background: var(--vk-bg-muted, #f8f9fa);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border-left: 3px solid var(--vk-primary, #409eff);
  &:last-child {
    margin-bottom: 0;
  }
}
.preview-log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.preview-product {
  font-size: 13px;
  font-weight: 600;
  color: #f56c6c;
}
.preview-version {
  font-size: 12px;
  color: var(--vk-primary, #409eff);
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.preview-date {
  font-size: 12px;
  color: var(--vk-text-secondary, #64748b);
}
.preview-log-content {
  margin: 0;
  padding-left: 16px;
  list-style: none;
  li {
    font-size: 13px;
    color: var(--vk-text);
    line-height: 1.6;
    margin-bottom: 4px;
    position: relative;
    &::before {
      content: '•';
      position: absolute;
      left: -12px;
      color: var(--vk-primary, #409eff);
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>

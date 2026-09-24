<template>
  <el-dialog
    :title="$t('admin.stats.dedup.title')"
    :visible.sync="visible"
    width="800px"
    :close-on-click-modal="false"
  >
    <div style="margin-bottom: 20px;">
      <el-alert
        :title="$t('admin.stats.dedup.alertTitle')"
        type="info"
        show-icon
        :closable="false"
      >
        <div style="margin-top: 5px;">
          {{ $t('admin.stats.dedup.alertDesc') }}
        </div>
      </el-alert>
    </div>

    <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
      <el-radio-group v-model="dryRun" :disabled="loading || deleting">
        <el-radio-button :label="true">{{ $t('admin.stats.dedup.previewMode') }}</el-radio-button>
        <el-radio-button :label="false">{{ $t('admin.stats.dedup.deleteMode') }}</el-radio-button>
      </el-radio-group>
      <el-button
        type="primary"
        @click="scanDuplicateCards"
        :loading="loading"
        :disabled="deleting"
      >
        <i class="el-icon-search"></i> {{ $t('admin.stats.dedup.startScan') }}
      </el-button>
    </div>

    <div v-if="loading" class="detail-loading">
      <i class="el-icon-loading"></i> {{ $t('admin.stats.dedup.scanning') }}
    </div>

    <div v-else-if="result">
      <!-- 扫描结果摘要 -->
      <el-card shadow="never" style="margin-bottom: 15px;">
        <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.dedup.scanResult') }}</div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item :label="$t('admin.stats.dedup.totalRecords')">{{ result.total }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.dedup.uniqueCodes')">{{ result.unique_codes }}</el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.dedup.duplicateCodes')">
            <span :style="{ color: result.duplicates_count > 0 ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">
              {{ result.duplicates_count }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('admin.stats.dedup.toDelete')" :span="3">
            <span :style="{ color: result.to_delete_count > 0 ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">
              {{ result.to_delete_count }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 重复详情列表 -->
      <el-card shadow="never" v-if="result.details && result.details.length > 0">
        <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.dedup.detailHeader') }}</div>
        <el-table :data="result.details" border stripe size="small" max-height="300">
          <el-table-column prop="card_code" :label="$t('admin.stats.dedup.colCode')" width="200">
            <template slot-scope="scope">
              <span style="font-family: monospace; font-weight: 500;">{{ scope.row.card_code }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="count" :label="$t('admin.stats.dedup.colCount')" width="100" align="center">
            <template slot-scope="scope">
              <el-tag type="danger" size="mini">{{ $t('admin.stats.dedup.countUnit', { n: scope.row.count }) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.stats.dedup.colKeep')" min-width="200">
            <template slot-scope="scope">
              <div style="font-size: 12px;">
                <div>ID: {{ scope.row.keep._id }}</div>
                <div style="color: var(--vk-text-secondary, #64748b);">{{ $t('admin.stats.dedup.timeLabel') }} {{ formatTime(scope.row.keep._add_time) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.stats.dedup.colDelete')" min-width="200">
            <template slot-scope="scope">
              <div style="font-size: 12px;">
                <div v-for="(del, idx) in scope.row.delete_list" :key="idx" style="margin-bottom: 4px;">
                  <span style="color: #F56C6C;">{{ del._id }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 执行删除按钮 -->
      <div v-if="!dryRun && result.to_delete_count > 0" style="margin-top: 20px; text-align: center;">
        <el-button
          type="danger"
          size="large"
          @click="executeRemoveDuplicateCards"
          :loading="deleting"
        >
          <i class="el-icon-delete"></i> {{ $t('admin.stats.dedup.confirmDelete', { n: result.to_delete_count }) }}
        </el-button>
      </div>
    </div>

    <div v-else style="text-align: center; padding: 40px; color: var(--vk-text-secondary, #64748b);">
      <i class="el-icon-info" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>{{ $t('admin.stats.dedup.selectModeHint') }}</div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ $t('admin.common.close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formatDateTime } from '../utils/format.js';

let vk = uni.vk;

export default {
  name: 'RemoveDuplicateDialog',
  data() {
    return {
      visible: false,
      loading: false,
      deleting: false,
      dryRun: true,
      result: null,
    };
  },
  methods: {
    open() {
      this.visible = true;
      this.dryRun = true;
      this.result = null;
    },
    formatTime(ts) {
      return formatDateTime(ts);
    },
    async scanDuplicateCards() {
      this.loading = true;
      this.result = null;
      try {
        const res = await vk.callFunction({
          url: 'admin/card/sys/removeDuplicateCards',
          data: { dry_run: this.dryRun },
        });
        if (res.code === 0) {
          this.result = res.data;
          if (this.dryRun) {
            vk.toast(this.$t('admin.stats.dedup.previewDone', { n: res.data.duplicates_count || 0 }), 'info');
          } else {
            vk.toast(res.msg, 'success');
          }
        } else {
          vk.toast(res.msg || this.$t('admin.stats.dedup.scanFailed'), 'none');
        }
      } catch (err) {
        console.error('扫描重复卡密失败：', err);
        vk.toast(this.$t('admin.stats.dedup.scanFailed') + '：' + (err.message || this.$t('admin.common.unknownError')), 'none');
      } finally {
        this.loading = false;
      }
    },
    async executeRemoveDuplicateCards() {
      const toDeleteCount = this.result?.to_delete_count || 0;
      if (toDeleteCount === 0) return;
      try {
        await this.$confirm(
          this.$t('admin.stats.dedup.deleteConfirm', { n: toDeleteCount }),
          this.$t('admin.stats.dedup.deleteTitle'),
          {
            confirmButtonText: this.$t('admin.stats.dedup.deleteOk'),
            cancelButtonText: this.$t('admin.common.cancel'),
            type: 'danger',
          }
        );
      } catch {
        return;
      }
      this.deleting = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/card/sys/removeDuplicateCards',
          data: { dry_run: false },
        });
        if (res.code === 0) {
          vk.toast(res.msg, 'success');
          this.result = res.data;
          setTimeout(() => {
            this.scanDuplicateCards();
          }, 500);
        } else {
          vk.toast(res.msg || this.$t('admin.stats.dedup.deleteFailed'), 'none');
        }
      } catch (err) {
        console.error('删除重复卡密失败：', err);
        vk.toast(this.$t('admin.stats.dedup.deleteFailed') + '：' + (err.message || this.$t('admin.common.unknownError')), 'none');
      } finally {
        this.deleting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.detail-loading {
  text-align: center;
  padding: 40px;
  color: var(--vk-text-secondary, #64748b);
}
</style>

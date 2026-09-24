<template>
  <el-dialog
    :title="$t('admin.stats.blacklist.title')"
    :visible.sync="visible"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 添加黑名单 -->
    <el-card shadow="never" style="margin-bottom: 15px;">
      <div slot="header" style="font-weight: 500;">{{ $t('admin.stats.blacklist.addTitle') }}</div>
      <el-form :inline="true" :model="form" size="small">
        <el-form-item :label="$t('admin.stats.blacklist.userId')" required>
          <el-input
            v-model="form.user_id"
            :placeholder="$t('admin.stats.blacklist.userIdPlaceholder')"
            clearable
            style="width: 250px;"
            @keyup.enter.native="addBlacklist"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('admin.stats.blacklist.reason')">
          <el-input
            v-model="form.reason"
            :placeholder="$t('admin.stats.blacklist.reasonPlaceholder')"
            clearable
            style="width: 250px;"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="addBlacklist" :loading="adding">
            <i class="el-icon-plus"></i> {{ $t('admin.stats.blacklist.addBtn') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 黑名单列表 -->
    <el-card shadow="never">
      <div slot="header" style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-weight: 500;">{{ $t('admin.stats.blacklist.listTitle') }}</span>
        <el-button type="primary" size="mini" icon="el-icon-refresh" @click="loadBlacklist" :loading="loading">{{ $t('admin.stats.blacklist.refresh') }}</el-button>
      </div>
      <div v-if="loading" style="text-align: center; padding: 30px;">
        <i class="el-icon-loading"></i> {{ $t('admin.common.loading') }}
      </div>
      <el-table
        v-else
        :data="list"
        border
        stripe
        size="small"
        max-height="400"
      >
        <el-table-column prop="user_id" :label="$t('admin.stats.blacklist.userId')" width="220">
          <template slot-scope="scope">
            <span style="font-family: monospace; font-weight: 500; color: #F56C6C;">{{ scope.row.user_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="$t('admin.stats.blacklist.reason')" min-width="200">
          <template slot-scope="scope">
            {{ scope.row.reason || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="_add_time_str" :label="$t('admin.stats.blacklist.addTime')" width="180"></el-table-column>
        <el-table-column :label="$t('admin.common.action')" width="100" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" style="color: #67C23A;" @click="removeBlacklist(scope.row)">{{ $t('admin.stats.blacklist.unban') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && list.length === 0" style="text-align: center; padding: 30px; color: var(--vk-text-secondary, #64748b);">
        {{ $t('admin.stats.blacklist.empty') }}
      </div>
    </el-card>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ $t('admin.common.close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formatDateTime } from '../utils/format.js';

let vk = uni.vk;

export default {
  name: 'BlacklistDialog',
  data() {
    return {
      visible: false,
      loading: false,
      adding: false,
      list: [],
      form: {
        user_id: '',
        reason: '',
      },
    };
  },
  methods: {
    open() {
      this.visible = true;
      this.form = { user_id: '', reason: '' };
      this.loadBlacklist();
    },
    handleClose() {
      // 弹窗关闭时重置状态
    },
    async loadBlacklist() {
      this.loading = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/blacklist/sys/getList',
          data: { pageSize: 200 },
        });
        if (res.code === 0) {
          this.list = (res.data && res.data.rows) || [];
          this.list.forEach(item => {
            item._add_time_str = formatDateTime(item._add_time);
          });
        } else {
          vk.toast(res.msg || this.$t('admin.common.loadFailed'), 'none');
        }
      } catch (err) {
        console.error('加载黑名单失败：', err);
        vk.toast(this.$t('admin.common.loadFailed'), 'none');
      } finally {
        this.loading = false;
      }
    },
    async addBlacklist() {
      const user_id = (this.form.user_id || '').trim();
      if (!user_id) {
        vk.toast(this.$t('admin.stats.blacklist.errUserRequired'), 'none');
        return;
      }
      this.adding = true;
      try {
        const res = await vk.callFunction({
          url: 'admin/blacklist/sys/add',
          data: {
            user_id,
            reason: (this.form.reason || '').trim(),
          },
        });
        if (res.code === 0) {
          vk.toast(res.msg || this.$t('admin.common.addSuccess'), 'success');
          this.form = { user_id: '', reason: '' };
          this.loadBlacklist();
        } else {
          vk.toast(res.msg || this.$t('admin.common.addFailed'), 'none');
        }
      } catch (err) {
        console.error('添加黑名单失败：', err);
        vk.toast(this.$t('admin.common.addFailed'), 'none');
      } finally {
        this.adding = false;
      }
    },
    async removeBlacklist(row) {
      try {
        await this.$confirm(
          this.$t('admin.stats.blacklist.unbanConfirm', { id: row.user_id }),
          this.$t('admin.stats.blacklist.unbanTitle'),
          {
            confirmButtonText: this.$t('admin.stats.blacklist.unbanOk'),
            cancelButtonText: this.$t('admin.common.cancel'),
            type: 'warning',
          }
        );
      } catch {
        return;
      }
      try {
        const res = await vk.callFunction({
          url: 'admin/blacklist/sys/delete',
          data: { _id: row._id },
        });
        if (res.code === 0) {
          vk.toast(res.msg || this.$t('admin.stats.blacklist.unbanned'), 'success');
          this.loadBlacklist();
        } else {
          vk.toast(res.msg || this.$t('admin.common.actionFailed'), 'none');
        }
      } catch (err) {
        console.error('移除黑名单失败：', err);
        vk.toast(this.$t('admin.common.actionFailed'), 'none');
      }
    },
  },
};
</script>

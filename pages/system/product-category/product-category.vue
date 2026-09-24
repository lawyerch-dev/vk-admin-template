<template>
  <view class="page-body">
    <el-card>
      <div slot="header" class="card-header">
        <span>{{ $t('admin.category.title') }}</span>
        <div>
          <el-button size="small" icon="el-icon-download" @click="loadPresets" :loading="presetLoading">{{ $t('admin.category.loadPresets') }}</el-button>
          <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">{{ $t('admin.category.add') }}</el-button>
        </div>
      </div>

      <el-table :data="categoryList" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="sort" :label="$t('admin.category.colSort')" width="80" align="center" />
        <el-table-column prop="icon" :label="$t('admin.category.colIcon')" width="80" align="center">
          <template slot-scope="scope">
            <i :class="scope.row.icon" style="font-size: 20px;" v-if="scope.row.icon"></i>
            <span v-else style="color: var(--vk-text-muted);">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="value" :label="$t('admin.category.colValue')" width="160">
          <template slot-scope="scope">
            <el-tag size="small" type="info">{{ scope.row.value }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="label" :label="$t('admin.category.colLabel')" min-width="150" />
        <el-table-column prop="enable" :label="$t('admin.category.colStatus')" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enable ? 'success' : 'danger'" size="small">
              {{ scope.row.enable ? $t('admin.common.enabled') : $t('admin.common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="_add_time" :label="$t('admin.category.colCreateTime')" width="170">
          <template slot-scope="scope">
            {{ formatTime(scope.row._add_time) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.common.action')" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" icon="el-icon-edit" @click="handleEdit(scope.row)">{{ $t('admin.common.edit') }}</el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDelete(scope.row)">{{ $t('admin.common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialog.isEdit ? $t('admin.category.editTitle') : $t('admin.category.addTitle')"
      :visible.sync="dialog.show"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" :rules="dialog.rules" ref="categoryForm" label-width="100px">
        <el-form-item :label="$t('admin.category.colValue')" prop="value">
          <el-input
            v-model="dialog.form.value"
            :placeholder="$t('admin.category.valuePlaceholder')"
            :disabled="dialog.isEdit"
          />
          <div class="form-tip">{{ $t('admin.category.valueTip') }}</div>
        </el-form-item>
        <el-form-item :label="$t('admin.category.colLabel')" prop="label">
          <el-input v-model="dialog.form.label" :placeholder="$t('admin.category.labelPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.category.colIcon')">
          <el-input v-model="dialog.form.icon" :placeholder="$t('admin.category.iconPlaceholder')" />
          <div class="form-tip">
            <i :class="dialog.form.icon" style="margin-right: 4px;" v-if="dialog.form.icon"></i>
            {{ $t('admin.category.iconTip') }}
          </div>
        </el-form-item>
        <el-form-item :label="$t('admin.category.colSort')">
          <el-input-number v-model="dialog.form.sort" :min="0" :max="999" />
          <div class="form-tip">{{ $t('admin.category.sortTip') }}</div>
        </el-form-item>
        <el-form-item :label="$t('admin.category.fieldEnable')">
          <el-switch v-model="dialog.form.enable" :active-text="$t('admin.common.yes')" :inactive-text="$t('admin.common.no')" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialog.show = false">{{ $t('admin.common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="dialog.loading">{{ $t('admin.common.ok') }}</el-button>
      </span>
    </el-dialog>
  </view>
</template>

<script>
let vk = uni.vk;

export default {
  data() {
    return {
      loading: false,
      presetLoading: false,
      categoryList: [],
      dialog: {
        show: false,
        isEdit: false,
        loading: false,
        editId: '',
        form: {
          value: '',
          label: '',
          icon: '',
          sort: 0,
          enable: true
        },
        rules: {
          value: [{ required: true, message: this.$t('admin.category.ruleValue'), trigger: 'blur' }],
          label: [{ required: true, message: this.$t('admin.category.ruleLabel'), trigger: 'blur' }]
        }
      }
    };
  },
  onLoad() {
    vk = this.vk;
    this.loadCategories();
  },
  methods: {
    // 加载分类列表
    loadCategories() {
      this.loading = true;
      vk.callFunction({
        url: 'admin/product-category/sys/getList',
        data: {},
        success: (res) => {
          const rows = res.rows || (res.data && res.data.rows) || [];
          this.categoryList = rows;
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || this.$t('admin.common.loadFailed'), 'none');
        },
        complete: () => {
          this.loading = false;
        }
      });
    },

    // 加载预设分类
    loadPresets() {
      this.presetLoading = true;
      vk.callFunction({
        url: 'admin/product-category/sys/initPresets',
        data: {},
        success: (res) => {
          if (res.code === 0) {
            vk.toast(res.msg || this.$t('admin.common.loadSuccess'));
            this.loadCategories();
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
    },

    // 打开新增弹窗
    handleAdd() {
      this.dialog.isEdit = false;
      this.dialog.editId = '';
      this.dialog.form = {
        value: '',
        label: '',
        icon: '',
        sort: 0,
        enable: true
      };
      this.dialog.show = true;
      this.$nextTick(() => {
        this.$refs.categoryForm && this.$refs.categoryForm.clearValidate();
      });
    },

    // 打开编辑弹窗
    handleEdit(row) {
      this.dialog.isEdit = true;
      this.dialog.editId = row._id;
      this.dialog.form = {
        value: row.value,
        label: row.label,
        icon: row.icon || '',
        sort: row.sort || 0,
        enable: !!row.enable
      };
      this.dialog.show = true;
      this.$nextTick(() => {
        this.$refs.categoryForm && this.$refs.categoryForm.clearValidate();
      });
    },

    // 提交表单
    handleSubmit() {
      this.$refs.categoryForm.validate((valid) => {
        if (!valid) return;

        this.dialog.loading = true;

        if (this.dialog.isEdit) {
          // 编辑
          vk.callFunction({
            url: 'admin/product-category/sys/update',
            data: {
              _id: this.dialog.editId,
              label: this.dialog.form.label,
              icon: this.dialog.form.icon,
              sort: Number(this.dialog.form.sort),
              enable: this.dialog.form.enable
            },
            success: (res) => {
              vk.toast(this.$t('admin.common.updateSuccess'));
              this.dialog.show = false;
              this.loadCategories();
            },
            fail: (err) => {
              vk.toast(err.msg || err.message || this.$t('admin.common.updateFailed'), 'none');
            },
            complete: () => {
              this.dialog.loading = false;
            }
          });
        } else {
          // 新增
          vk.callFunction({
            url: 'admin/product-category/sys/add',
            data: {
              value: this.dialog.form.value,
              label: this.dialog.form.label,
              icon: this.dialog.form.icon,
              sort: Number(this.dialog.form.sort),
              enable: this.dialog.form.enable
            },
            success: (res) => {
              vk.toast(this.$t('admin.common.addSuccess'));
              this.dialog.show = false;
              this.loadCategories();
            },
            fail: (err) => {
              vk.toast(err.msg || err.message || this.$t('admin.common.addFailed'), 'none');
            },
            complete: () => {
              this.dialog.loading = false;
            }
          });
        }
      });
    },

    // 删除分类
    handleDelete(row) {
      this.$confirm(this.$t('admin.category.deleteConfirm', { name: row.label }), this.$t('admin.category.deleteTitle'), {
        confirmButtonText: this.$t('admin.category.deleteOk'),
        cancelButtonText: this.$t('admin.common.cancel'),
        type: 'warning'
      }).then(() => {
        vk.callFunction({
          url: 'admin/product-category/sys/delete',
          data: { _id: row._id },
          success: (res) => {
            vk.toast(this.$t('admin.common.deleteSuccess'));
            this.loadCategories();
          },
          fail: (err) => {
            vk.toast(err.msg || err.message || this.$t('admin.common.deleteFailed'), 'none');
          }
        });
      }).catch(() => {});
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '-';
      const d = new Date(timestamp);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.page-body {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.form-tip {
  font-size: 12px;
  color: var(--vk-text-secondary, #64748b);
  line-height: 1.5;
  margin-top: 4px;
}
</style>

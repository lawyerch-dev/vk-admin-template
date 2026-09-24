<template>
  <el-dialog
    :title="$t('card.editTitle')"
    :visible.sync="dialogVisible"
    width="700px"
    :close-on-click-modal="false"
    custom-class="edit-dialog-custom"
  >
    <div class="edit-dialog-content">
      <el-tabs v-model="activeTab">
        <!-- 备注设置 -->
        <el-tab-pane :label="$t('card.tab.remark')" name="remark" v-if="cardId">
          <el-input
            v-model="localRemark"
            type="textarea"
            :rows="5"
            :placeholder="$t('card.remarkPlaceholder')"
            maxlength="500"
            show-word-limit
            style="margin-top: 20px;"
          />
        </el-tab-pane>

        <!-- 字段顺序 -->
        <el-tab-pane :label="$t('card.tab.columns')" name="columns">
          <div class="columns-tab-content">
            <div class="columns-tip">
              {{ $t('card.columnsTip') }}
            </div>
            <div
              class="column-sort-list"
              @wheel.stop
              @touchmove.stop
            >
              <div
                v-for="(col, index) in localColumns"
                :key="col.key"
                class="column-sort-item"
                :class="{
                  'drag-active': dragIndex === index,
                  'drag-over': dragOverIndex === index && dragIndex !== index
                }"
                :draggable="true"
                @dragstart="handleDragStart(index)"
                @dragover.prevent="handleDragOver(index)"
                @drop="handleDrop(index)"
                @dragenter.prevent="handleDragEnter(index)"
                @dragleave="handleDragLeave"
                @dragend="handleDragEnd"
              >
                <i class="el-icon-rank drag-handle"></i>
                <span class="column-title">{{ col.title }}</span>
                <div class="column-actions">
                  <el-button
                    type="text"
                    :disabled="index === 0"
                    @click="moveColumn(index, 'up')"
                    size="mini"
                  >{{ $t('card.moveUp') }}</el-button>
                  <el-button
                    type="text"
                    :disabled="index === localColumns.length - 1"
                    @click="moveColumn(index, 'down')"
                    size="mini"
                  >{{ $t('card.moveDown') }}</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">{{ $t('card.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ $t('card.confirm') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'EditDialog',
  props: {
    visible: { type: Boolean, default: false },
    cardId: { type: String, default: null },
    remark: { type: String, default: '' },
    columns: { type: Array, default: () => [] },
  },
  data() {
    return {
      activeTab: 'remark',
      localRemark: '',
      localColumns: [],
      dragIndex: -1,
      dragOverIndex: -1,
    };
  },
  computed: {
    dialogVisible: {
      get() { return this.visible; },
      set(val) { this.$emit('update:visible', val); },
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.localRemark = this.remark;
        this.localColumns = JSON.parse(JSON.stringify(this.columns));
        this.activeTab = this.cardId ? 'remark' : 'columns';
      }
    },
  },
  methods: {
    moveColumn(index, direction) {
      const cols = this.localColumns;
      if (direction === 'up' && index > 0) {
        this.$set(cols, index, cols[index - 1]);
        this.$set(cols, index - 1, cols[index]);
      } else if (direction === 'down' && index < cols.length - 1) {
        this.$set(cols, index, cols[index + 1]);
        this.$set(cols, index + 1, cols[index]);
      }
    },
    handleDragStart(index) { this.dragIndex = index; },
    handleDragEnter(index) {
      if (this.dragIndex !== -1 && this.dragIndex !== index) {
        this.dragOverIndex = index;
      }
    },
    handleDragOver(index) {
      if (this.dragIndex !== -1 && this.dragIndex !== index) {
        this.dragOverIndex = index;
      }
    },
    handleDragLeave() { this.dragOverIndex = -1; },
    handleDragEnd() {
      this.dragIndex = -1;
      this.dragOverIndex = -1;
    },
    handleDrop(dropIndex) {
      const dragIndex = this.dragIndex;
      if (dragIndex === -1 || dragIndex === dropIndex) {
        this.dragIndex = -1;
        this.dragOverIndex = -1;
        return;
      }
      const cols = [...this.localColumns];
      const item = cols.splice(dragIndex, 1)[0];
      cols.splice(dropIndex, 0, item);
      this.localColumns = cols;
      this.dragIndex = -1;
      this.dragOverIndex = -1;
    },
    handleSave() {
      this.$emit('save', {
        cardId: this.cardId,
        remark: this.localRemark,
        columns: this.localColumns,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .edit-dialog-custom {
  .el-dialog {
    margin-top: 5vh !important;
    margin-bottom: 5vh !important;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 20px;
    min-height: 0;
    max-height: calc(90vh - 120px);
  }
}

.edit-dialog-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  ::v-deep .el-tabs {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;

    .el-tabs__header { flex-shrink: 0; }

    .el-tabs__content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .el-tab-pane {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }
}

.columns-tab-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.columns-tip {
  color: var(--vk-text-secondary, #64748b);
  font-size: 12px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.column-sort-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px;
  min-height: 0;
  height: 0;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb {
    background: var(--vk-border, #e2e8f0);
    border-radius: 3px;
    &:hover { background: var(--vk-text-muted, #94a3b8); }
  }
  &::-webkit-scrollbar-track {
    background: var(--vk-bg-muted, #f1f5f9);
    border-radius: 3px;
  }

  .column-sort-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--vk-card, #ffffff);
    border: 1px solid var(--vk-border, #e2e8f0);
    border-top: 2px solid transparent;
    border-radius: 6px;
    transition: all 0.2s;
    cursor: move;
    user-select: none;

    &:hover {
      border-color: var(--vk-primary, #409eff);
      background: var(--vk-primary-light, #ecf5ff);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }

    &.drag-active {
      opacity: 0.5;
      background: var(--vk-bg-muted, #f1f5f9);
    }

    &.drag-over {
      border-top: 2px solid var(--vk-primary, #409eff) !important;
      background: var(--vk-primary-light, #ecf5ff);
    }

    .drag-handle {
      color: var(--vk-text-secondary, #64748b);
      font-size: 18px;
      cursor: move;
      flex-shrink: 0;
      &:hover { color: var(--vk-primary, #409eff); }
    }

    .column-title {
      flex: 1;
      font-size: 14px;
      color: var(--vk-text, #1e293b);
      font-weight: 500;
    }

    .column-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;

      .el-button {
        padding: 4px 8px;
        &.is-disabled { opacity: 0.4; cursor: not-allowed; }
      }
    }
  }
}
</style>

<template>
  <view class="page-body">
    <!-- 数据统计卡片 -->
    <stats-cards :items="statsItems" :stats="stats" />

    <!-- 表格搜索组件 -->
    <vk-data-table-query
      v-model="queryForm1.formData"
      :columns="queryForm1.columns"
      @search="search"
    >
      <!-- 自定义时间筛选插槽 -->
      <template v-slot:time_filter>
        <div style="display: flex; gap: 10px; align-items: center;">
          <el-select
            v-model="queryForm1.formData.time_field"
            :placeholder="$t('card.query.timeTypePlaceholder')"
            clearable
            style="width: 120px;"
          >
            <el-option :label="$t('card.query.buyTime')" value="_add_time"></el-option>
            <el-option :label="$t('card.query.activateTime')" value="activate_time"></el-option>
            <el-option :label="$t('card.query.expireTime')" value="expire_time"></el-option>
          </el-select>
          <el-date-picker
            v-model="queryForm1.formData.time_range"
            type="datetimerange"
            :range-separator="$t('card.query.rangeTo')"
            :start-placeholder="$t('card.query.startDate')"
            :end-placeholder="$t('card.query.endDate')"
            value-format="timestamp"
            clearable
            style="width: 300px;"
          >
          </el-date-picker>
        </div>
      </template>
      
      <template slot="right-btns">
        <el-button
          type="success"
          icon="el-icon-circle-plus-outline"
          @click="addBtn"
          >{{ $t('card.buy') }}</el-button>
        <el-button
          type="info"
          icon="el-icon-setting"
          @click="batchSetPrefixSuffixBtn"
          :disabled="table1.multipleSelection.length === 0"
          >{{ $t('card.batchSetPrefixSuffix') }}</el-button>
        <el-button
          type="warning"
          icon="el-icon-download"
          @click="exportBtn"
          :disabled="table1.multipleSelection.length === 0"
          >{{ $t('card.export') }}</el-button>
        <el-button
          type="danger"
          icon="el-icon-delete"
          @click="batchDeleteBtn"
          :disabled="table1.multipleSelection.length === 0"
          >{{ $t('card.batchDelete') }}</el-button>
      </template>
    </vk-data-table-query>

    <!-- 表格组件 -->
    <vk-data-table
      ref="table1"
      :action="table1.action"
      :columns="table1.columns"
      :query-form-param="queryForm1"
      :right-btns="['delete']"
      :custom-right-btns="table1.customRightBtns"
      :row-no="true"
      :pagination="true"
      :selection="true"
      @delete="deleteBtn"
      @selection-change="selectionChange"
    >
      <!-- 卡密列 -->
      <template v-slot:key="{ row }">
        <div class="card-code-cell">
          <span 
            class="code-text" 
            @dblclick="copyCode(row.card_code)"
            :title="$t('card.copyTip', { code: row.card_code })"
          >
            {{ row.card_code }}
          </span>
          <el-tooltip :content="$t('card.clickToCopy')" placement="top">
            <i 
              class="el-icon-document-copy copy-icon"
              @click="copyCode(row.card_code)"
            ></i>
          </el-tooltip>
        </div>
      </template>

      <!-- 状态列 -->
      <template v-slot:status_text="{ row }">
        <el-tag :type="row.status_color || 'info'" size="small">
          {{ formatStatusText(row.status_text) }}
        </el-tag>
      </template>

      <!-- 产品类型列 -->
      <template v-slot:product_type="{ row }">
        <el-tag
          :type="row.product_type === 'software' ? 'primary' : 'success'"
          size="small"
        >
          {{ row.product_type === "software" ? $t('card.productType.software') : $t('card.productType.plugin') }}
        </el-tag>
      </template>
    </vk-data-table>

    <!-- 购买卡密弹窗 -->
    <purchase-dialog
      ref="purchaseDialog"
      :show.sync="purchaseDialogVisible"
      :product-list="productList"
      :user-points="userPoints"
      :machine-stats="stats"
      @success="onPurchaseSuccess"
      @go-to-points-shop="goToPointsShop"
      @update-query-options="onUpdateQueryOptions"
    />

    <!-- 编辑弹窗 -->
    <edit-dialog
      :visible.sync="editDialog.visible"
      :card-id="editDialog.cardId"
      :remark="editDialog.remark"
      :columns="editDialog.columns"
      @save="onEditSave"
    />

    <!-- 批量设置前缀后缀弹窗 -->
    <el-dialog
      :title="$t('card.batchSetTitle')"
      :visible.sync="batchSetDialog.visible"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-set-dialog-content">
        <div class="batch-set-tip">
          <i class="el-icon-info"></i>
          <span>{{ $t('card.batchSetTip', { count: table1.multipleSelection.length }) }}</span>
        </div>
        <el-form :model="batchSetDialog.form" label-width="120px">
          <el-form-item :label="$t('card.field.prefix')">
            <el-input
              v-model="batchSetDialog.form.prefix"
              :placeholder="$t('card.field.prefixPlaceholder')"
              maxlength="20"
              clearable
            >
              <template slot="prepend">{{ $t('card.field.prefixLabel') }}</template>
            </el-input>
            <div class="form-tip">{{ $t('card.field.prefixTip') }}</div>
          </el-form-item>
          <el-form-item :label="$t('card.field.suffix')">
            <el-input
              v-model="batchSetDialog.form.suffix"
              :placeholder="$t('card.field.suffixPlaceholder')"
              maxlength="20"
              clearable
            >
              <template slot="prepend">{{ $t('card.field.suffixLabel') }}</template>
            </el-input>
            <div class="form-tip">{{ $t('card.field.suffixTip') }}</div>
          </el-form-item>
          <el-form-item :label="$t('card.field.preview')">
            <div class="preview-box">
              <div class="preview-label">{{ $t('card.field.sampleCode') }}</div>
              <div class="preview-code">
                <span class="preview-prefix">{{ batchSetDialog.form.prefix || '' }}</span>
                <span class="preview-original">a7f83b63d5f244c7bcdb4987e5694ac7</span>
                <span class="preview-suffix">{{ batchSetDialog.form.suffix || '' }}</span>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="batchSetDialog.visible = false">{{ $t('card.cancel') }}</el-button>
        <el-button type="primary" @click="saveBatchSetPrefixSuffix">{{ $t('card.confirm') }}</el-button>
      </span>
    </el-dialog>

  </view>
</template>

<script>
let that;
let vk = uni.vk;

import StatsCards from '@/components/stats-cards/index.vue';
import PurchaseDialog from './components/PurchaseDialog.vue';
import EditDialog from './components/EditDialog.vue';

export default {
  components: { StatsCards, PurchaseDialog, EditDialog },
  filters: {
    timeFormat(timestamp) {
      if (!timestamp) return "-";
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN", { hour12: false });
    },
  },
  data() {
    return {
      loading: false,
      purchaseDialogVisible: false,
      stats: {
        total: 0,
        unused: 0,
        used: 0,
        expired: 0,
      },
      // 编辑弹窗
      editDialog: {
        visible: false,
        remark: "",
        cardId: null,
        columns: [],
        originalColumns: [],
      },
      // 批量设置前缀后缀弹窗
      batchSetDialog: {
        visible: false,
        form: {
          prefix: "",
          suffix: "",
        },
      },
      // 统计卡片配置
      statsItems: [],
      // 产品列表
      productList: [],
      // 用户积分信息（从 store 响应式读取）
      // userPoints -> computed
      // 用户绑定机器统计（已合并到 stats.total_machines）
      table1: {
        action: "admin/card/kh/getList",
        columns: [],
        multipleSelection: [],
        customRightBtns: [],
      },
      queryForm1: {
        formData: {
          time_field: "_add_time", // 默认筛选购买时间
        },
        columns: [],
      },
    };
  },
  computed: {
    userPoints() { return this.$store.state.$user.pointsInfo; },
  },
  watch: {
    '$i18n.locale'() {
      that.applyI18n();
    },
  },
  onLoad(options = {}) {
    that = this;
    vk = that.vk;
    that.applyI18n();
    that.init();
  },
  methods: {
    // 初始化多语言文案（表头、按钮、筛选项等）
    applyI18n() {
      const currentKeys = (that.table1.columns || []).map((c) => c.key);
      const builtColumns = that.buildTableColumns();
      if (currentKeys.length > 0) {
        const byKey = {};
        builtColumns.forEach((c) => { byKey[c.key] = c; });
        const ordered = [];
        currentKeys.forEach((k) => { if (byKey[k]) ordered.push(byKey[k]); });
        builtColumns.forEach((c) => {
          if (!currentKeys.includes(c.key)) ordered.push(c);
        });
        that.table1.columns = ordered;
      } else {
        that.table1.columns = builtColumns;
      }

      const prevQueryData = {};
      (that.queryForm1.columns || []).forEach((c) => {
        if (c.data) prevQueryData[c.key] = c.data;
      });
      that.queryForm1.columns = that.buildQueryColumns().map((c) => {
        if (prevQueryData[c.key]) c.data = prevQueryData[c.key];
        return c;
      });
      that.statsItems = that.buildStatsItems();
      that.table1.customRightBtns = that.buildCustomRightBtns();
    },
    buildStatsItems() {
      return [
        { key: "total", label: that.$t('card.stats.total'), color: "var(--vk-text, #1e293b)" },
        { key: "unused", label: that.$t('card.stats.unused'), color: "#67C23A" },
        { key: "used", label: that.$t('card.stats.used'), color: "var(--vk-text-secondary, #64748b)" },
        { key: "expired", label: that.$t('card.stats.expired'), color: "#F56C6C" },
      ];
    },
    buildTableColumns() {
      return [
        {
          key: "key",
          title: that.$t('card.table.cardCode'),
          type: "text",
          width: 300,
          slot: true,
        },
        { key: "product_name", title: that.$t('card.table.productName'), type: "text", width: 150 },
        {
          key: "product_type",
          title: that.$t('card.table.productType'),
          type: "text",
          width: 100,
          slot: true,
        },
        {
          key: "status_text",
          title: that.$t('card.table.status'),
          type: "text",
          width: 100,
          slot: true,
        },
        { key: "limit_days_str", title: that.$t('card.table.limitDays'), type: "text", width: 100 },
        {
          key: "max_machine_str",
          title: that.$t('card.table.maxMachine'),
          type: "text",
          width: 100,
          defaultValue: "-",
        },
        {
          key: "current_machine_count",
          title: that.$t('card.table.bound'),
          type: "text",
          width: 100,
          defaultValue: "0",
        },
        {
          key: "total_times_str",
          title: that.$t('card.table.totalTimes'),
          type: "text",
          width: 100,
          defaultValue: "-",
        },
        { key: "_add_time", title: that.$t('card.table.buyTime'), type: "time", width: 180 },
        {
          key: "activate_time_str",
          title: that.$t('card.table.activateTime'),
          type: "text",
          width: 180,
          defaultValue: "-",
        },
        {
          key: "expire_time_str",
          title: that.$t('card.table.expireTime'),
          type: "text",
          width: 180,
          defaultValue: "-",
        },
        {
          key: "remark",
          title: that.$t('card.table.remark'),
          type: "text",
          width: 200,
          defaultValue: "-",
        },
      ];
    },
    buildCustomRightBtns() {
      return [
        {
          title: that.$t('card.renew'),
          icon: "el-icon-refresh",
          type: "warning",
          onClick: (item) => that.renewBtn({ item }),
          show: () => true, // 所有卡密都可以续费
        },
        {
          title: that.$t('card.edit'),
          icon: "el-icon-edit",
          type: "primary",
          onClick: (item) => that.editBtn({ item }),
          show: () => true, // 所有卡密都可以编辑
        },
      ];
    },
    buildQueryColumns() {
      return [
        {
          key: "card_code",
          type: "text",
          title: that.$t('card.table.cardCode'),
          placeholder: that.$t('card.query.cardCodePlaceholder'),
          mode: "%%",
          col: { span: 5 },
        },
        {
          key: "product_name",
          type: "select",
          title: that.$t('card.query.product'),
          placeholder: that.$t('card.query.productPlaceholder'),
          data: [],
          col: { span: 4 },
          mode: "=",
        },
        {
          key: "status_text",
          type: "select",
          title: that.$t('card.table.status'),
          placeholder: that.$t('card.query.statusPlaceholder'),
          // value 保持中文，与后端查询条件一致
          data: [
            { value: "未激活", label: that.$t('card.status.unused') },
            { value: "使用中", label: that.$t('card.status.active') },
            { value: "已过期", label: that.$t('card.status.expired') },
            { value: "次数用完", label: that.$t('card.status.timesUp') },
          ],
          col: { span: 2 },
        },
        {
          key: "time_filter",
          type: "slot",
          title: that.$t('card.query.timeFilter'),
          col: { span: 8 },
        },
      ];
    },
    formatStatusText(statusText) {
      const map = {
        "未激活": 'card.status.unused',
        "使用中": 'card.status.active',
        "已过期": 'card.status.expired',
        "次数用完": 'card.status.timesUp',
      };
      const key = map[statusText];
      return key ? that.$t(key) : (statusText || that.$t('card.status.unknown'));
    },
    formatProductType(productType) {
      return productType === "software"
        ? that.$t('card.productType.software')
        : that.$t('card.productType.plugin');
    },
    // 初始化
    async init() {
      await that.loadProducts();
      that.loadColumnOrder();
      that.loadStats();
      that.$store.dispatch('$user/loadPointsInfo');
    },
    // 加载字段顺序
    loadColumnOrder() {
      const savedOrder = uni.getStorageSync('card_columns_order');
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        const currentColumns = that.table1.columns || [];
        const columnMap = {};
        currentColumns.forEach(col => {
          columnMap[col.key] = col;
        });
        
        const orderedColumns = [];
        savedOrder.forEach(key => {
          if (columnMap[key]) {
            orderedColumns.push(columnMap[key]);
          }
        });
        
        // 添加未在保存顺序中的字段
        currentColumns.forEach(col => {
          if (!savedOrder.includes(col.key)) {
            orderedColumns.push(col);
          }
        });
        
        that.table1.columns = orderedColumns;
      }
    },
    // 加载产品列表（只加载已购买的产品）
    async loadProducts() {
      const res = await vk.callFunction({
        url: "admin/product/kh/getList",
      });

      if (res.code === 0 && res.data) {
        // 只筛选当前用户已购买的产品
        const purchasedProducts = res.data.filter(product => {
          // 必须是已购买的产品（is_purchased=true）
          return product.is_purchased === true;
        });
        
        that.productList = purchasedProducts;
        
        // 为表单准备产品选项（使用 product_id + product_name 作为唯一标识）
        const formProductOptions = purchasedProducts.map((p) => ({
          value: JSON.stringify({ product_id: p.product_id, product_name: p.product_name }),
          label: p.product_name,
        }));
        
        // 为筛选准备产品选项（使用 product_name，因为 product_id 不是唯一值）
        const queryProductOptions = purchasedProducts.map((p) => ({
          value: p.product_name,
          label: p.product_name,
        }));
        
        // 更新子组件和查询组件的产品选项
        if (that.$refs.purchaseDialog) {
          that.$refs.purchaseDialog.updateFormProductOptions(formProductOptions, queryProductOptions);
        }
        // 更新查询组件的产品选项
        const queryCol = that.queryForm1.columns.find((c) => c.key === "product_name");
        if (queryCol) {
          that.$set(queryCol, 'data', queryProductOptions);
        }
      }
    },
    // 加载统计数据
    loadStats() {
      vk.callFunction({
        url: "admin/card/kh/getStats",
        success: (data) => (that.stats = data),
      });
    },
    // 加载用户积分（从 store 响应式读取）
    loadUserPoints() {
      that.$store.dispatch('$user/loadPointsInfo', { force: true });
    },
    // 跳转到积分商城
    goToPointsShop() {
      that.purchaseDialogVisible = false;
      setTimeout(() => {
        uni.navigateTo({
          url: "/pages/points-shop/index",
          fail: (err) => {
            console.error('跳转失败：', err);
            vk.toast(that.$t('card.navFailed'));
          }
        });
      }, 100);
    },
    // 搜索
    search(obj) {
      that.$refs.table1.query(obj);
    },
    // 刷新（批量调用）
    refresh() {
      that.$refs.table1.refresh();
      that.loadStats();
      that.$store.dispatch('$user/loadPointsInfo', { force: true });
    },
    // 显示积分不足提示（提取公共逻辑）
    showInsufficientPointsAlert(neededPoints) {
      const deficit = neededPoints - that.userPoints.available_points;
      that
        .$alert(that.$t('card.pointsInsufficient', { points: deficit }), that.$t('card.tip'), {
          confirmButtonText: that.$t('card.confirm'),
          customClass: 'vk-confirm-box'
        })
        .then(() => {
          that.goToPointsShop();
        })
        .catch(() => {});
    },
    // 多选变化
    selectionChange(list) {
      that.table1.multipleSelection = list;
    },
    // 购买卡密
    async addBtn() {
      const firstProduct = that.productList?.[0];
      if (!firstProduct) {
        that
          .$alert(that.$t('card.noProduct'), that.$t('card.tip'), {
            confirmButtonText: that.$t('card.confirm'),
            customClass: 'vk-confirm-box'
          })
          .then(() => {
            uni.navigateTo({ url: "/pages/my-products/index" });
          })
          .catch(() => {});
        return;
      }

      // 准备购买类型选项，过滤掉体验卡（days <= 7）
      let validDaysOptions = [];
      if (firstProduct.valid_days_options && firstProduct.valid_days_options.length > 0) {
        validDaysOptions = firstProduct.valid_days_options
          .filter((opt) => opt.days > 7)
          .map((opt) => ({ value: opt.days, label: opt.label }));
      }

      that.$refs.purchaseDialog.openAdd(firstProduct, validDaysOptions);
    },
    // 编辑
    editBtn({ item }) {
      that.editDialog.cardId = item._id;
      that.editDialog.remark = item.remark || "";
      
      // 初始化字段顺序列表（从当前表格配置复制）
      const currentColumns = that.table1.columns || [];
      that.editDialog.originalColumns = vk.pubfn.copyObject(currentColumns);
      
      // 尝试从localStorage加载保存的字段顺序
      const savedOrder = uni.getStorageSync('card_columns_order');
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        const orderedColumns = [];
        const columnMap = {};
        currentColumns.forEach(col => { columnMap[col.key] = col; });
        savedOrder.forEach(key => { if (columnMap[key]) orderedColumns.push(columnMap[key]); });
        currentColumns.forEach(col => { if (!savedOrder.includes(col.key)) orderedColumns.push(col); });
        that.editDialog.columns = orderedColumns;
      } else {
        that.editDialog.columns = vk.pubfn.copyObject(currentColumns);
      }
      
      that.editDialog.visible = true;
    },
    // 续费
    async renewBtn({ item }) {
      const product = that.productList.find((p) => 
        p.product_id === item.product_id && 
        (!item.product_name || p.product_name === item.product_name)
      );

      // 刷新积分
      await that.loadUserPoints();

      // 准备续费天数选项
      let renewOptions = [];
      if (product && product.valid_days_options && product.valid_days_options.length > 0) {
        renewOptions = product.valid_days_options
          .filter((opt) => opt.days > 7)
          .map((opt) => ({ value: opt.days, label: opt.label }));
      }

      that.$refs.purchaseDialog.openRenew(item, product, renewOptions);
    },
    // 删除
    deleteBtn({ item, deleteFn }) {
      that
        .$confirm(
          that.$t('card.deleteConfirm', { code: item.card_code }),
          that.$t('card.tip'),
          {
            confirmButtonText: that.$t('card.confirm'),
            cancelButtonText: that.$t('card.cancel'),
            customClass: 'vk-confirm-box',
            distinguishCancelAndClose: true
          }
        )
        .then(() => {
          deleteFn({
            action: "admin/card/kh/delete",
            data: { _id: item._id },
          });
        })
        .catch(() => {});
    },
    // 批量删除
    batchDeleteBtn() {
      if (that.table1.multipleSelection.length === 0) {
        return vk.toast(that.$t('card.selectToDelete'));
      }
      that
        .$confirm(
          that.$t('card.batchDeleteConfirm', { count: that.table1.multipleSelection.length }),
          that.$t('card.tip'),
          {
            confirmButtonText: that.$t('card.confirm'),
            cancelButtonText: that.$t('card.cancel'),
            customClass: 'vk-confirm-box',
            distinguishCancelAndClose: true
          }
        )
        .then(() => {
          vk.callFunction({
            url: "admin/card/kh/batchDelete",
            data: {
              ids: that.table1.multipleSelection.map((item) => item._id),
            },
            success: () => {
              vk.toast(that.$t('card.deleteSuccess'));
              that.refresh();
            },
          });
        })
        .catch(() => {});
    },
    // 批量设置前缀后缀
    batchSetPrefixSuffixBtn() {
      if (that.table1.multipleSelection.length === 0) {
        return vk.toast(that.$t('card.selectToSet'));
      }
      // 重置表单
      that.batchSetDialog.form = {
        prefix: "",
        suffix: "",
      };
      that.batchSetDialog.visible = true;
    },
    // 保存批量设置前缀后缀
    saveBatchSetPrefixSuffix() {
      const { prefix, suffix } = that.batchSetDialog.form;
      
      // 如果前缀和后缀都为空，提示用户
      if (!prefix && !suffix) {
        return vk.toast(that.$t('card.needPrefixOrSuffix'));
      }
      
      that
        .$confirm(
          that.$t('card.batchSetConfirm', { count: that.table1.multipleSelection.length }),
          that.$t('card.tip'),
          {
            confirmButtonText: that.$t('card.confirm'),
            cancelButtonText: that.$t('card.cancel'),
            customClass: 'vk-confirm-box',
            distinguishCancelAndClose: true
          }
        )
        .then(() => {
            // 计算新的卡密并逐个更新
            const updatePromises = that.table1.multipleSelection.map((item) => {
              const originalCode = item.card_code || '';
              // 去除原有的前缀和后缀（如果存在）
              let codeWithoutPrefixSuffix = originalCode;

              // 构建新的卡密
              const newCode = (prefix || '') + codeWithoutPrefixSuffix + (suffix || '');

              return vk.callFunction({
                url: "admin/card/kh/update",
                data: {
                  _id: item._id,
                  card_code: newCode,
                },
              });
            });
            
            Promise.all(updatePromises).then(() => {
              vk.toast(that.$t('card.setSuccess'));
              that.batchSetDialog.visible = false;
              that.refresh();
            }).catch((err) => {
              console.error('批量设置失败：', err);
              vk.toast(that.$t('card.setFailed'));
            });
        })
        .catch(() => {});
    },
    // 导出卡密
    exportBtn() {
      if (that.table1.multipleSelection.length === 0) {
        return vk.toast(that.$t('card.selectToExport'));
      }
      // 处理导出数据：映射字段并转换格式
      const exportData = that.table1.multipleSelection.map(item => {
        const processedItem = { ...item };
        // 将 card_code 映射到 key（卡密列配置的 key 是 "key"）
        if (item.card_code !== undefined) {
          processedItem.key = item.card_code;
        }
        // 通过 product_id + product_name 从产品列表中查找产品类型
        if (item.product_id && that.productList && that.productList.length > 0) {
          const product = that.productList.find(p => 
            p.product_id === item.product_id && 
            (!item.product_name || p.product_name === item.product_name)
          );
          if (product && product.product_type) {
            // 转换产品类型：software -> 软件，plugin -> 插件
            processedItem.product_type = that.formatProductType(product.product_type);
          } else {
            processedItem.product_type = that.$t('card.productType.plugin'); // 默认值
          }
        } else if (item.product_type !== undefined) {
          // 如果数据中已有 product_type，直接转换
          processedItem.product_type = that.formatProductType(item.product_type);
        } else {
          processedItem.product_type = that.$t('card.productType.plugin'); // 默认值
        }
        return processedItem;
      });
      that.$refs.table1.exportExcel({
        fileName: that.$t('card.exportFileName'),
        title: that.$t('card.exporting'),
        data: exportData,
      });
    },
    // 复制卡密
    copyCode(code) {
      // 去除前后空格
      const trimmedCode = code ? String(code).trim() : '';
      if (!trimmedCode) {
        return vk.toast(that.$t('card.codeEmpty'));
      }
      uni.setClipboardData({
        data: trimmedCode,
        success: () => vk.toast(that.$t('card.copySuccess')),
      });
    },
    // 购买/续费成功回调
    onPurchaseSuccess(formType) {
      vk.toast(formType === 'renew' ? that.$t('card.renewSuccess') : that.$t('card.actionSuccess'));
      that.refresh();
    },
    // 编辑保存回调
    onEditSave({ cardId, remark, columns }) {
      if (cardId) {
        vk.callFunction({
          url: 'admin/card/kh/updateRemark',
          data: { _id: cardId, remark },
          success: () => {
            const columnOrder = columns.map(col => col.key);
            uni.setStorageSync('card_columns_order', columnOrder);
            that.table1.columns = JSON.parse(JSON.stringify(columns));
            vk.toast(that.$t('card.saveSuccess'));
            that.editDialog.visible = false;
            that.refresh();
          }
        });
      } else {
        const columnOrder = columns.map(col => col.key);
        uni.setStorageSync('card_columns_order', columnOrder);
        that.table1.columns = JSON.parse(JSON.stringify(columns));
        vk.toast(that.$t('card.columnsOrderSaved'));
        that.editDialog.visible = false;
      }
    },
    // 更新查询组件的产品选项
    onUpdateQueryOptions(queryOptions) {
      const queryCol = that.queryForm1.columns.find((c) => c.key === "product_name");
      if (queryCol) {
        that.$set(queryCol, 'data', queryOptions);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.page-body {
	padding: 20px;
}

/* 卡密单元格 */
.card-code-cell {
	display: flex;
	align-items: center;
	gap: 8px;

	.code-text {
		font-family: 'Courier New', monospace;
		font-weight: 500;
		color: var(--vk-primary, #409eff);
		cursor: pointer;
		user-select: all;
		padding: 4px 8px;
		border-radius: 4px;
		transition: all 0.3s;

		&:hover {
			background: var(--vk-primary-light, #ecf5ff);
			color: var(--vk-primary-hover, #66b1ff);
		}

		&:active {
			background: var(--vk-primary-soft, #d9ecff);
		}
	}

	.copy-icon {
		color: var(--vk-text-secondary, #64748b);
		font-size: 16px;
		cursor: pointer;
		transition: all 0.3s;
		padding: 4px;
		border-radius: 4px;

		&:hover {
			color: var(--vk-primary, #409eff);
			background: var(--vk-primary-light, #ecf5ff);
			transform: scale(1.1);
		}

		&:active {
			transform: scale(0.95);
		}
	}
}

/* 批量设置前缀后缀弹窗样式 */
.batch-set-dialog-content {
	.batch-set-tip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: var(--vk-primary-light, #ecf5ff);
		border: 1px solid var(--vk-primary-border, #b3d8ff);
		border-radius: 4px;
		margin-bottom: 20px;
		color: var(--vk-primary, #409eff);
		font-size: 14px;

		i {
			font-size: 16px;
		}
	}

	.form-tip {
		color: var(--vk-text-secondary, #64748b);
		font-size: 12px;
		margin-top: 6px;
		line-height: 1.5;
	}

	.preview-box {
		padding: 12px 16px;
		background: var(--vk-bg-muted, #f1f5f9);
		border-radius: 4px;
		border: 1px solid var(--vk-border, #e2e8f0);

		.preview-label {
			color: var(--vk-text, #1e293b);
			font-size: 13px;
			margin-bottom: 8px;
		}

		.preview-code {
			display: flex;
			align-items: center;
			font-family: 'Courier New', monospace;
			font-size: 14px;
			word-break: break-all;

			.preview-prefix {
				color: #FF3333;
				font-weight: bold;
			}

			.preview-original {
				color: var(--vk-primary, #409eff);
				font-weight: 500;
			}

			.preview-suffix {
				color: #FF6600;
				font-weight: bold;
			}
		}
	}
}

// ==================== 全局样式 (非 scoped) ====================

/* 日期选择器样式优化 */
.el-picker-panel.el-date-range-picker {
	transform: scale(0.85);
	transform-origin: top right;

	.el-picker-panel__body {
		min-width: auto;
	}

	.el-date-table td {
		padding: 2px 0;
		font-size: 12px;

		.cell {
			height: 26px;
			line-height: 26px;
		}
	}

	.el-picker-panel__sidebar {
		width: 80px;

		.el-picker-panel__shortcut {
			font-size: 12px;
			line-height: 26px;
			padding: 3px 6px;
		}
	}

	.el-date-range-picker__header {
		font-size: 13px;

		button {
			font-size: 12px;
		}
	}

	.el-time-panel {
		font-size: 12px;
	}
}

</style>

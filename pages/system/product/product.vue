<template>
  <view class="page-body">
    <!-- 表格搜索组件 -->
    <vk-data-table-query
      v-model="queryForm1.formData"
      :columns="queryForm1.columns"
      @search="search"
    >
      <template slot="right-btns">
        <el-button
          v-if="isAdmin"
          type="success"
          icon="el-icon-circle-plus-outline"
          @click="addBtn"
          >{{ $t('admin.product.add') }}</el-button
        >
        <el-button
          v-if="isAdmin"
          type="primary"
          icon="el-icon-edit"
          @click="batchEditBtn"
          :disabled="table1.multipleSelection.length === 0"
          >{{ $t('admin.product.batchEdit') }}</el-button
        >

      </template>
    </vk-data-table-query>

    <!-- 表格组件 -->
    <vk-data-table
      ref="table1"
      :action="table1.action"
      :columns="table1.columns"
      :query-form-param="queryForm1"
      :right-btns="isAdmin ? ['update', 'delete'] : []"
      :custom-right-btns="isAdmin ? table1.customRightBtns : []"
      :row-no="true"
      :pagination="true"
      :selection="isAdmin"
      @update="editBtn"
      @delete="deleteBtn"
      @selection-change="selectionChange"
    >
      <!-- 产品图列 -->
      <template v-slot:product_image="{ row }">
        <el-image
          v-if="getImageUrl(row.product_image)"
          :src="getImageUrl(row.product_image)"
          :preview-src-list="[getImageUrl(row.product_image)]"
          style="width: 80px; height: 80px; border-radius: 4px"
          fit="cover"
        >
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
        <div v-else class="no-image">
          <i class="el-icon-picture-outline"></i>
        </div>
      </template>

      <!-- 状态列 -->
      <template v-slot:status="{ row }">
        <el-switch
          v-model="row.status"
          :active-value="1"
          :inactive-value="0"
          :active-text="$t('admin.product.statusOn')"
          :inactive-text="$t('admin.product.statusOff')"
          @change="changeStatus(row)"
        ></el-switch>
      </template>

      <!-- 收费标准列 -->
      <template v-slot:price_standard="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'price_standard'"
          @click.stop
          @keyup.esc.native="cancelCellEdit"
          style="display: flex; gap: 5px; align-items: center;"
          tabindex="0"
        >
          <el-input-number
            v-model="editingCell.priceData.price_points"
            :min="1"
            size="mini"
            style="flex: 1"
            :controls="false"
            :placeholder="$t('admin.product.phPoints')"
            @keyup.esc.native="cancelCellEdit"
            @blur="handlePriceStandardBlur(row)"
          ></el-input-number>
          <span style="color: var(--vk-text-secondary, #64748b); font-size: 12px;">{{ $t('admin.product.unitPoints') }} /</span>
          <el-input-number
            v-model="editingCell.priceData.price_months"
            :min="1"
            size="mini"
            style="flex: 1"
            :controls="false"
            :placeholder="$t('admin.product.phMonths')"
            @keyup.esc.native="cancelCellEdit"
            @blur="handlePriceStandardBlur(row)"
          ></el-input-number>
          <span style="color: var(--vk-text-secondary, #64748b); font-size: 12px;">{{ $t('admin.product.unitMonths') }} /</span>
          <el-input-number
            v-model="editingCell.priceData.price_machines"
            :min="1"
            size="mini"
            style="flex: 1"
            :controls="false"
            :placeholder="$t('admin.product.phMachines')"
            @keyup.esc.native="cancelCellEdit"
            @blur="handlePriceStandardBlur(row)"
          ></el-input-number>
          <span style="color: var(--vk-text-secondary, #64748b); font-size: 12px;">{{ $t('admin.product.unitMachines') }}</span>
          <el-button
            type="primary"
            size="mini"
            icon="el-icon-check"
            @click="savePriceStandard(row)"
            style="margin-left: 5px;"
          ></el-button>
          <el-button
            type="default"
            size="mini"
            icon="el-icon-close"
            @click="cancelCellEdit"
          ></el-button>
        </div>
        <div
          v-else
          @dblclick="startPriceStandardEdit(row)"
          style="cursor: pointer; min-height: 40px;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : ''"
        >
          <div style="color: #e6a23c; font-weight: bold">
            {{ $t('admin.product.priceStandardText', {
              points: row.price_points,
              months: row.price_months,
              machines: row.price_machines
            }) }}
          </div>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 4px;">
            {{ $t('admin.product.unitPrice', { price: calculateBasePrice(row) }) }}
          </div>
        </div>
      </template>

      <!-- 产品名称列 -->
      <template v-slot:product_name="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'product_name'"
          @click.stop
          :data-editing-cell="`${row._id}-product_name`"
        >
          <el-input
            v-model="editingCell.value"
            size="mini"
            @blur="handleBlur(row, 'product_name')"
            @keyup.enter.native="saveCellEdit(row)"
            @keyup.esc.native="cancelCellEdit"
            autofocus
          ></el-input>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'product_name', row.product_name)"
          style="cursor: pointer; min-height: 20px;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : ''"
        >
          {{ row.product_name }}
        </div>
      </template>

      <!-- 产品描述列 -->
      <template v-slot:description="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'description'"
          @click.stop
          :data-editing-cell="`${row._id}-description`"
        >
          <el-input
            v-model="editingCell.value"
            type="textarea"
            :rows="2"
            size="mini"
            @blur="handleBlur(row, 'description')"
            @keyup.ctrl.enter.native="saveCellEdit(row)"
            @keyup.esc.native="cancelCellEdit"
            autofocus
          ></el-input>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'description', row.description || '')"
          style="cursor: pointer; min-height: 20px; word-break: break-word;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : (row.description || '')"
        >
          {{ row.description || '-' }}
        </div>
      </template>

      <!-- 下载地址列 -->
      <template v-slot:download_url="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'download_url'"
          @click.stop
          :data-editing-cell="`${row._id}-download_url`"
        >
          <el-input
            v-model="editingCell.value"
            size="mini"
            @blur="handleBlur(row, 'download_url')"
            @keyup.enter.native="saveCellEdit(row)"
            @keyup.esc.native="cancelCellEdit"
            autofocus
          ></el-input>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'download_url', row.download_url || '')"
          style="cursor: pointer; min-height: 20px; word-break: break-all;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : (row.download_url || '')"
        >
          {{ row.download_url || '-' }}
        </div>
      </template>

      <!-- 详情文档列 -->
      <template v-slot:detail_url="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'detail_url'"
          @click.stop
          :data-editing-cell="`${row._id}-detail_url`"
        >
          <el-input
            v-model="editingCell.value"
            size="mini"
            :placeholder="$t('admin.product.phDocLink')"
            @blur="handleBlur(row, 'detail_url')"
            @keyup.enter.native="saveCellEdit(row)"
            @keyup.esc.native="cancelCellEdit"
            autofocus
          ></el-input>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'detail_url', row.detail_url || '')"
          style="cursor: pointer; min-height: 20px; word-break: break-all;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : (row.detail_url || '')"
        >
          <el-link
            v-if="row.detail_url"
            :href="row.detail_url"
            target="_blank"
            type="primary"
            icon="el-icon-document"
          >
            {{ $t('admin.product.viewDoc') }}
          </el-link>
          <span v-else style="color: var(--vk-text-secondary, #64748b);">-</span>
        </div>
      </template>

      <!-- 购买价格列 -->
      <template v-slot:buy_price="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'buy_price'"
          @click.stop
          :data-editing-cell="`${row._id}-buy_price`"
        >
          <el-input-number
            v-model="editingCell.value"
            :min="0"
            size="mini"
            style="width: 100%"
            @blur="handleBlur(row, 'buy_price')"
            @keyup.enter.native="saveCellEdit(row)"
            @keyup.esc.native="cancelCellEdit"
            :controls="false"
            autofocus
          ></el-input-number>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'buy_price', row.buy_price || 0)"
          style="cursor: pointer; min-height: 20px;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : ''"
        >
          <div v-if="row.buy_price && row.buy_price > 0" style="color: #67C23A; font-weight: bold">
            {{ $t('admin.product.buyPriceText', { n: row.buy_price }) }}
          </div>
          <div v-else style="color: var(--vk-text-secondary, #64748b); font-size: 12px;">
            {{ $t('admin.product.notPurchasable') }}
          </div>
        </div>
      </template>

      <!-- 可见范围列 -->
      <template v-slot:custom_user_ids="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'custom_user_ids'"
          @click.stop
          :data-editing-cell="`${row._id}-custom_user_ids`"
        >
          <el-select
            v-model="editingCell.value"
            multiple
            filterable
            :placeholder="$t('admin.product.phSelectUsers')"
            size="mini"
            style="width: 100%"
            @visible-change="(visible) => !visible && handleSelectBlur(row, 'custom_user_ids')"
            @keyup.esc.native="cancelCellEdit"
          >
            <el-option
              key="all"
              :label="$t('admin.product.optionAllPublic')"
              value="all"
            >
              <span style="float: left; font-weight: bold; color: #67C23A;">
                <i class="el-icon-user"></i> {{ $t('admin.product.optionAllPublic') }}
              </span>
            </el-option>
            <el-option disabled value="">{{ $t('admin.product.optionSpecifiedUsers') }}</el-option>
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="`${user.nickname || user.username} (${user.username})`"
              :value="user._id"
            >
              <span style="float: left">{{
                user.nickname || user.username
              }}</span>
              <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{
                user.username
              }}</span>
            </el-option>
          </el-select>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'custom_user_ids', row.custom_user_ids || [])"
          style="cursor: pointer; min-height: 20px;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : ''"
        >
          <el-tag
            v-if="!row.custom_user_ids || row.custom_user_ids.length === 0"
            type="info"
            size="small"
          >
            {{ $t('admin.product.invisibleAll') }}
          </el-tag>
          <el-tag
            v-else-if="row.custom_user_ids.includes('all')"
            type="success"
            size="small"
          >
            {{ $t('admin.product.public') }}
          </el-tag>
          <el-tag v-else type="warning" size="small">
            {{ $t('admin.product.specifiedUsers', { n: row.custom_user_ids.length }) }}
          </el-tag>
        </div>
      </template>

      <!-- 特殊价格用户列 -->
      <template v-slot:special_price_user_ids="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'special_price_user_ids'"
          @click.stop
          :data-editing-cell="`${row._id}-special_price_user_ids`"
        >
          <el-select
            v-model="editingCell.value"
            multiple
            filterable
            :placeholder="$t('admin.product.phSelectSpecialUsers')"
            size="mini"
            style="width: 100%"
            @visible-change="(visible) => !visible && handleSelectBlur(row, 'special_price_user_ids')"
            @keyup.esc.native="cancelCellEdit"
          >
            <el-option disabled value="">{{ $t('admin.product.optionSpecialUsers') }}</el-option>
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="`${user.nickname || user.username} (${user.username})`"
              :value="user._id"
            >
              <span style="float: left">{{
                user.nickname || user.username
              }}</span>
              <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{
                user.username
              }}</span>
            </el-option>
          </el-select>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'special_price_user_ids', row.special_price_user_ids || [])"
          style="cursor: pointer; min-height: 20px;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : ''"
        >
          <el-tag
            v-if="!row.special_price_user_ids || row.special_price_user_ids.length === 0"
            type="info"
            size="small"
          >
            {{ $t('admin.common.none') }}
          </el-tag>
          <el-tag v-else type="success" size="small">
            {{ $t('admin.product.specialPriceUsers', {
              price: row.special_price || 1,
              n: row.special_price_user_ids.length
            }) }}
          </el-tag>
        </div>
      </template>

      <!-- 特殊价格列 -->
      <template v-slot:special_price="{ row }">
        <div
          v-if="editingCell.rowId === row._id && editingCell.field === 'special_price'"
          @click.stop
          :data-editing-cell="`${row._id}-special_price`"
        >
          <el-input-number
            v-model="editingCell.value"
            :min="0.1"
            :max="999999"
            :precision="2"
            :step="0.1"
            size="mini"
            style="width: 100%"
            @blur="handleBlur(row, 'special_price')"
            @keyup.enter.native="saveCellEdit(row)"
            @keyup.esc.native="cancelCellEdit"
            :controls="false"
            autofocus
          ></el-input-number>
        </div>
        <div
          v-else
          @dblclick="startCellEdit(row, 'special_price', row.special_price || 1)"
          style="cursor: pointer; min-height: 20px;"
          :title="isAdmin ? $t('admin.product.dblClickEdit') : ''"
        >
          <span style="color: #67C23A; font-weight: bold">{{ row.special_price || 1 }}</span>
          <span style="color: var(--vk-text-secondary, #64748b); font-size: 12px;"> {{ $t('admin.product.specialPriceUnit') }}</span>
        </div>
      </template>
    </vk-data-table>

    <!-- 表单弹窗 -->
    <vk-data-dialog
      v-model="form1.props.show"
      :title="form1.props.title"
      width="800px"
      mode="form"
    >
      <vk-data-form
        ref="form1"
        v-model="form1.data"
        :rules="form1.props.rules"
        :action="form1.props.action"
        :form-type="form1.props.formType"
        :columns="form1.props.columns"
        label-width="130px"
        @before-submit="beforeSubmit"
        @success="formSuccess"
      >
         <!-- 产品类型自定义插槽 -->
         <template v-slot:product_type>
           <el-select
             v-model="form1.data.product_type"
             filterable
             allow-create
             default-first-option
             :placeholder="$t('admin.product.phSelectType')"
             style="width: 100%"
           >
             <el-option
               v-for="item in productTypeData"
               :key="item.value"
               :label="item.label"
               :value="item.value"
             ></el-option>
           </el-select>
         </template>

         <!-- 可见范围自定义插槽 -->
        <template v-slot:custom_user_ids>
          <el-select
            v-model="form1.data.custom_user_ids"
            multiple
            filterable
            :placeholder="$t('admin.product.phSelectUsersMulti')"
            style="width: 100%"
          >
            <!-- 所有人选项 -->
            <el-option
              key="all"
              :label="$t('admin.product.optionAllPublic')"
              value="all"
            >
              <span style="float: left; font-weight: bold; color: #67C23A;">
                <i class="el-icon-user"></i> {{ $t('admin.product.optionAllPublic') }}
              </span>
            </el-option>
            <el-option disabled value="">{{ $t('admin.product.optionSpecifiedUsers') }}</el-option>
            <!-- 用户列表 -->
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="`${user.nickname || user.username} (${user.username})`"
              :value="user._id"
            >
              <span style="float: left">{{
                user.nickname || user.username
              }}</span>
              <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{
                user.username
              }}</span>
            </el-option>
          </el-select>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i>
            <span v-if="!form1.data.custom_user_ids || form1.data.custom_user_ids.length === 0" style="color: #F56C6C;">
              {{ $t('admin.product.visibilityNone') }}
            </span>
            <span v-else-if="form1.data.custom_user_ids.includes('all')" style="color: #67C23A;">
              {{ $t('admin.product.visibilityPublic') }}
            </span>
            <span v-else style="color: #E6A23C;">
              {{ $t('admin.product.visibilityUsers', { n: form1.data.custom_user_ids.length }) }}
            </span>
          </div>
        </template>
        <!-- 收费标准自定义插槽 -->
        <template v-slot:price_standard>
          <div style="display: flex; gap: 10px; align-items: center">
            <el-input-number
              v-model="form1.data.price_points"
              :min="1"
              :placeholder="$t('admin.product.phPoints')"
              style="flex: 1"
            ></el-input-number>
            <span style="color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.unitPoints') }} /</span>
            <el-input-number
              v-model="form1.data.price_months"
              :min="1"
              :placeholder="$t('admin.product.phMonthCount')"
              style="flex: 1"
            ></el-input-number>
            <span style="color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.unitMonths') }} /</span>
            <el-input-number
              v-model="form1.data.price_machines"
              :min="1"
              :placeholder="$t('admin.product.phMachineCount')"
              style="flex: 1"
            ></el-input-number>
            <span style="color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.unitMachines') }}</span>
          </div>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i> {{ $t('admin.product.priceStandardTip') }}
          </div>
        </template>

        <!-- 特殊价格配置自定义插槽 -->
        <template v-slot:special_price_config>
          <div class="special-price-configs">
            <div
              v-for="(config, index) in form1.data.special_price_configs"
              :key="index"
              class="config-item"
            >
              <div class="config-header">
                <span class="config-title">{{ $t('admin.product.configIndex', { n: index + 1 }) }}</span>
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  size="mini"
                  circle
                  @click="removeSpecialPriceConfig(index)"
                ></el-button>
              </div>
              <div class="config-body">
                <el-select
                  v-model="config.user_ids"
                  multiple
                  filterable
                  :placeholder="$t('admin.product.phSelectUser')"
                  style="width: 100%; margin-bottom: 10px;"
                >
                  <el-option
                    v-for="user in userList"
                    :key="user._id"
                    :label="`${user.nickname || user.username} (${user.username})`"
                    :value="user._id"
                  >
                    <span style="float: left">{{ user.nickname || user.username }}</span>
                    <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{ user.username }}</span>
                  </el-option>
                </el-select>
                <div style="display: flex; gap: 10px;">
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b); margin-bottom: 4px;">{{ $t('admin.product.buyPriceLabel') }}</div>
                    <el-input-number
                      v-model="config.buy_price"
                      :min="0"
                      :precision="0"
                      :placeholder="$t('admin.product.phBuyPrice')"
                      style="width: 100%;"
                    ></el-input-number>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: var(--vk-text-secondary, #64748b); margin-bottom: 4px;">{{ $t('admin.product.pointsDeductLabel') }}</div>
                    <el-input-number
                      v-model="config.points_price"
                      :min="0.1"
                      :precision="2"
                      :step="0.1"
                      :placeholder="$t('admin.product.phPointsPrice')"
                      style="width: 100%;"
                    ></el-input-number>
                  </div>
                </div>
              </div>
            </div>
            <el-button
              type="dashed"
              icon="el-icon-plus"
              style="width: 100%; margin-top: 10px;"
              @click="addSpecialPriceConfig"
            >
              {{ $t('admin.product.addSpecialConfig') }}
            </el-button>
          </div>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 10px;">
            <i class="el-icon-info"></i>
            {{ $t('admin.product.specialConfigTip') }}
          </div>
        </template>

        <!-- 已购买用户自定义插槽 -->
        <template v-slot:purchased_user_ids>
          <el-select
            v-model="form1.data.purchased_user_ids"
            multiple
            filterable
            :placeholder="$t('admin.product.phSelectPurchased')"
            style="width: 100%"
          >
            <el-option disabled value="">{{ $t('admin.product.optionPurchasedUsers') }}</el-option>
            <!-- 用户列表 -->
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="`${user.nickname || user.username} (${user.username})`"
              :value="user._id"
            >
              <span style="float: left">{{
                user.nickname || user.username
              }}</span>
              <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{
                user.username
              }}</span>
            </el-option>
          </el-select>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i>
            <span v-if="!form1.data.purchased_user_ids || form1.data.purchased_user_ids.length === 0" style="color: var(--vk-text-secondary, #64748b);">
              {{ $t('admin.product.purchasedNone') }}
            </span>
            <span v-else style="color: #67C23A;">
              {{ $t('admin.product.purchasedSome', { n: form1.data.purchased_user_ids.length }) }}
            </span>
          </div>
        </template>

        <!-- 卡密收费自定义插槽 -->
        <template v-slot:valid_days_options>
          <div class="valid-days-options">
            <!-- 表头 -->
            <div class="option-header">
              <span class="header-item" style="width: 120px;">{{ $t('admin.product.colValidDays') }}</span>
              <span class="header-item" style="width: 150px; margin-left: 10px;">{{ $t('admin.product.colDisplayName') }}</span>
              <span class="header-item" style="width: 120px; margin-left: 10px;">{{ $t('admin.product.colDiscount') }}</span>
              <span class="header-item" style="width: 50px; margin-left: 10px;">{{ $t('admin.common.action') }}</span>
            </div>
            <div
              v-for="(option, index) in form1.data.valid_days_options"
              :key="index"
              class="option-item"
            >
              <el-input-number
                v-model="option.days"
                :min="1"
                :max="9999"
                :placeholder="$t('admin.product.phDays')"
                style="width: 120px"
              ></el-input-number>
              <el-input
                v-model="option.label"
                :placeholder="$t('admin.product.phCardLabel')"
                style="width: 150px; margin-left: 10px"
              ></el-input>
              <el-input-number
                v-model="option.discount"
                :min="0.1"
                :max="1"
                :step="0.1"
                :precision="2"
                :placeholder="$t('admin.product.phDiscount')"
                style="width: 120px; margin-left: 10px"
              ></el-input-number>
              <span style="margin-left: 5px; color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.discountUnit') }}</span>
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                circle
                @click="removeOption(index)"
                style="margin-left: 10px"
              ></el-button>
            </div>
            <el-button
              type="primary"
              icon="el-icon-plus"
              size="small"
              @click="addOption"
              style="margin-top: 10px"
            >
              {{ $t('admin.product.addCardOption') }}
            </el-button>
            <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 10px;">
              <i class="el-icon-info"></i>
              {{ $t('admin.product.cardOptionTip') }}
            </div>
          </div>
        </template>

        <!-- 版本更新日志自定义插槽 -->
        <template v-slot:version_logs>
          <div class="version-logs-editor">
            <div
              v-for="(versionLog, index) in form1.data.version_logs"
              :key="index"
              class="version-log-item"
            >
              <div class="version-log-header">
                <span class="version-tag">{{ $t('admin.product.versionIndex', { n: index + 1 }) }}</span>
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  size="mini"
                  circle
                  @click="removeVersionLog(index)"
                ></el-button>
              </div>
              <div class="version-log-content">
                <el-row :gutter="10">
                  <el-col :span="12">
                    <div class="form-item">
                      <label>{{ $t('admin.product.fieldVersion') }}</label>
                      <el-input
                        v-model="versionLog.version"
                        placeholder="1.2.0"
                        clearable
                      ></el-input>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="form-item">
                      <label>{{ $t('admin.product.fieldPublishTime') }}</label>
                      <el-date-picker
                        v-model="versionLog.date"
                        type="datetime"
                        :placeholder="$t('admin.product.phPublishTime')"
                        value-format="timestamp"
                        style="width: 100%"
                      ></el-date-picker>
                    </div>
                  </el-col>
                </el-row>
                <div class="form-item">
                  <label>{{ $t('admin.product.fieldChangelog') }}</label>
                  <el-input
                    v-model="versionLog.log"
                    type="textarea"
                    :rows="4"
                    :placeholder="$t('admin.product.phChangelog')"
                  ></el-input>
                  <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
                    <i class="el-icon-info"></i> {{ $t('admin.product.changelogTip') }}
                  </div>
                </div>
                <div class="form-item">
                  <label>{{ $t('admin.product.fieldDownloadUrl') }}</label>
                  <el-input
                    v-model="versionLog.download_url"
                    :placeholder="$t('admin.product.phDownloadUrl')"
                    clearable
                  >
                    <template slot="prepend">
                      <i class="el-icon-link"></i>
                    </template>
                  </el-input>
                </div>
              </div>
            </div>
            <el-button
              type="primary"
              icon="el-icon-plus"
              size="small"
              @click="addVersionLog"
              style="margin-top: 10px"
            >
              {{ $t('admin.product.addVersion') }}
            </el-button>
            <div v-if="!form1.data.version_logs || form1.data.version_logs.length === 0"
                 style="color: var(--vk-text-secondary, #64748b); text-align: center; padding: 20px;">
              <i class="el-icon-info"></i> {{ $t('admin.product.noVersionLogs') }}
            </div>
          </div>
        </template>

      </vk-data-form>
    </vk-data-dialog>

    <!-- 批量修改弹窗 -->
    <el-dialog
      :title="$t('admin.product.batchEditTitle')"
      :visible.sync="batchEditDialog.show"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchEditDialog.form" label-width="140px">
        <el-form-item :label="$t('admin.product.selectedProducts')">
          <el-tag type="info" size="small" style="margin-right: 5px">
            {{ $t('admin.product.selectedCount', { n: table1.multipleSelection.length }) }}
          </el-tag>
        </el-form-item>

        <el-divider></el-divider>

        <el-form-item :label="$t('admin.product.colPriceStandard')">
          <div style="display: flex; gap: 10px; align-items: center; width: 100%">
            <el-input-number
              v-model="batchEditDialog.form.price_points"
              :min="1"
              :placeholder="$t('admin.product.phPoints')"
              style="flex: 1"
              :controls="false"
              @change="batchEditDialog.modifiedFields.price_points = true"
            ></el-input-number>
            <span style="color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.unitPoints') }} /</span>
            <el-input-number
              v-model="batchEditDialog.form.price_months"
              :min="1"
              :placeholder="$t('admin.product.phMonthCount')"
              style="flex: 1"
              :controls="false"
              @change="batchEditDialog.modifiedFields.price_months = true"
            ></el-input-number>
            <span style="color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.unitMonths') }} /</span>
            <el-input-number
              v-model="batchEditDialog.form.price_machines"
              :min="1"
              :placeholder="$t('admin.product.phMachineCount')"
              style="flex: 1"
              :controls="false"
              @change="batchEditDialog.modifiedFields.price_machines = true"
            ></el-input-number>
            <span style="color: var(--vk-text-secondary, #64748b)">{{ $t('admin.product.unitMachines') }}</span>
          </div>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i> {{ $t('admin.product.batchPriceTip') }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('admin.product.colBuyPrice')">
          <el-input-number
            v-model="batchEditDialog.form.buy_price"
            :min="0"
            :placeholder="$t('admin.product.phBuyPricePoints')"
            style="width: 100%"
            :controls="false"
            @change="batchEditDialog.modifiedFields.buy_price = true"
          ></el-input-number>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i> {{ $t('admin.product.batchBuyTip') }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('admin.product.colVisibility')">
          <el-select
            v-model="batchEditDialog.form.custom_user_ids"
            multiple
            filterable
            :placeholder="$t('admin.product.phSelectUsersMulti')"
            style="width: 100%"
            clearable
            @change="batchEditDialog.modifiedFields.custom_user_ids = true"
          >
            <el-option
              key="all"
              :label="$t('admin.product.optionAllPublic')"
              value="all"
            >
              <span style="float: left; font-weight: bold; color: #67C23A;">
                <i class="el-icon-user"></i> {{ $t('admin.product.optionAllPublic') }}
              </span>
            </el-option>
            <el-option disabled value="">{{ $t('admin.product.optionSpecifiedUsers') }}</el-option>
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="`${user.nickname || user.username} (${user.username})`"
              :value="user._id"
            >
              <span style="float: left">{{
                user.nickname || user.username
              }}</span>
              <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{
                user.username
              }}</span>
            </el-option>
          </el-select>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i> {{ $t('admin.common.leaveBlankKeep') }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('admin.product.colSpecialPrice')">
          <el-input-number
            v-model="batchEditDialog.form.special_price"
            :min="0.1"
            :max="999999"
            :precision="2"
            :step="0.1"
            :placeholder="$t('admin.product.phSpecialPrice')"
            style="width: 100%"
            :controls="false"
            @change="batchEditDialog.modifiedFields.special_price = true"
          ></el-input-number>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i> {{ $t('admin.common.leaveBlankKeep') }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('admin.product.colSpecialUsers')">
          <el-select
            v-model="batchEditDialog.form.special_price_user_ids"
            multiple
            filterable
            :placeholder="$t('admin.product.phSelectSpecialUsersMulti')"
            style="width: 100%"
            clearable
            @change="batchEditDialog.modifiedFields.special_price_user_ids = true"
          >
            <el-option disabled value="">{{ $t('admin.product.optionSpecialUsers') }}</el-option>
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="`${user.nickname || user.username} (${user.username})`"
              :value="user._id"
            >
              <span style="float: left">{{
                user.nickname || user.username
              }}</span>
              <span style="float: right; color: var(--vk-text-secondary, #64748b); font-size: 13px">{{
                user.username
              }}</span>
            </el-option>
          </el-select>
          <div style="color: var(--vk-text-secondary, #64748b); font-size: 12px; margin-top: 5px">
            <i class="el-icon-info"></i> {{ $t('admin.common.leaveBlankKeep') }}
          </div>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="batchEditDialog.show = false">{{ $t('admin.common.cancel') }}</el-button>
        <el-button type="primary" @click="batchEditSubmit" :loading="batchEditDialog.loading">
          {{ $t('admin.product.batchConfirm') }}
        </el-button>
      </div>
    </el-dialog>
  </view>
</template>

<script>
let that;
let vk = uni.vk;
let originalForms = {};

export default {
  data() {
    // 状态数据
    const statusData = [
      { value: 0, label: this.$t('admin.product.statusOff') },
      { value: 1, label: this.$t('admin.product.statusOn') },
    ];
    return {
      isAdmin: false, // 是否是管理员
      productTypeData: [], // 产品类型选项（从数据库加载）
      userList: [], // 用户列表
      // machineStats -> computed
      // 单元格编辑状态
      editingCell: {
        rowId: null,
        field: null,
        value: null,
        // 收费标准编辑状态（包含三个字段）
        priceData: {
          price_points: null,
          price_months: null,
          price_machines: null,
        },
        // 保存原始值，用于取消时恢复
        originalValue: null,
        originalPriceData: {
          price_points: null,
          price_months: null,
          price_machines: null,
        },
      },
      batchEditDialog: {
        show: false,
        loading: false,
        form: {
          price_points: null,
          price_months: null,
          price_machines: null,
          buy_price: null,
          custom_user_ids: [],
          special_price: null,
          special_price_user_ids: [],
        },
        // 标记哪些字段被修改过（用于区分"未修改"和"清空"）
        modifiedFields: {
          price_points: false,
          price_months: false,
          price_machines: false,
          buy_price: false,
          custom_user_ids: false,
          special_price: false,
          special_price_user_ids: false,
        },
      },
      table1: {
        action: "admin/product/sys/getList",
        multipleSelection: [], // 多选列表
        columns: [
          { key: "_add_time", title: this.$t('admin.product.colCreateTime'), type: "time", width: 180 },
          {
            key: "product_image",
            title: this.$t('admin.product.colImage'),
            type: "text",
            width: 120,
            slot: true,
          },
          { key: "product_id", title: this.$t('admin.product.colProductId'), type: "text", width: 180 },
          { key: "product_name", title: this.$t('admin.product.colProductName'), type: "text", width: 150, slot: true },
          { key: "description", title: this.$t('admin.product.colDescription'), type: "text", width: 200, slot: true },
          { key: "product_type", title: this.$t('admin.product.colProductType'), type: "text", width: 120 },
          { key: "download_url", title: this.$t('admin.product.colDownloadUrl'), type: "text", width: 250, slot: true },
          { key: "detail_url", title: this.$t('admin.product.colDetailUrl'), type: "text", width: 200, slot: true },
          {
            key: "price_standard",
            title: this.$t('admin.product.colPriceStandard'),
            type: "text",
            width: 200,
            slot: true,
          },
          {
            key: "buy_price",
            title: this.$t('admin.product.colBuyPrice'),
            type: "text",
            width: 120,
            slot: true,
          },
          {
            key: "custom_user_ids",
            title: this.$t('admin.product.colVisibility'),
            type: "text",
            width: 120,
            slot: true,
          },
          {
            key: "special_price_user_ids",
            title: this.$t('admin.product.colSpecialUsers'),
            type: "text",
            width: 150,
            slot: true,
          },
          {
            key: "special_price",
            title: this.$t('admin.product.colSpecialPrice'),
            type: "text",
            width: 120,
            slot: true,
          },
          { key: "remark", title: this.$t('admin.product.colRemark'), type: "text", width: 200 },
          {
            key: "status",
            title: this.$t('admin.product.colStatus'),
            type: "text",
            width: 150,
            slot: true,
          },
        ],
      },
      queryForm1: {
        formData: {},
        columns: [
          {
            key: "product_name",
            type: "text",
            title: this.$t('admin.product.colProductName'),
            placeholder: this.$t('admin.product.phProductName'),
            mode: "%%",
            col: { span: 5 },
          },
          {
            key: "product_type",
            type: "select",
            title: this.$t('admin.product.colProductType'),
            placeholder: this.$t('admin.product.phSelectType'),
            data: [], // 从数据库动态加载
            col: { span: 4 },
            mode: "=",
          },
          {
            key: "status",
            type: "select",
            title: this.$t('admin.product.colStatus'),
            placeholder: this.$t('admin.product.phSelectStatus'),
            data: statusData,
            col: { span: 3 },
            mode: "=",
          },
        ],
      },
      form1: {
        data: {},
        props: {
          action: "",
          columns: [
            // ========== 基本信息 ==========
            { key: "", title: this.$t('admin.product.sectionBasic'), type: "bar-title" },
            {
              key: "product_id",
              title: this.$t('admin.product.colProductId'),
              type: "text",
              placeholder: this.$t('admin.product.phProductId'),
              tips: this.$t('admin.product.tipProductId'),
              show: ["add"],
            },
            {
              key: "product_name",
              title: this.$t('admin.product.colProductName'),
              type: "text",
              placeholder: this.$t('admin.product.phProductName'),
            },
            {
              key: "product_type",
              title: this.$t('admin.product.colProductType'),
              slot: true,
            },
            {
              key: "status",
              title: this.$t('admin.product.colStatus'),
              type: "radio",
              data: statusData,
              defaultValue: 1,
            },
            // ========== 产品详情 ==========
            { key: "", title: this.$t('admin.product.sectionDetail'), type: "bar-title" },
            {
              key: "product_image",
              title: this.$t('admin.product.colImage'),
              type: "image",
              limit: 1,
              tips: this.$t('admin.product.tipImage'),
            },
            {
              key: "description",
              title: this.$t('admin.product.colDescription'),
              type: "textarea",
              placeholder: this.$t('admin.product.phDescription'),
            },
            {
              key: "download_url",
              title: this.$t('admin.product.colDownloadUrl'),
              type: "text",
              placeholder: this.$t('admin.product.phDownload'),
              tips: this.$t('admin.product.tipDownload'),
            },
            {
              key: "version_logs",
              title: this.$t('admin.product.colVersionLogs'),
              slot: true,
            },
            {
              key: "detail_url",
              title: this.$t('admin.product.colDetailUrl'),
              type: "text",
              placeholder: this.$t('admin.product.phDocLink'),
              tips: this.$t('admin.product.tipDetailUrl'),
            },
            // ========== 收费配置 ==========
            { key: "", title: this.$t('admin.product.sectionPricing'), type: "bar-title" },
            {
              key: "buy_price",
              title: this.$t('admin.product.colBuyPrice'),
              type: "number",
              placeholder: this.$t('admin.product.phBuyPricePublic'),
              tips: this.$t('admin.product.tipBuyPrice'),
              defaultValue: 0,
            },
            {
              key: "price_standard",
              title: this.$t('admin.product.colPriceStandard'),
              slot: true,
            },
            {
              key: "valid_days_options",
              title: this.$t('admin.product.colCardPricing'),
              slot: true,
              tips: this.$t('admin.product.tipCardPricing'),
            },
            // ========== 高级配置 ==========
            { key: "", title: this.$t('admin.product.sectionAdvanced'), type: "bar-title" },
            {
              key: "custom_user_ids",
              title: this.$t('admin.product.colVisibility'),
              slot: true,
            },
            {
              key: "special_price_config",
              title: this.$t('admin.product.colSpecialConfig'),
              slot: true,
            },
            {
              key: "purchased_user_ids",
              title: this.$t('admin.product.colPurchasedUsers'),
              slot: true,
            },
            {
              key: "remark",
              title: this.$t('admin.product.colRemark'),
              type: "textarea",
              placeholder: this.$t('admin.product.phRemark'),
            },
          ],
          rules: {
            product_id: [
              { required: true, message: this.$t('admin.product.ruleProductId'), trigger: "blur" },
              {
                pattern: /^[a-z0-9-]+$/,
                message: this.$t('admin.product.ruleProductIdPattern'),
                trigger: "blur",
              },
            ],
            product_name: [
              { required: true, message: this.$t('admin.product.ruleProductName'), trigger: "blur" },
            ],
            product_type: [
              { required: true, message: this.$t('admin.product.ruleProductType'), trigger: "change" },
            ],
            price_points: [
              { required: true, message: this.$t('admin.product.rulePricePoints'), trigger: "blur" },
              {
                type: "number",
                min: 1,
                message: this.$t('admin.product.rulePricePointsMin'),
                trigger: "blur",
              },
            ],
            price_months: [
              { required: true, message: this.$t('admin.product.rulePriceMonths'), trigger: "blur" },
              {
                type: "number",
                min: 1,
                message: this.$t('admin.product.rulePriceMonthsMin'),
                trigger: "blur",
              },
            ],
            price_machines: [
              { required: true, message: this.$t('admin.product.rulePriceMachines'), trigger: "blur" },
              {
                type: "number",
                min: 1,
                message: this.$t('admin.product.rulePriceMachinesMin'),
                trigger: "blur",
              },
            ],
            status: [
              { required: true, message: this.$t('admin.product.ruleStatus'), trigger: "change" },
            ],
          },
          formType: "",
          title: "",
          show: false,
        },
      },
    };
  },
  computed: {
    machineStats() { return this.$store.state.$user.machineStats; },
  },
  onLoad(options = {}) {
    that = this;
    vk = that.vk;
    that.init();
  },
  onUnload() {
    // 移除全局点击事件
    if (that && that.removeGlobalClickHandler) {
      that.removeGlobalClickHandler();
    }
  },
  methods: {
    // 初始化
    init() {
      originalForms["form1"] = vk.pubfn.copyObject(that.form1);
      that.checkAdminRole();
      that.loadProductCategories();
      that.loadUserList();
      that.$store.dispatch('$user/loadMachineStats');
    },
    // 加载产品分类数据
    loadProductCategories() {
      vk.callFunction({
        url: 'admin/product-category/sys/getAll',
        data: {},
        success: (res) => {
          if (res.data && Array.isArray(res.data)) {
            const categories = res.data.map(item => ({
              value: item.value,
              label: item.label
            }));
            // 更新表单中的产品类型选项
            that.productTypeData = categories;
            // 更新搜索表单中的产品类型选项
            const categoryColumn = that.queryForm1.columns.find(col => col.key === 'product_type');
            if (categoryColumn) {
              categoryColumn.data = categories;
            }
          }
        },
        fail: (err) => {
          console.error('加载产品分类失败：', err);
          vk.toast(err.msg || err.message || that.$t('admin.common.loadFailed'), 'none');
        }
      });
    },
    // 检查是否是管理员
    checkAdminRole() {
      const userInfo = vk.getVuex("$user.userInfo");
      that.isAdmin =
        userInfo &&
        userInfo.role &&
        Array.isArray(userInfo.role) &&
        userInfo.role.includes("admin");
    },
    // 加载用户列表
    loadUserList() {
      if (!that.isAdmin) {
        return; // 非管理员不需要加载用户列表
      }
      vk.callFunction({
        url: "admin/system/user/sys/getList",
        data: {
          pageSize: 999,
        },
        success: (data) => {
          that.userList = data.rows || [];
          // 更新表单中的用户列表数据
          const customUserField = that.form1.props.columns.find(
            (col) => col.key === "custom_user_ids"
          );
          if (customUserField) {
            customUserField.data = that.userList.map((user) => ({
              value: user._id,
              label: `${user.nickname || user.username} (${user.username})`,
            }));
          }
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || that.$t('admin.common.loadFailed'), 'none');
        }
      });
    },
    // 搜索
    search(obj) {
      that.$refs.table1.query(obj);
    },
    // 刷新
    refresh() {
      that.$refs.table1.refresh();
    },
    // 新增
    addBtn() {
      if (!that.isAdmin) {
        vk.toast(that.$t('admin.product.onlyAdminAdd'), 'none');
        return;
      }
      vk.pubfn.resetForm(originalForms, that);
      that.form1.props.action = "admin/product/sys/add";
      that.form1.props.formType = "add";
      that.form1.props.title = that.$t('admin.product.addTitle');
      that.$set(that.form1, "data", {
        product_id: "",
        product_name: "",
        product_type: "",
        product_image: "",
        download_url: "",
        detail_url: "",
        price_points: 1,
        price_months: 1,
        price_machines: 1,
        buy_price: 0,
        description: "",
        remark: "",
        status: 1,
        valid_days_options: [
          { days: 30, label: that.$t('admin.product.cardMonth'), discount: 1 },
          { days: 90, label: that.$t('admin.product.cardQuarter'), discount: 1 },
          { days: 180, label: that.$t('admin.product.cardHalfYear'), discount: 1 },
          { days: 365, label: that.$t('admin.product.cardYear'), discount: 1 },
        ],
        custom_user_ids: ["all"], // 默认为所有人可见
        special_price: 1, // 特殊价格，默认为1积分/月/机器（兼容旧数据）
        special_price_user_ids: [], // 特殊价格用户列表（兼容旧数据）
        special_price_configs: [], // 特殊价格配置（新）
        purchased_user_ids: [], // 已购买用户列表
        version_logs: [], // 版本更新日志
      });
      that.form1.props.show = true;
    },
    // 编辑
    editBtn({ item }) {
      if (!that.isAdmin) {
        vk.toast(that.$t('admin.product.onlyAdminEdit'), 'none');
        return;
      }
      vk.pubfn.resetForm(originalForms, that);
      that.form1.props.action = "admin/product/sys/update";
      that.form1.props.formType = "edit";
      that.form1.props.title = that.$t('admin.product.editTitle');
      that.$set(that.form1, "data", {
        _id: item._id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_type: item.product_type,
        product_image: item.product_image || "",
        download_url: item.download_url || "",
        detail_url: item.detail_url || "",
        price_points: item.price_points || 5,
        price_months: item.price_months || 1,
        price_machines: item.price_machines || 1,
        buy_price: item.buy_price || 0,
        description: item.description || "",
        remark: item.remark || "",
        status: item.status,
        valid_days_options: item.valid_days_options || [],
        custom_user_ids: item.custom_user_ids || [],
        special_price: item.special_price || 1, // 特殊价格，默认为1（兼容旧数据）
        special_price_user_ids: item.special_price_user_ids || [], // 兼容旧数据
        special_price_configs: item.special_price_configs || [], // 特殊价格配置（新）
        purchased_user_ids: item.purchased_user_ids || [],
        version_logs: item.version_logs || [],
      });
      that.form1.props.show = true;
    },
    // 删除
    deleteBtn({ item, deleteFn }) {
      if (!that.isAdmin) {
        vk.toast(that.$t('admin.product.onlyAdminDelete'), 'none');
        return;
      }
      that
        .$confirm(
          that.$t('admin.product.deleteConfirm', { name: item.product_name }),
          that.$t('admin.common.confirm'),
          {
            confirmButtonText: that.$t('admin.common.ok'),
            cancelButtonText: that.$t('admin.common.cancel'),
            customClass: 'vk-confirm-box',
            distinguishCancelAndClose: true
          }
        )
        .then(() => {
          deleteFn({
            action: "admin/product/sys/delete",
            data: { _id: item._id },
          });
        })
        .catch(() => {});
    },
    // 改变状态
    changeStatus(row) {
      if (!that.isAdmin) {
        vk.toast(that.$t('admin.product.onlyAdminStatus'), 'none');
        // 恢复原状态
        row.status = row.status === 1 ? 0 : 1;
        return;
      }
      vk.callFunction({
        url: "admin/product/sys/update",
        data: {
          _id: row._id,
          status: row.status,
        },
        success: () => {
          vk.toast(that.$t('admin.product.statusUpdated'), 'success');
          that.$store.commit('$user/SET_PRODUCT_LIST', []);
          that.refresh();
        },
        fail: (err) => {
          vk.toast(err.msg || err.message || that.$t('admin.common.updateFailed'), 'none');
          // 失败时恢复原状态
          row.status = row.status === 1 ? 0 : 1;
        },
      });
    },
    // 添加有效期选项
    addOption() {
      if (!that.form1.data.valid_days_options) {
        that.$set(that.form1.data, "valid_days_options", []);
      }
      that.form1.data.valid_days_options.push({
        days: 30,
        label: that.$t('admin.product.cardMonth'),
        discount: 1,
      });
    },
    // 移除有效期选项
    removeOption(index) {
      that.form1.data.valid_days_options.splice(index, 1);
    },
    // 添加特殊价格配置
    addSpecialPriceConfig() {
      if (!that.form1.data.special_price_configs) {
        that.$set(that.form1.data, "special_price_configs", []);
      }
      that.form1.data.special_price_configs.push({
        user_ids: [],
        buy_price: 0,
        points_price: 1,
      });
    },
    // 移除特殊价格配置
    removeSpecialPriceConfig(index) {
      that.form1.data.special_price_configs.splice(index, 1);
    },
    // 添加版本日志
    addVersionLog() {
      if (!that.form1.data.version_logs) {
        that.$set(that.form1.data, "version_logs", []);
      }
      that.form1.data.version_logs.unshift({
        version: "",
        date: Date.now(),
        log: "",
        download_url: "",
      });
    },
    // 移除版本日志
    removeVersionLog(index) {
      that.form1.data.version_logs.splice(index, 1);
    },
     // 表单提交前处理
     async beforeSubmit() {
       // 检查是否有图片
       if (!that.form1.data.product_image) {
         vk.toast(that.$t('admin.product.errNeedImage'), 'none');
         return false;
       }
       return true; // 返回true继续提交
     },
    // 表单提交成功
    formSuccess() {
      that.form1.props.show = false;
      vk.toast(that.$t('admin.common.actionSuccess'), 'success');
      that.$store.commit('$user/SET_PRODUCT_LIST', []);
      that.refresh();
    },
    // 获取图片URL（兼容多种数据格式）
    getImageUrl(imageData) {
      if (!imageData) return "";

      // 如果是字符串，直接返回
      if (typeof imageData === "string") {
        return imageData;
      }

      // 如果是对象，尝试获取url属性
      if (typeof imageData === "object") {
        if (imageData.url) return imageData.url;
        if (imageData[0] && typeof imageData[0] === "string")
          return imageData[0];
        if (imageData[0] && imageData[0].url) return imageData[0].url;
      }

      return "";
    },
    // 加载机器统计（从 store 响应式读取）
    loadMachineStats() {
      that.$store.dispatch('$user/loadMachineStats', { force: true });
    },
    // 计算基础价格
    calculateBasePrice(row) {
      if (!row.price_points || !row.price_months || !row.price_machines) {
        return 0;
      }

      // 获取当前用户信息
      const userInfo = vk.getVuex("$user.userInfo");
      const userId = userInfo?._id;

      // 判断是否是特殊价格用户
      const specialPriceUserIds = row.special_price_user_ids || [];
      const isSpecialPriceUser = userId &&
        Array.isArray(specialPriceUserIds) &&
        specialPriceUserIds.length > 0 &&
        specialPriceUserIds.includes(userId);

      // 获取用户绑定机器总数
      const totalMachines = that.machineStats?.total_machines || 0;

      // 如果是特殊价格用户且绑定机器数不超过1000台，则使用产品配置的特殊价格
      if (isSpecialPriceUser && totalMachines <= 1000) {
        const specialPrice = row.special_price || 1;
        return specialPrice.toFixed(2);
      }

      // 否则使用正常价格
      const basePrice = row.price_points / row.price_months / row.price_machines;
      return basePrice.toFixed(2);
    },
    // 多选变化
    selectionChange(list) {
      that.table1.multipleSelection = list;
    },
    // 开始单元格编辑
    startCellEdit(row, field, value) {
      if (!that.isAdmin) {
        return; // 非管理员不能编辑
      }
      const originalValue = Array.isArray(value) ? [...value] : value;
      that.editingCell = {
        rowId: row._id,
        field: field,
        value: Array.isArray(value) ? [...value] : value, // 数组需要深拷贝
        originalValue: originalValue, // 保存原始值
        priceData: {
          price_points: null,
          price_months: null,
          price_machines: null,
        },
        originalPriceData: {
          price_points: null,
          price_months: null,
          price_machines: null,
        },
      };
    },
    // 开始收费标准编辑
    startPriceStandardEdit(row) {
      if (!that.isAdmin) {
        return; // 非管理员不能编辑
      }
      that.editingCell = {
        rowId: row._id,
        field: 'price_standard',
        value: null,
        originalValue: null,
        priceData: {
          price_points: row.price_points || 1,
          price_months: row.price_months || 1,
          price_machines: row.price_machines || 1,
        },
        originalPriceData: {
          price_points: row.price_points || 1,
          price_months: row.price_months || 1,
          price_machines: row.price_machines || 1,
        },
      };
    },
    // 保存收费标准
    async savePriceStandard(row) {
      if (!that.editingCell.rowId || that.editingCell.field !== 'price_standard') {
        return;
      }

      const priceData = that.editingCell.priceData;
      const pricePoints = priceData.price_points;
      const priceMonths = priceData.price_months;
      const priceMachines = priceData.price_machines;

      // 验证
      if (!pricePoints || !priceMonths || !priceMachines) {
        vk.toast(that.$t('admin.product.errPriceRequired'), 'none');
        return;
      }

      // 检查是否有变化
      if (pricePoints === row.price_points &&
          priceMonths === row.price_months &&
          priceMachines === row.price_machines) {
        that.cancelCellEdit();
        return;
      }

      // 计算 base_price
      const basePrice = pricePoints / priceMonths / priceMachines;

      const updateData = {
        price_points: pricePoints,
        price_months: priceMonths,
        price_machines: priceMachines,
        base_price: basePrice,
        _update_time: Date.now(),
      };

      try {
        await vk.callFunction({
          url: 'admin/product/sys/update',
          data: {
            _id: row._id,
            ...updateData
          }
        });

        // 更新本地数据
        row.price_points = pricePoints;
        row.price_months = priceMonths;
        row.price_machines = priceMachines;
        row.base_price = basePrice;
        vk.toast(that.$t('admin.product.updateSuccess'), 'success');

        // 清除产品列表缓存
        that.$store.commit('$user/SET_PRODUCT_LIST', []);

        // 取消编辑状态
        that.cancelCellEdit();
      } catch (err) {
        console.error('保存失败：', err);
        vk.toast(err.msg || err.message || that.$t('admin.common.saveFailed'), 'none');
      }
    },
    // 保存单元格编辑
    async saveCellEdit(row) {
      if (!that.editingCell.rowId || that.editingCell.field === null) {
        return;
      }

      const field = that.editingCell.field;
      let newValue = that.editingCell.value;
      const oldValue = row[field];

      // 数组类型字段需要特殊处理
      if (Array.isArray(newValue)) {
        // 如果值没有变化，直接取消编辑
        if (JSON.stringify(newValue) === JSON.stringify(oldValue || [])) {
          that.cancelCellEdit();
          return;
        }
      } else {
        // 如果值没有变化，直接取消编辑
        if (newValue === oldValue) {
          that.cancelCellEdit();
          return;
        }
      }

      // 构建更新数据
      const updateData = {
        [field]: newValue,
        _update_time: Date.now(),
      };

      // 字符串类型字段需要去除首尾空格
      if (typeof newValue === 'string') {
        updateData[field] = newValue.trim();
      }

      // 数组类型字段确保是数组
      if (Array.isArray(newValue)) {
        updateData[field] = newValue;
      }

      try {
        await vk.callFunction({
          url: 'admin/product/sys/update',
          data: {
            _id: row._id,
            ...updateData
          }
        });

        // 更新本地数据
        if (Array.isArray(newValue)) {
          row[field] = [...newValue]; // 深拷贝
        } else {
          row[field] = newValue;
        }
        vk.toast(that.$t('admin.product.updateSuccess'), 'success');

        // 清除产品列表缓存，确保用户端同步更新
        that.$store.commit('$user/SET_PRODUCT_LIST', []);

        // 取消编辑状态
        that.cancelCellEdit();
      } catch (err) {
        console.error('保存失败：', err);
        vk.toast(err.msg || err.message || that.$t('admin.common.saveFailed'), 'none');
        // 恢复原值
        if (Array.isArray(oldValue)) {
          row[field] = oldValue ? [...oldValue] : [];
        } else {
          row[field] = oldValue;
        }
      }
    },
    // 处理失焦事件（点击其他地方）
    handleBlur(row, field) {
      // 延迟执行，避免点击保存按钮时被触发
      setTimeout(() => {
        if (that.editingCell.rowId === row._id && that.editingCell.field === field) {
          // 检查值是否有变化
          const newValue = that.editingCell.value;
          const oldValue = that.editingCell.originalValue;

          if (Array.isArray(newValue) && Array.isArray(oldValue)) {
            if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
              // 有变化，保存
              that.saveCellEdit(row);
            } else {
              // 无变化，取消
              that.cancelCellEdit();
            }
          } else if (newValue !== oldValue) {
            // 有变化，保存
            that.saveCellEdit(row);
          } else {
            // 无变化，取消
            that.cancelCellEdit();
          }
        }
      }, 200);
    },
    // 处理收费标准失焦事件
    handlePriceStandardBlur(row) {
      // 延迟执行，避免点击保存按钮时被触发
      setTimeout(() => {
        if (that.editingCell.rowId === row._id && that.editingCell.field === 'price_standard') {
          // 检查值是否有变化
          const priceData = that.editingCell.priceData;
          const originalPriceData = that.editingCell.originalPriceData;

          if (priceData.price_points === originalPriceData.price_points &&
              priceData.price_months === originalPriceData.price_months &&
              priceData.price_machines === originalPriceData.price_machines) {
            // 无变化，取消编辑
            that.cancelCellEdit();
          }
          // 有变化时不自动保存，需要点击保存按钮
        }
      }, 200);
    },
    // 处理下拉框失焦事件
    handleSelectBlur(row, field) {
      // 延迟执行，避免点击其他元素时被触发
      setTimeout(() => {
        if (that.editingCell.rowId === row._id && that.editingCell.field === field) {
          // 检查值是否有变化
          const newValue = that.editingCell.value;
          const oldValue = that.editingCell.originalValue;

          if (Array.isArray(newValue) && Array.isArray(oldValue)) {
            if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
              // 有变化，保存
              that.saveCellEdit(row);
            } else {
              // 无变化，取消
              that.cancelCellEdit();
            }
          } else {
            // 无变化，取消
            that.cancelCellEdit();
          }
        }
      }, 200);
    },
    // 取消单元格编辑
    cancelCellEdit() {
      // 直接重置编辑状态，不需要恢复原始值
      // 因为表格数据是从服务器获取的，取消编辑时直接重置状态即可
      // 如果用户修改了值但没有保存，表格会自动恢复到原始状态
      that.editingCell = {
        rowId: null,
        field: null,
        value: null,
        originalValue: null,
        priceData: {
          price_points: null,
          price_months: null,
          price_machines: null,
        },
        originalPriceData: {
          price_points: null,
          price_months: null,
          price_machines: null,
        },
      };
    },
    // 添加全局点击事件处理（用于点击外部取消编辑）
    addGlobalClickHandler() {
      // 在 uni-app 中，主要通过失焦事件来处理取消编辑
      // 全局点击事件在 uni-app 中可能不可用，所以这里留空
      that.globalClickHandler = null;
    },
    // 移除全局点击事件处理
    removeGlobalClickHandler() {
      if (that.globalClickHandler) {
        that.globalClickHandler = null;
      }
    },
    // 批量修改
    batchEditBtn() {
      if (!that.isAdmin) {
        vk.toast(that.$t('admin.product.onlyAdminBatch'), 'none');
        return;
      }
      if (!that.table1.multipleSelection || that.table1.multipleSelection.length === 0) {
        vk.toast(that.$t('admin.product.selectProductsFirst'), 'none');
        return;
      }
      // 重置表单（所有字段都为空，避免误操作）
      that.batchEditDialog.form = {
        price_points: null,
        price_months: null,
        price_machines: null,
        buy_price: null,
        custom_user_ids: [],
        special_price: null,
        special_price_user_ids: [],
      };
      // 重置修改标记
      that.batchEditDialog.modifiedFields = {
        price_points: false,
        price_months: false,
        price_machines: false,
        buy_price: false,
        custom_user_ids: false,
        special_price: false,
        special_price_user_ids: false,
      };
      that.batchEditDialog.show = true;
    },
    // 批量修改提交
    batchEditSubmit() {
      if (!that.table1.multipleSelection || that.table1.multipleSelection.length === 0) {
        vk.toast(that.$t('admin.product.selectProductsFirst'), 'none');
        return;
      }

      // 构建更新数据（只包含被修改过的字段）
      const updateData = {};
      const modifiedFields = that.batchEditDialog.modifiedFields;

      // 数字类型字段：如果被修改过，则更新（包括0值）
      if (modifiedFields.price_points && that.batchEditDialog.form.price_points !== null && that.batchEditDialog.form.price_points !== undefined) {
        updateData.price_points = that.batchEditDialog.form.price_points;
      }
      if (modifiedFields.price_months && that.batchEditDialog.form.price_months !== null && that.batchEditDialog.form.price_months !== undefined) {
        updateData.price_months = that.batchEditDialog.form.price_months;
      }
      if (modifiedFields.price_machines && that.batchEditDialog.form.price_machines !== null && that.batchEditDialog.form.price_machines !== undefined) {
        updateData.price_machines = that.batchEditDialog.form.price_machines;
      }
      if (modifiedFields.buy_price && that.batchEditDialog.form.buy_price !== null && that.batchEditDialog.form.buy_price !== undefined) {
        updateData.buy_price = that.batchEditDialog.form.buy_price;
      }

      // 数组类型字段：如果被修改过，则更新（包括空数组）
      // 注意：空数组 [] 表示清空，null 表示不修改
      if (modifiedFields.custom_user_ids) {
        updateData.custom_user_ids = Array.isArray(that.batchEditDialog.form.custom_user_ids)
          ? that.batchEditDialog.form.custom_user_ids
          : [];
      }
      if (modifiedFields.special_price && that.batchEditDialog.form.special_price !== null && that.batchEditDialog.form.special_price !== undefined) {
        updateData.special_price = that.batchEditDialog.form.special_price;
      }
      if (modifiedFields.special_price_user_ids) {
        updateData.special_price_user_ids = Array.isArray(that.batchEditDialog.form.special_price_user_ids)
          ? that.batchEditDialog.form.special_price_user_ids
          : [];
      }

      // 检查是否有要更新的字段
      if (Object.keys(updateData).length === 0) {
        vk.toast(that.$t('admin.product.modifyOneField'), 'none');
        return;
      }

      // 如果收费标准有更新，重新计算 base_price
      // 需要从原产品数据中获取未修改的字段值
      const needRecalculateBasePrice = modifiedFields.price_points || modifiedFields.price_months || modifiedFields.price_machines;

      // 更新时间
      updateData._update_time = Date.now();

      // 获取选中的产品ID列表
      const productIds = that.table1.multipleSelection.map(item => item._id);

      // 如果需要重新计算 base_price，需要为每个产品单独计算（因为可能只修改了部分字段）
      const finalUpdateData = needRecalculateBasePrice ? null : updateData;

      that
        .$confirm(
          that.$t('admin.product.batchConfirmMsg', { n: productIds.length }),
          that.$t('admin.common.confirm'),
          {
            confirmButtonText: that.$t('admin.common.ok'),
            cancelButtonText: that.$t('admin.common.cancel'),
            customClass: 'vk-confirm-box',
            distinguishCancelAndClose: true
          }
        )
        .then(async () => {
            that.batchEditDialog.loading = true;
            try {
              // 批量更新产品
              let successCount = 0;
              let failCount = 0;

              for (const productId of productIds) {
                try {
                  let productUpdateData = finalUpdateData;

                  // 如果需要重新计算 base_price，需要获取原产品数据
                  if (needRecalculateBasePrice) {
                    productUpdateData = { ...updateData };
                    // 获取原产品数据
                    const productRes = await vk.callFunction({
                      url: 'admin/product/sys/getList',
                      data: {
                        whereJson: { _id: productId }
                      }
                    });

                    if (productRes && productRes.rows && productRes.rows.length > 0) {
                      const product = productRes.rows[0];
                      // 使用修改后的值或原值
                      const pricePoints = modifiedFields.price_points ? updateData.price_points : product.price_points;
                      const priceMonths = modifiedFields.price_months ? updateData.price_months : product.price_months;
                      const priceMachines = modifiedFields.price_machines ? updateData.price_machines : product.price_machines;

                      if (pricePoints > 0 && priceMonths > 0 && priceMachines > 0) {
                        productUpdateData.base_price = pricePoints / priceMonths / priceMachines;
                      }
                    }
                  }

                  await vk.callFunction({
                    url: 'admin/product/sys/update',
                    data: {
                      _id: productId,
                      ...productUpdateData
                    }
                  });
                  successCount++;
                } catch (err) {
                  console.error(`更新产品 ${productId} 失败：`, err);
                  failCount++;
                }
              }

              that.batchEditDialog.loading = false;
              that.batchEditDialog.show = false;

              if (failCount === 0) {
                vk.toast(that.$t('admin.product.batchSuccess', { n: successCount }), 'success');
              } else {
                that.$alert(
                  that.$t('admin.product.batchResult', { success: successCount, fail: failCount }),
                  that.$t('admin.product.batchResultTitle'),
                  { confirmButtonText: that.$t('admin.common.ok'), customClass: 'vk-confirm-box' }
                ).catch(() => {});
              }

              // 清空选择
              that.table1.multipleSelection = [];
              that.$refs.table1.clearSelection();

              // 清除产品列表缓存
              that.$store.commit('$user/SET_PRODUCT_LIST', []);

              // 刷新表格
              that.refresh();
            } catch (err) {
              that.batchEditDialog.loading = false;
              vk.toast(err.msg || err.message || that.$t('admin.product.batchFailed'), 'none');
            }
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="scss" scoped>
.page-body {
  padding: 20px;
}

/* 卡密收费样式 */
.valid-days-options {
  .option-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 8px 12px;
    background: var(--vk-border);
    border-radius: 4px;
    font-size: 12px;
    color: var(--vk-text);
    font-weight: 500;

    .header-item {
      text-align: center;
    }
  }

  .option-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    background: var(--vk-bg-muted, #f5f7fa);
    border-radius: 4px;
  }
}

/* 特殊价格配置样式 */
.special-price-configs {
  .config-item {
    margin-bottom: 15px;
    padding: 15px;
    background: var(--vk-bg-muted, #f5f7fa);
    border-radius: 4px;
    border: 1px solid var(--vk-border);

    .config-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .config-title {
        font-weight: 500;
        color: var(--vk-text);
      }
    }

    .config-body {
      // 内容区域
    }
  }
}

/* 版本日志编辑样式 */
.version-logs-editor {
  .version-log-item {
    margin-bottom: 15px;
    padding: 15px;
    background: var(--vk-bg-muted, #f5f7fa);
    border-radius: 4px;
    border-left: 3px solid var(--vk-primary, #409EFF);

    .version-log-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--vk-border);

      .version-tag {
        font-size: 14px;
        font-weight: bold;
        color: var(--vk-primary, #409EFF);
      }
    }

    .version-log-content {
      .form-item {
        margin-bottom: 15px;

        label {
          display: block;
          margin-bottom: 5px;
          font-size: 13px;
          color: var(--vk-text);
          font-weight: 500;
        }
      }
    }
  }
}

/* 产品图样式 */
.no-image {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vk-bg-muted, #f5f7fa);
  border-radius: 4px;
  color: var(--vk-text-muted);
  font-size: 24px;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--vk-bg-muted, #f5f7fa);
  color: var(--vk-text-muted);
  font-size: 24px;
}

</style>

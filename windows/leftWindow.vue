<template>
	<scroll-view class="sidebar" :class="classCom" scroll-y="true" v-loading="!vk.getVuex('$app.inited')" :style="styleCom">
		<template v-if="vk.getVuex('$app.inited')">
			<template v-for="(group, idx) in menuGroups">
				<!-- 分割线 -->
				<view v-if="group.divider" :key="'d-' + idx" class="menu-divider">
					<view class="menu-divider__line"></view>
					<text class="menu-divider__label">{{ group.label }}</text>
					<view class="menu-divider__line"></view>
				</view>
				<!-- 菜单组 -->
				<vk-data-menu-nav
					v-else-if="group.items.length > 0"
					:key="'m-' + idx"
					:data="group.items"
					:unique-opened="true"
					:collapse="vk.getVuex('$app.leftCollapse')"
					:collapse-transition="false"
					:theme="menuTheme"
					default-menu-icon="el-icon-folder-opened"
					default-sub-menu-icon="el-icon-tickets"
					@select="select"
				></vk-data-menu-nav>
			</template>
		</template>
	</scroll-view>
</template>

<script>
	import config from "@/app.config.js";
	export default {
		data() {
			return {
				menuTheme: {
					use: "runtime",
					runtime: {
						leftMenu: {
							backgroundColor: "var(--vk-bg-secondary)",
							subBackgroundColor: "var(--vk-bg-secondary)",
							textColor: "var(--vk-text)",
							activeTextColor: "var(--vk-primary)",
							activeBackgroundColor: "var(--vk-primary-light)",
							hoverTextColor: "var(--vk-text)",
							hoverBackgroundColor: "var(--vk-bg-muted)",
							collapseActiveTextColor: "var(--vk-primary)",
							collapseActiveBackgroundColor: "var(--vk-primary-light)"
						}
					}
				}
			}
		},
		methods: {
			select(e){

			},
		},
		// 监听属性
		watch: {
			$route: {
				immediate: true,
				handler(newRoute, oldRoute) {
					let that = this;
					let { vk } = that;
					let { path , query } = newRoute;
					let url = path + vk.pubfn.queryParams(query);
					let route = { path, query, url };
					vk.setVuex('$app.route', route);
				}
			}
		},
		// 计算属性
		computed: {
			menuGroups() {
				let navMenu = vk.getVuex('$app.navMenu') || [];
				let userInfo = vk.getVuex('$user.userInfo') || {};
				let isAdmin = userInfo.role && userInfo.role.includes('admin');
				let isDev = process.env.NODE_ENV !== 'production';
				let groups = [];
				let current = [];

				for (let i = 0; i < navMenu.length; i++) {
					let item = navMenu[i];
					if (item.type === 'divider') {
						// 非管理员不显示管理员专属分割线
						if (item.menu_id === '__divider_admin__' && !isAdmin) {
							continue;
						}
						// 非开发环境不显示开发环境专属分割线
						if (item.menu_id === '__divider_dev__' && !isDev) {
							continue;
						}
						if (current.length > 0) {
							groups.push({ items: current });
							current = [];
						}
						groups.push({ divider: true, label: item.name || '' });
					} else {
						current.push(item);
					}
				}
				if (current.length > 0) {
					groups.push({ items: current });
				}
				return groups;
			},
			styleCom(){
				return {
					backgroundColor: "var(--vk-bg-secondary)",
					color: "var(--vk-text)"
				};
			},
			classCom(){
				let obj = {
					pc: vk.getVuex('$app.isPC'),
					mobile: !vk.getVuex('$app.isPC'),
					collapse: vk.getVuex('$app.leftCollapse'),
				};
				return obj;
			}
		}
	}
</script>

<style lang="scss">
	$sidebar-width: 250px;
	$sidebar-collapse-width: 64px;

	.sidebar {
		position: fixed;
		width: $sidebar-width;
		--sidebar-width: #{$sidebar-width};
		--sidebar-collapse-width: #{$sidebar-collapse-width};
		/* 顶栏 50px 以下铺满到视口底，避免左下角色层 */
		top: 50px;
		height: calc(100vh - 50px);
		box-sizing: border-box;
		box-shadow: none;
		border-top: none;
		border-right: 1px solid var(--vk-border, #e2e8f0);
		background-color: var(--vk-bg-secondary, #f8fafc) !important;
		padding-bottom: 0;
		z-index: 998;
		overflow: hidden;
	}
	.sidebar.collapse{
		width: $sidebar-collapse-width;
	}
	.title {
		margin-left: 5px;
	}
	.center{
		text-align: center;
		margin-top: 100px;
	}

	/* 菜单分割线 */
	.menu-divider {
		display: flex;
		align-items: center;
		padding: 8px 20px;
		gap: 8px;
	}

	.menu-divider__line {
		flex: 1;
		height: 1px;
		background-color: var(--vk-border, #e2e8f0);
	}

	.menu-divider__label {
		font-size: 11px;
		color: var(--vk-text-muted, #94a3b8);
		white-space: nowrap;
		letter-spacing: 1px;
	}

	/* 折叠状态隐藏文字 */
	.sidebar.collapse .menu-divider__label {
		display: none;
	}
	.sidebar.collapse .menu-divider {
		padding: 8px 10px;
	}
</style>

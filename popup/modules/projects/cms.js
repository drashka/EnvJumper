// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { t } from '../i18n.js';
import { generateId } from '../helpers/storage.js';

/** Available CMS identifiers */
export const CMS_IDS = ['none', 'wordpress', 'joomla', 'drupal', 'prestashop', 'magento', 'shopify'];

/** Default admin base path per CMS (PrestaShop only) */
export const CMS_DEFAULT_ADMIN_PATH = {
  prestashop: '/admin-dev',
};

/** Default login path for WordPress */
const WP_LOGIN_PATH = '/wp-login.php';

/**
 * Returns the predefined links for a given CMS.
 * Each link carries a `cmsLinkId` that uniquely identifies its role.
 * @param {string} cms
 * @param {string} [adminPath] - Admin base path (PrestaShop only)
 * @returns {Array}
 */
export function getDefaultCmsLinks(cms, adminPath) {
  switch (cms) {
    case 'wordpress':
      return [
        { id: generateId(), cmsLinkId: 'login',       label: t('cmsLinkLogin'),       path: WP_LOGIN_PATH,                            icon: 'log-in',           order: 0 },
        { id: generateId(), cmsLinkId: 'dashboard',   label: t('cmsLinkDashboard'),   path: '/wp-admin/',                             icon: 'layout-dashboard', order: 1 },
        { id: generateId(), cmsLinkId: 'posts',       label: t('wpLinkPosts'),        path: '/wp-admin/edit.php',                     icon: 'file-text',        order: 2 },
        { id: generateId(), cmsLinkId: 'pages',       label: t('wpLinkPages'),        path: '/wp-admin/edit.php?post_type=page',      icon: 'file',             order: 3 },
        { id: generateId(), cmsLinkId: 'media',       label: t('cmsLinkMedia'),       path: '/wp-admin/upload.php',                   icon: 'image',            order: 4 },
        { id: generateId(), cmsLinkId: 'plugins',     label: t('cmsLinkExtensions'), path: '/wp-admin/plugins.php',                  icon: 'puzzle',           order: 5 },
        { id: generateId(), cmsLinkId: 'appearance',  label: t('wpLinkAppearance'),   path: '/wp-admin/themes.php',                   icon: 'palette',          order: 6 },
        { id: generateId(), cmsLinkId: 'settings',    label: t('cmsLinkSettings'),    path: '/wp-admin/options-general.php',          icon: 'settings',         order: 7 },
        { id: generateId(), cmsLinkId: 'permalinks',  label: t('wpLinkPermalinks'),   path: '/wp-admin/options-permalink.php',        icon: 'link',             order: 8 },
      ];

    case 'joomla':
      return [
        { id: generateId(), cmsLinkId: 'login',         label: t('cmsLinkLogin'),         path: '/administrator/index.php',                            icon: 'log-in',           order: 0 },
        { id: generateId(), cmsLinkId: 'dashboard',     label: t('cmsLinkDashboard'),     path: '/administrator/',                                     icon: 'layout-dashboard', order: 1 },
        { id: generateId(), cmsLinkId: 'articles',      label: t('cmsLinkArticles'),      path: '/administrator/index.php?option=com_content',         icon: 'file-text',        order: 2 },
        { id: generateId(), cmsLinkId: 'categories',    label: t('cmsLinkCategories'),    path: '/administrator/index.php?option=com_categories',      icon: 'folder',           order: 3 },
        { id: generateId(), cmsLinkId: 'media',         label: t('cmsLinkMedia'),         path: '/administrator/index.php?option=com_media',           icon: 'image',            order: 4 },
        { id: generateId(), cmsLinkId: 'extensions',    label: t('cmsLinkExtensions'),    path: '/administrator/index.php?option=com_installer',       icon: 'puzzle',           order: 5 },
        { id: generateId(), cmsLinkId: 'users',         label: t('cmsLinkUsers'),         path: '/administrator/index.php?option=com_users',           icon: 'users',            order: 6 },
        { id: generateId(), cmsLinkId: 'configuration', label: t('cmsLinkConfiguration'), path: '/administrator/index.php?option=com_config',          icon: 'settings',         order: 7 },
      ];

    case 'drupal':
      return [
        { id: generateId(), cmsLinkId: 'login',         label: t('cmsLinkLogin'),          path: '/user/login',       icon: 'log-in',           order: 0 },
        { id: generateId(), cmsLinkId: 'administration', label: t('cmsLinkAdministration'), path: '/admin',            icon: 'layout-dashboard', order: 1 },
        { id: generateId(), cmsLinkId: 'content',       label: t('cmsLinkContent'),        path: '/admin/content',    icon: 'file-text',        order: 2 },
        { id: generateId(), cmsLinkId: 'structure',     label: t('cmsLinkStructure'),      path: '/admin/structure',  icon: 'layers',           order: 3 },
        { id: generateId(), cmsLinkId: 'appearance',    label: t('wpLinkAppearance'),      path: '/admin/appearance', icon: 'palette',          order: 4 },
        { id: generateId(), cmsLinkId: 'modules',       label: t('cmsLinkModules'),        path: '/admin/modules',    icon: 'puzzle',           order: 5 },
        { id: generateId(), cmsLinkId: 'configuration', label: t('cmsLinkConfiguration'), path: '/admin/config',     icon: 'settings',         order: 6 },
        { id: generateId(), cmsLinkId: 'people',        label: t('cmsLinkPeople'),         path: '/admin/people',     icon: 'users',            order: 7 },
        { id: generateId(), cmsLinkId: 'reports',       label: t('cmsLinkReports'),        path: '/admin/reports',    icon: 'bar-chart-2',      order: 8 },
      ];

    case 'prestashop': {
      const base = adminPath || CMS_DEFAULT_ADMIN_PATH.prestashop;
      return [
        { id: generateId(), cmsLinkId: 'login',     label: t('cmsLinkLogin'),     path: `${base}/index.php`,                               icon: 'log-in',           order: 0 },
        { id: generateId(), cmsLinkId: 'dashboard', label: t('cmsLinkDashboard'), path: `${base}/`,                                        icon: 'layout-dashboard', order: 1 },
        { id: generateId(), cmsLinkId: 'orders',    label: t('cmsLinkOrders'),    path: `${base}/index.php?controller=AdminOrders`,        icon: 'shopping-cart',    order: 2 },
        { id: generateId(), cmsLinkId: 'catalog',   label: t('cmsLinkCatalog'),   path: `${base}/index.php?controller=AdminProducts`,      icon: 'package',          order: 3 },
        { id: generateId(), cmsLinkId: 'customers', label: t('cmsLinkCustomers'), path: `${base}/index.php?controller=AdminCustomers`,     icon: 'users',            order: 4 },
        { id: generateId(), cmsLinkId: 'modules',   label: t('cmsLinkModules'),   path: `${base}/index.php?controller=AdminModules`,       icon: 'puzzle',           order: 5 },
        { id: generateId(), cmsLinkId: 'design',    label: t('cmsLinkDesign'),    path: `${base}/index.php?controller=AdminThemes`,        icon: 'palette',          order: 6 },
        { id: generateId(), cmsLinkId: 'settings',  label: t('cmsLinkSettings'),  path: `${base}/index.php?controller=AdminPreferences`,   icon: 'settings',         order: 7 },
      ];
    }

    case 'magento':
      return [
        { id: generateId(), cmsLinkId: 'login',     label: t('cmsLinkLogin'),     path: '/admin/',                     icon: 'log-in',           order: 0 },
        { id: generateId(), cmsLinkId: 'dashboard', label: t('cmsLinkDashboard'), path: '/admin/dashboard/',           icon: 'layout-dashboard', order: 1 },
        { id: generateId(), cmsLinkId: 'catalog',   label: t('cmsLinkCatalog'),   path: '/admin/catalog/product/',     icon: 'package',          order: 2 },
        { id: generateId(), cmsLinkId: 'orders',    label: t('cmsLinkOrders'),    path: '/admin/sales/order/',         icon: 'shopping-cart',    order: 3 },
        { id: generateId(), cmsLinkId: 'customers', label: t('cmsLinkCustomers'), path: '/admin/customer/index/',      icon: 'users',            order: 4 },
        { id: generateId(), cmsLinkId: 'content',   label: t('cmsLinkContent'),   path: '/admin/cms/page/',            icon: 'file-text',        order: 5 },
        { id: generateId(), cmsLinkId: 'system',    label: t('cmsLinkSystem'),    path: '/admin/admin/system_config/', icon: 'settings',         order: 6 },
      ];

    case 'shopify':
      return [
        { id: generateId(), cmsLinkId: 'admin',     label: t('cmsLinkAdmin'),     path: '/admin',           icon: 'layout-dashboard', order: 0 },
        { id: generateId(), cmsLinkId: 'products',  label: t('cmsLinkProducts'),  path: '/admin/products',  icon: 'package',          order: 1 },
        { id: generateId(), cmsLinkId: 'orders',    label: t('cmsLinkOrders'),    path: '/admin/orders',    icon: 'shopping-cart',    order: 2 },
        { id: generateId(), cmsLinkId: 'customers', label: t('cmsLinkCustomers'), path: '/admin/customers', icon: 'users',            order: 3 },
        { id: generateId(), cmsLinkId: 'themes',    label: t('cmsLinkThemes'),    path: '/admin/themes',    icon: 'palette',          order: 4 },
        { id: generateId(), cmsLinkId: 'apps',      label: t('cmsLinkApps'),      path: '/admin/apps',      icon: 'puzzle',           order: 5 },
        { id: generateId(), cmsLinkId: 'settings',  label: t('cmsLinkSettings'),  path: '/admin/settings',  icon: 'settings',         order: 6 },
      ];

    default:
      return [];
  }
}

/**
 * Returns the 6 predefined WP network links for WordPress Multisite.
 * @returns {Array}
 */
export function getDefaultNetworkLinks() {
  return [
    { id: generateId(), cmsLinkId: 'network-admin',    label: t('wpNetworkAdminLink'),    path: '/wp-admin/network/',              icon: 'network',  order: 20 },
    { id: generateId(), cmsLinkId: 'network-plugins',  label: t('wpNetworkPluginsLink'),  path: '/wp-admin/network/plugins.php',   icon: 'puzzle',   order: 21 },
    { id: generateId(), cmsLinkId: 'network-themes',   label: t('wpNetworkThemesLink'),   path: '/wp-admin/network/themes.php',    icon: 'palette',  order: 22 },
    { id: generateId(), cmsLinkId: 'network-sites',    label: t('wpNetworkSitesLink'),    path: '/wp-admin/network/sites.php',     icon: 'globe',    order: 23 },
    { id: generateId(), cmsLinkId: 'network-users',    label: t('wpNetworkUsersLink'),    path: '/wp-admin/network/users.php',     icon: 'users',    order: 24 },
    { id: generateId(), cmsLinkId: 'network-settings', label: t('wpNetworkSettingsLink'), path: '/wp-admin/network/settings.php', icon: 'settings', order: 25 },
  ];
}

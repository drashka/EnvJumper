// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { t } from './i18n.js';
import { generateId } from './storage.js';

/** Identifiants CMS disponibles */
export const CMS_IDS = ['none', 'wordpress', 'joomla', 'drupal', 'prestashop', 'magento', 'shopify'];

/** Chemin de connexion par défaut selon le CMS */
export const CMS_DEFAULT_LOGIN_PATH = {
  wordpress:   '/wp-login.php',
  joomla:      '/administrator/index.php',
  drupal:      '/user/login',
  prestashop:  '/admin-dev/index.php',
  magento:     '/admin/',
  shopify:     '/admin',
};

/** Chemin admin de base par défaut (utilisé pour PrestaShop) */
export const CMS_DEFAULT_ADMIN_PATH = {
  prestashop: '/admin-dev',
};

/**
 * Retourne les liens prédéfinis pour un CMS donné.
 * @param {string} cms - Identifiant du CMS
 * @param {string} [loginPath] - Chemin de connexion personnalisé
 * @param {string} [adminPath] - Chemin admin de base (pour PrestaShop)
 * @returns {Array}
 */
export function getDefaultCmsLinks(cms, loginPath, adminPath) {
  const login = loginPath || CMS_DEFAULT_LOGIN_PATH[cms] || '/';
  const admin = adminPath || CMS_DEFAULT_ADMIN_PATH[cms] || '';

  switch (cms) {
    case 'wordpress':
      return [
        { id: `wp-login-${generateId()}`,    label: t('cmsLinkLogin'),       path: login,                                    type: 'cms', icon: 'log-in',           order: 0 },
        { id: `wp-dash-${generateId()}`,     label: t('cmsLinkDashboard'),   path: '/wp-admin/',                             type: 'cms', icon: 'layout-dashboard', order: 1 },
        { id: `wp-posts-${generateId()}`,    label: t('wpLinkPosts'),        path: '/wp-admin/edit.php',                     type: 'cms', icon: 'file-text',        order: 2 },
        { id: `wp-pages-${generateId()}`,    label: t('wpLinkPages'),        path: '/wp-admin/edit.php?post_type=page',      type: 'cms', icon: 'file',             order: 3 },
        { id: `wp-media-${generateId()}`,    label: t('cmsLinkMedia'),       path: '/wp-admin/upload.php',                   type: 'cms', icon: 'image',            order: 4 },
        { id: `wp-plugins-${generateId()}`,  label: t('cmsLinkExtensions'),  path: '/wp-admin/plugins.php',                  type: 'cms', icon: 'puzzle',           order: 5 },
        { id: `wp-themes-${generateId()}`,   label: t('wpLinkAppearance'),   path: '/wp-admin/themes.php',                   type: 'cms', icon: 'palette',          order: 6 },
        { id: `wp-settings-${generateId()}`, label: t('cmsLinkSettings'),    path: '/wp-admin/options-general.php',          type: 'cms', icon: 'settings',         order: 7 },
        { id: `wp-perma-${generateId()}`,    label: t('wpLinkPermalinks'),   path: '/wp-admin/options-permalink.php',        type: 'cms', icon: 'link',             order: 8 },
      ];

    case 'joomla':
      return [
        { id: `joomla-login-${generateId()}`, label: t('cmsLinkLogin'),         path: '/administrator/index.php',                            type: 'cms', icon: 'log-in',           order: 0 },
        { id: `joomla-dash-${generateId()}`,  label: t('cmsLinkDashboard'),     path: '/administrator/',                                     type: 'cms', icon: 'layout-dashboard', order: 1 },
        { id: `joomla-art-${generateId()}`,   label: t('cmsLinkArticles'),      path: '/administrator/index.php?option=com_content',         type: 'cms', icon: 'file-text',        order: 2 },
        { id: `joomla-cat-${generateId()}`,   label: t('cmsLinkCategories'),    path: '/administrator/index.php?option=com_categories',      type: 'cms', icon: 'folder',           order: 3 },
        { id: `joomla-med-${generateId()}`,   label: t('cmsLinkMedia'),         path: '/administrator/index.php?option=com_media',           type: 'cms', icon: 'image',            order: 4 },
        { id: `joomla-ext-${generateId()}`,   label: t('cmsLinkExtensions'),    path: '/administrator/index.php?option=com_installer',       type: 'cms', icon: 'puzzle',           order: 5 },
        { id: `joomla-usr-${generateId()}`,   label: t('cmsLinkUsers'),         path: '/administrator/index.php?option=com_users',           type: 'cms', icon: 'users',            order: 6 },
        { id: `joomla-cfg-${generateId()}`,   label: t('cmsLinkConfiguration'), path: '/administrator/index.php?option=com_config',          type: 'cms', icon: 'settings',         order: 7 },
      ];

    case 'drupal':
      return [
        { id: `drupal-login-${generateId()}`, label: t('cmsLinkLogin'),          path: '/user/login',      type: 'cms', icon: 'log-in',           order: 0 },
        { id: `drupal-adm-${generateId()}`,   label: t('cmsLinkAdministration'), path: '/admin',           type: 'cms', icon: 'layout-dashboard', order: 1 },
        { id: `drupal-cnt-${generateId()}`,   label: t('cmsLinkContent'),        path: '/admin/content',   type: 'cms', icon: 'file-text',        order: 2 },
        { id: `drupal-str-${generateId()}`,   label: t('cmsLinkStructure'),      path: '/admin/structure', type: 'cms', icon: 'layers',           order: 3 },
        { id: `drupal-app-${generateId()}`,   label: t('wpLinkAppearance'),      path: '/admin/appearance',type: 'cms', icon: 'palette',          order: 4 },
        { id: `drupal-mod-${generateId()}`,   label: t('cmsLinkModules'),        path: '/admin/modules',   type: 'cms', icon: 'puzzle',           order: 5 },
        { id: `drupal-cfg-${generateId()}`,   label: t('cmsLinkConfiguration'), path: '/admin/config',    type: 'cms', icon: 'settings',         order: 6 },
        { id: `drupal-ppl-${generateId()}`,   label: t('cmsLinkPeople'),         path: '/admin/people',    type: 'cms', icon: 'users',            order: 7 },
        { id: `drupal-rep-${generateId()}`,   label: t('cmsLinkReports'),        path: '/admin/reports',   type: 'cms', icon: 'bar-chart-2',      order: 8 },
      ];

    case 'prestashop': {
      const base = admin || '/admin-dev';
      return [
        { id: `ps-login-${generateId()}`, label: t('cmsLinkLogin'),     path: `${base}/index.php`,                               type: 'cms', icon: 'log-in',           order: 0 },
        { id: `ps-dash-${generateId()}`,  label: t('cmsLinkDashboard'), path: `${base}/`,                                        type: 'cms', icon: 'layout-dashboard', order: 1 },
        { id: `ps-ord-${generateId()}`,   label: t('cmsLinkOrders'),    path: `${base}/index.php?controller=AdminOrders`,        type: 'cms', icon: 'shopping-cart',    order: 2 },
        { id: `ps-cat-${generateId()}`,   label: t('cmsLinkCatalog'),   path: `${base}/index.php?controller=AdminProducts`,      type: 'cms', icon: 'package',          order: 3 },
        { id: `ps-cust-${generateId()}`,  label: t('cmsLinkCustomers'), path: `${base}/index.php?controller=AdminCustomers`,     type: 'cms', icon: 'users',            order: 4 },
        { id: `ps-mod-${generateId()}`,   label: t('cmsLinkModules'),   path: `${base}/index.php?controller=AdminModules`,       type: 'cms', icon: 'puzzle',           order: 5 },
        { id: `ps-des-${generateId()}`,   label: t('cmsLinkDesign'),    path: `${base}/index.php?controller=AdminThemes`,        type: 'cms', icon: 'palette',          order: 6 },
        { id: `ps-set-${generateId()}`,   label: t('cmsLinkSettings'),  path: `${base}/index.php?controller=AdminPreferences`,   type: 'cms', icon: 'settings',         order: 7 },
      ];
    }

    case 'magento':
      return [
        { id: `mag-login-${generateId()}`, label: t('cmsLinkLogin'),     path: '/admin/',                    type: 'cms', icon: 'log-in',           order: 0 },
        { id: `mag-dash-${generateId()}`,  label: t('cmsLinkDashboard'), path: '/admin/dashboard/',          type: 'cms', icon: 'layout-dashboard', order: 1 },
        { id: `mag-cat-${generateId()}`,   label: t('cmsLinkCatalog'),   path: '/admin/catalog/product/',    type: 'cms', icon: 'package',          order: 2 },
        { id: `mag-ord-${generateId()}`,   label: t('cmsLinkOrders'),    path: '/admin/sales/order/',        type: 'cms', icon: 'shopping-cart',    order: 3 },
        { id: `mag-cust-${generateId()}`,  label: t('cmsLinkCustomers'), path: '/admin/customer/index/',     type: 'cms', icon: 'users',            order: 4 },
        { id: `mag-cnt-${generateId()}`,   label: t('cmsLinkContent'),   path: '/admin/cms/page/',           type: 'cms', icon: 'file-text',        order: 5 },
        { id: `mag-sys-${generateId()}`,   label: t('cmsLinkSystem'),    path: '/admin/admin/system_config/',type: 'cms', icon: 'settings',         order: 6 },
      ];

    case 'shopify':
      return [
        { id: `sfy-adm-${generateId()}`,  label: t('cmsLinkAdmin'),     path: '/admin',           type: 'cms', icon: 'layout-dashboard', order: 0 },
        { id: `sfy-pro-${generateId()}`,  label: t('cmsLinkProducts'),  path: '/admin/products',  type: 'cms', icon: 'package',          order: 1 },
        { id: `sfy-ord-${generateId()}`,  label: t('cmsLinkOrders'),    path: '/admin/orders',    type: 'cms', icon: 'shopping-cart',    order: 2 },
        { id: `sfy-cust-${generateId()}`, label: t('cmsLinkCustomers'), path: '/admin/customers', type: 'cms', icon: 'users',            order: 3 },
        { id: `sfy-thm-${generateId()}`,  label: t('cmsLinkThemes'),    path: '/admin/themes',    type: 'cms', icon: 'palette',          order: 4 },
        { id: `sfy-app-${generateId()}`,  label: t('cmsLinkApps'),      path: '/admin/apps',      type: 'cms', icon: 'puzzle',           order: 5 },
        { id: `sfy-set-${generateId()}`,  label: t('cmsLinkSettings'),  path: '/admin/settings',  type: 'cms', icon: 'settings',         order: 6 },
      ];

    default:
      return [];
  }
}

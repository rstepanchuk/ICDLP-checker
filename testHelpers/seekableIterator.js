'use strict';

const CLASSES_WITH_SEEKABLE_ITERATOR = {
    CustomerMgr: ['queryProfiles', 'searchProfiles'],
    OrderMgr: ['queryOrders', 'searchOrders'],
    ProductMgr: ['queryAllSiteProducts', 'queryProductsInCatalog', 'queryAllSiteProductsSorted', 'queryProductsInCatalogSorted'],
    ProductListMgr: ['queryProductLists'],
    SystemObjectMgr: ['querySystemObjects', 'getAllSystemObjects'],
    CustomObjectMgr: ['queryCustomObjects', 'getAllCustomObjects']
};
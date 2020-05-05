const config = require('./config');

// VARIABLES TO EASILY CUSTOMIZE SOME CONSTANTS *****************************************************
const ALLOWED_IMPORTS_PATTERNS = ['*/', './', '../', '~/', 'dw/', 'server']; // patterns which considered as valid import
const METHODS_WITH_SEEKABLE_ITERATOR = { // Methods that can return seekable iterator (updated 10.04.2020)
    CustomerMgr: ['queryProfiles', 'searchProfiles'],
    OrderMgr: ['queryOrders', 'searchOrders'],
    ProductMgr: ['queryAllSiteProducts', 'queryProductsInCatalog', 'queryAllSiteProductsSorted', 'queryProductsInCatalogSorted'],
    ProductListMgr: ['queryProductLists'],
    SystemObjectMgr: ['querySystemObjects', 'getAllSystemObjects'],
    CustomObjectMgr: ['queryCustomObjects', 'getAllCustomObjects']
};

// UTILITY CONSTANTS THAT ARE USED FOR GENERATING EXPORT**********************************************
const PLACEHOLDER = '<%vars>';
const METHOD_PLACEHOLDER = '<%meth>'
const COMMENT_MASK = `(^\\s*\\*.*|.*//.*|/\\*\\*?)`;
const HARD_CODED_URL = '.*https?://.*';
const ALLOWED_IMPORTS_REGEXP_ADAPTED = ALLOWED_IMPORTS_PATTERNS.map(pattern => pattern.replace(/\.|\*|\//g, '\\$&'));// same as ALLOWED_IMPORTS_PATTERNS but transformed to regex format
const FUNCTION_MASK = 'function\\s?(\\w+)\\s?\\(';

module.exports = {
    // common
    TABLE_OF_CONTENTS_MAKS: 'table\\sof\\scontents?\\s?',
    PLACEHOLDER,
    METHOD_PLACEHOLDER,
    FUNCTION_MASK,
    METHOD_CALLED_MASK: `(${PLACEHOLDER})\\.(${METHOD_PLACEHOLDER})`,
    METHOD_CALL_SAVED_TO_VAR_MASK: `(\\w+)\\s?=\\s?.*(${PLACEHOLDER})\\.(${METHOD_PLACEHOLDER})`,
    DW_IMPORTED_CLASS_VARIABLE: `(\\w+)\\s?=\\s?.*${PLACEHOLDER}(?!\\.|['"]\\)\\.)`,
    DW_IMPORTED_CLASS_DIRECT: `(${PLACEHOLDER}(?:["']\\))?)\\.`, // TO USE ONLY IN HELPERS TO FIND METHODS CALLS AS AN ADDITION TO VARIABLES ARRAY!
                                                                // used to search cases when methods called from class directy e.g. dw.order.OrderMgr.createOrder or require('dw/order/OrderMgr').createOrder
    SFRA_CONTROLLER_MASK: 'server\\.(?:get|post|use|repend|append|replace|extend)\\([^\\w]*(?:\'|")(\\w+)',
    FUNCTION_WITH_DESCRIPTION_MASK: `\\/\\*\\*(?:\\s|.)+?\\*\\/\\s+${FUNCTION_MASK}`,
    NEW_LINE: '^',

    //general/documenation.js
    SFRA_SPECIFIC_VERSTION_MASK: `sfra\\D*${config.sfra}`,
    SFRA_ANY_VERSION_MASK: `sfra\\D*(\\d\\.\\d.\\d)`,
    PLATFORM_SPECIFIC_VERSION_MASK: `(sfcc|salesforce|api|platform)\\D*${config.platform}`,
    PLATFORM_ANY_VERSION_MASK: `(sfcc|salesforce|api|platform)\\D*(\\d{2}\\.\\d{1,2})`,
    SITEGEN_SPECIFIC_VERSION_MASK: `(sitegen|genes|sg)\\D{0,25}${config.genesis}`,
    SITEGEN_ANY_VERSION_MASK: `(sitegen|genes|sg)\\D{0,25}(\\d{3}\\.\\d{1,2}.\\d{1,2})`,
    COMPATIBILITY_SPECIFIC_VERSION_MASK: `compatibility\\D*${config.compatibility}`,
    COMPATIBILITY_ANY_VERSION_MASK: `compatibility\\D*(\\d{2}\\.\\d{1,2})`,
    MINIMAL_AVAILABILITY_SECTION_LENGTH: 100,
    
    //code_items/general.js
    INVALID_REQUIRE_MASK: `require\\(('|")(?!${ALLOWED_IMPORTS_REGEXP_ADAPTED.join('|')})[^)]+?\\)`,
    TODO_MASK: 'TODO.*',
    SESSION_VARIABLE_MASK: '([A-z]+)\\s?=\\s?request\\.getSession\\(\\)[^.]', // for cases if session was saved as variable with another name
    SESSION_CUSTOM_MASK: `^.*?(${PLACEHOLDER}session|request.getSession\\(\\))\\.(custom\\W|getCustom\\(\\)).*?$`,
    READER_WRITER_VARIABLE_MASK: '([A-z]+)(\\s:\\s[A-z]+)?\\s?=\\s?new\\s([A-z.]+)?(Reader|Writer)\\(',
    CLOSED_VARIABLE_MASK: `(${PLACEHOLDER})\\.close\\(\\)`,
    METHODS_WITH_SEEKABLE_ITERATOR,
    CARTRIDGE_VERSION: `${config.version}`,

    //code_items/fileNames.js
    ROW_MAX_LENGTH: 130,
    CAMEL_CASE_MASK: '^[a-z]+([A-Z]+[a-z]+)+\.[a-z]+$',
    PASCAL_CASE_MASK: '^([A-Z]+[a-z]+)+\.[a-z]+$',

    //code_items/services.js
    SERVICE_REGISTRY_MASK: '.*dw[\\/\\.]svc[\\/\\.]ServiceRegistry.*',
    LOCAL_SERVICE_REGISTRY_MASK: '.*dw[\\/\\.]svc[\\/\\.](Local)?ServiceRegistry.*',
    SERVICE_CREATED_MASK: `(?:${PLACEHOLDER}(?:Local)?ServiceRegistry(?:["']\\))?)\\.createService\\(['"]?([\\w.]+)['"]?\\s?,\\s?\\{`,
    FILTER_LOG_MESSAGE_METHOD: 'filterLogMessage:\\s?function\\s?\\(',
    GET_REQUEST_LOG_MESSAGE_METHOD: 'getRequestLogMessage:\\s?function\\s?\\(',
    GET_RESPONSE_LOG_MESSAGE_METHOD: 'getResponseLogMessage:\\s?function\\s?\\(',


    //code_items/clientSideJS.js
    HARD_CODED_URL,
    COMMENTED_HARD_CODED_URL: `${COMMENT_MASK}${HARD_CODED_URL}`,

    //code_items/clientSideSCSS.js
    MAXIMUM_ALLOWED_SIZE_IN_PX: 5,
    SIZE_IN_PX: '.*?(\\d{1,5})px',
    IMPORTANT_CSS: '.*!important.*',
    Z_INDEX_CSS: 'z-index:.*',

    //code_items/controllers.js
    TEST_METHOD_MASK: '\\bit\\s?\\([^\\w]*(?:\'|")',
    SFRA_REPLACED_CONTROLLER_MASK: 'server\\.replace\\([^\\w]*(?:\'|")(\\w+)',
    SG_CALLED_CONTROLLER: 'app\\.getController\\([\'"](\\w+)[\'"]\\)',

    //code_items/models.js
    SUPER_CALLED_MASK: 'super\\.call\\(',

    //code_items/templates.js
    TAG_START_BOUNDARY_MASK: '<\\S',
    HARDCODED_STRING_IN_TEMPLATE_MASK: '^\\s*[^$<\\s][^<]*',
    ISCACHE_TAG_MASK: '<iscache[^>]*>',
    ENCODING_OFF_MASK: 'encoding\\s?=\\s?[\'"]off[\'"]'
}
var assert = require('chai').assert;
var sourceFiles = require('../../util/sourceFiles');

describe('Repo Layout', function() {
    it('"base" path inside package.json should lead to sibling folder ../storefront-reference-architecture/cartridges/app_storefront_base/', function() {
      const pathTemplate = new RegExp("^..\/storefront-reference-architecture\/cartridges\/app_storefront_base\/?$")
      if (sourceFiles.json.paths) {
        assert.isTrue(pathTemplate.test(sourceFiles.json.paths.base));
      }
    });
});


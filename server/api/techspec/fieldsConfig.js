'use strict';

module.exports = {
    'EXPORT_TECHSPEC_CATEGORY': {
        "Category Name": {key: "categoryName"},
        "Field Name": {key: "fieldName"},
        "Field Type": {key: "fieldType"},
        "Updated At": {key: "updatedAt",type:'date'},
        "Created At": {key: "createdAt",type:'date'}
    },
    'EXPORT_TECHSPEC_BRAND': {
        "Category Name": {key: "category.name"},
        "Brand Name": {key: "brand.name"},
        "Model Name": {key: "model.name"},
        "Field Name": {key: "name"},
        "Field Type": {key: "type"},
        "Field Value": {key: "value"},
        "Visible on Front": {key: "isFront",type:'boolean'}
//        "Updated At": {key: "updatedAt",type:'date'},
//        "Created At": {key: "createdAt",type:'date'}
    }
};